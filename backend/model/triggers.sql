-- =============================================================================
-- triggers.sql — Business Logic Triggers
-- Run this AFTER schema.sql
-- =============================================================================

-- =============================================================================
-- TRIGGER 1: Quotation submitted → mark rfq_vendors row as 'quoted'
--
-- When a vendor submits a quotation, their slot in rfq_vendors should flip
-- from 'pending' to 'quoted' so the procurement officer's vendor list
-- and the vendor's own RFQ status view are accurate.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_quotation_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act on INSERT (new quotation) or status changing TO 'submitted'
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status <> 'submitted' AND NEW.status = 'submitted') THEN
        UPDATE rfq_vendors
        SET status = 'quoted'
        WHERE rfq_id = NEW.rfq_id
          AND vendor_id = NEW.vendor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_quotation_submitted
    AFTER INSERT OR UPDATE OF status ON quotations
    FOR EACH ROW EXECUTE FUNCTION trg_quotation_submitted();


-- =============================================================================
-- TRIGGER 2: PO generated → award the RFQ, accept winning quotation,
--            reject all other submitted/shortlisted quotations on that RFQ
--
-- This is the most important state-fan-out in the system. A single PO
-- insert needs to cascade status across rfqs, quotations, and rfq_vendors.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_po_generated()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark the RFQ as awarded
    UPDATE rfqs
    SET status = 'awarded',
        updated_at = NOW()
    WHERE id = NEW.rfq_id;

    -- Accept the winning quotation
    UPDATE quotations
    SET status = 'accepted',
        updated_at = NOW()
    WHERE id = NEW.quotation_id;

    -- Reject every other quotation on this RFQ that is still open
    UPDATE quotations
    SET status = 'rejected',
        updated_at = NOW()
    WHERE rfq_id = NEW.rfq_id
      AND id <> NEW.quotation_id
      AND status IN ('submitted', 'under_review', 'shortlisted');

    -- Mark winning vendor slot as 'awarded' in rfq_vendors
    UPDATE rfq_vendors
    SET status = 'awarded'
    WHERE rfq_id = NEW.rfq_id
      AND vendor_id = NEW.vendor_id;

    -- Close out all other vendor slots on this RFQ
    UPDATE rfq_vendors
    SET status = 'closed'
    WHERE rfq_id = NEW.rfq_id
      AND vendor_id <> NEW.vendor_id
      AND status <> 'awarded';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_po_generated
    AFTER INSERT ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION trg_po_generated();


-- =============================================================================
-- TRIGGER 3: PO status changes → stamp delivery timestamps
--
-- Stamps acknowledged_at / in_transit_at / delivered_at / cancelled_at
-- exactly once (NULLIF guard prevents overwriting if status bounces).
-- These timestamps feed the on_time_delivery_rate calculation in the
-- vendor_performance view.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_po_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    CASE NEW.status
        WHEN 'acknowledged' THEN
            NEW.acknowledged_at := COALESCE(OLD.acknowledged_at, NOW());
        WHEN 'in_transit' THEN
            NEW.in_transit_at := COALESCE(OLD.in_transit_at, NOW());
        WHEN 'delivered' THEN
            NEW.delivered_at := COALESCE(OLD.delivered_at, NOW());
        WHEN 'cancelled' THEN
            NEW.cancelled_at := COALESCE(OLD.cancelled_at, NOW());
        ELSE
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_before_po_status_change
    BEFORE UPDATE OF status ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION trg_po_status_timestamp();


-- =============================================================================
-- TRIGGER 4: PO status changes → write a row to po_status_history
--
-- Fires AFTER the UPDATE so it reads the already-committed NEW values.
-- The changed_by column is populated from the RLS session variable so the
-- trigger knows who made the change without needing it passed explicitly.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_po_status_history()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID;
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Read the actor from the session variable set by the Express layer
    BEGIN
        v_actor := current_setting('app.current_user_id', TRUE)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_actor := NULL;
    END;

    INSERT INTO po_status_history (po_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, v_actor);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_po_status_change
    AFTER UPDATE OF status ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION trg_po_status_history();


-- =============================================================================
-- TRIGGER 5: PO delivered → refresh cached vendor performance columns
--
-- Recomputes cached_total_orders, cached_on_time_delivery_rate on the
-- vendors row every time a PO is marked delivered or cancelled.
-- Runs on the vendor that owns the PO only, so it's a single-row update.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_refresh_vendor_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recompute when a terminal delivery state is reached
    IF NEW.status NOT IN ('delivered', 'cancelled') THEN
        RETURN NEW;
    END IF;
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    UPDATE vendors v
    SET
        cached_total_orders = stats.total_orders,
        cached_on_time_delivery_rate = stats.on_time_rate,
        updated_at = NOW()
    FROM (
        SELECT
            COUNT(*)                                                AS total_orders,
            ROUND(
                100.0 * COUNT(*) FILTER (
                    WHERE delivered_at IS NOT NULL
                      AND delivered_at::DATE <= expected_delivery_date
                ) / NULLIF(COUNT(*) FILTER (WHERE delivered_at IS NOT NULL), 0),
                1
            )                                                       AS on_time_rate
        FROM purchase_orders
        WHERE vendor_id = NEW.vendor_id
          AND status IN ('delivered', 'cancelled')
    ) stats
    WHERE v.id = NEW.vendor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_po_delivered
    AFTER UPDATE OF status ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION trg_refresh_vendor_cache();


-- =============================================================================
-- TRIGGER 6: Invoice paid → refresh vendor cached_total_orders
--            (counts confirmed revenue orders, not just delivered ones)
--
-- Also bumps updated_at on the vendor so cache-invalidation in the app
-- layer can use a simple updated_at comparison.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
        RETURN NEW;
    END IF;

    -- Touch the vendor updated_at so app-layer caches know to re-fetch
    UPDATE vendors
    SET updated_at = NOW()
    WHERE id = NEW.vendor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_invoice_paid
    AFTER UPDATE OF status ON invoices
    FOR EACH ROW EXECUTE FUNCTION trg_invoice_paid();


-- =============================================================================
-- TRIGGER 7: Approval action → notify the requesting procurement officer
--
-- Inserts a notification row when a manager approves or rejects.
-- The notification_type is 'approval'. The org_id comes from the
-- approval_requests row so no session variable is needed here.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_rfq_number    TEXT;
    v_title         TEXT;
    v_message       TEXT;
BEGIN
    -- Only fire when status actually changes to a terminal state
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    IF NEW.status NOT IN ('approved', 'rejected') THEN
        RETURN NEW;
    END IF;

    -- Fetch the human-readable RFQ number for the message
    SELECT rfq_number INTO v_rfq_number
    FROM rfqs WHERE id = NEW.rfq_id;

    IF NEW.status = 'approved' THEN
        v_title   := 'Approval Granted';
        v_message := 'Your procurement request for ' || v_rfq_number || ' has been approved. You may now generate the Purchase Order.';
    ELSE
        v_title   := 'Approval Rejected';
        v_message := 'Your procurement request for ' || v_rfq_number || ' was rejected.' ||
                     CASE WHEN NEW.remarks IS NOT NULL THEN ' Reason: ' || NEW.remarks ELSE '' END;
    END IF;

    INSERT INTO notifications (org_id, user_id, type, title, message, entity_type, entity_id)
    VALUES (
        NEW.org_id,
        NEW.requested_by,
        'approval',
        v_title,
        v_message,
        'rfq',
        NEW.rfq_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_approval_action
    AFTER UPDATE OF status ON approval_requests
    FOR EACH ROW EXECUTE FUNCTION trg_approval_notification();


-- =============================================================================
-- TRIGGER 8: New quotation received → notify the procurement officer
--            who created the RFQ
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_quotation_received_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_rfq_number    TEXT;
    v_vendor_name   TEXT;
    v_created_by    UUID;
    v_org_id        UUID;
BEGIN
    -- Only on fresh inserts
    IF TG_OP <> 'INSERT' THEN
        RETURN NEW;
    END IF;

    SELECT r.rfq_number, r.created_by, r.org_id
    INTO v_rfq_number, v_created_by, v_org_id
    FROM rfqs r WHERE r.id = NEW.rfq_id;

    SELECT company_name INTO v_vendor_name
    FROM vendors WHERE id = NEW.vendor_id;

    INSERT INTO notifications (org_id, user_id, type, title, message, entity_type, entity_id)
    VALUES (
        v_org_id,
        v_created_by,
        'quotation',
        'New Quotation Received',
        v_vendor_name || ' submitted a quotation for ' || v_rfq_number || '.',
        'quotation',
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_quotation_insert
    AFTER INSERT ON quotations
    FOR EACH ROW EXECUTE FUNCTION trg_quotation_received_notification();


-- =============================================================================
-- TRIGGER 9: PO generated → notify the vendor
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_po_vendor_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_vendor_user_id    UUID;
    v_org_id            UUID;
BEGIN
    -- Find the vendor's user account
    SELECT id INTO v_vendor_user_id
    FROM users
    WHERE vendor_id = NEW.vendor_id
      AND role = 'vendor'
      AND is_active = TRUE
    LIMIT 1;

    IF v_vendor_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT org_id INTO v_org_id FROM purchase_orders WHERE id = NEW.id;

    INSERT INTO notifications (org_id, user_id, type, title, message, entity_type, entity_id)
    VALUES (
        NEW.org_id,
        v_vendor_user_id,
        'po',
        'Purchase Order Received',
        'A new Purchase Order ' || NEW.po_number || ' has been issued to you. Please acknowledge.',
        'po',
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_po_insert
    AFTER INSERT ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION trg_po_vendor_notification();


-- =============================================================================
-- TRIGGER 10: Invoice submitted → notify procurement officer
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_invoice_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_po_created_by     UUID;
    v_vendor_name       TEXT;
    v_invoice_number    TEXT;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- Notify whoever created the PO (the procurement officer)
    SELECT created_by INTO v_po_created_by
    FROM purchase_orders WHERE id = NEW.po_id;

    SELECT company_name INTO v_vendor_name
    FROM vendors WHERE id = NEW.vendor_id;

    INSERT INTO notifications (org_id, user_id, type, title, message, entity_type, entity_id)
    VALUES (
        NEW.org_id,
        v_po_created_by,
        'invoice',
        'Invoice Received',
        v_vendor_name || ' submitted invoice ' || NEW.invoice_number || '. Please review and process payment.',
        'invoice',
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_invoice_insert
    AFTER INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION trg_invoice_notification();