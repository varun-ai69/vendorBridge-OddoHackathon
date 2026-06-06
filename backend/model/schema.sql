-- =============================================================================
-- Procurement Management System — schema.sql
-- Engine   : PostgreSQL 15+
-- Strategy : Row Level Security (RLS) on every tenant-scoped table
-- Auth     : JWT claims read via current_setting('app.current_user_id') etc.
--            Set these at the start of every DB session from the Express layer:
--              SET LOCAL app.current_user_id  = '<uuid>';
--              SET LOCAL app.current_org_id   = '<uuid>';
--              SET LOCAL app.current_role     = 'procurement_officer';
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for search


-- ---------------------------------------------------------------------------
-- Custom types
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'admin',
    'procurement_officer',
    'manager',
    'vendor'
);

CREATE TYPE rfq_status AS ENUM (
    'draft',
    'sent',
    'closed',
    'awarded',
    'cancelled'
);

CREATE TYPE rfq_vendor_status AS ENUM (
    'pending',
    'quoted',
    'closed',
    'awarded'
);

CREATE TYPE quotation_status AS ENUM (
    'submitted',
    'under_review',
    'shortlisted',
    'rejected',
    'accepted'
);

CREATE TYPE approval_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE approval_priority AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE po_status AS ENUM (
    'generated',
    'acknowledged',
    'in_transit',
    'delivered',
    'cancelled'
);

CREATE TYPE invoice_status AS ENUM (
    'pending',
    'paid',
    'overdue',
    'disputed'
);

CREATE TYPE notification_type AS ENUM (
    'rfq',
    'quotation',
    'approval',
    'po',
    'invoice'
);

CREATE TYPE entity_type AS ENUM (
    'rfq',
    'quotation',
    'po',
    'invoice',
    'user',
    'vendor'
);

CREATE TYPE document_type AS ENUM (
    'rfq',
    'quotation',
    'po',
    'invoice'
);


-- =============================================================================
-- SECTION 1: ORGANIZATIONS
-- Not tenant-scoped (it IS the tenant). No RLS needed.
-- =============================================================================

CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    address     TEXT,
    gst         TEXT UNIQUE,
    industry    TEXT,
    website     TEXT,
    logo_url    TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 2: USERS
-- Covers all roles including vendor (role = 'vendor').
-- Vendors get a vendor_id FK populated; internal users leave it NULL.
-- =============================================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name                TEXT NOT NULL,
    email               TEXT NOT NULL,
    password_hash       TEXT NOT NULL,
    role                user_role NOT NULL,

    -- Internal-user fields (NULL for vendors)
    phone               TEXT,
    department          TEXT,
    avatar_url          TEXT,

    -- Vendor-user link (NULL for internal users)
    vendor_id           UUID,   -- FK added after vendors table is created

    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Email must be unique within an org
    UNIQUE (org_id, email)
);

-- Trigram index for name/email search
CREATE INDEX idx_users_email_trgm  ON users USING GIN (email   gin_trgm_ops);
CREATE INDEX idx_users_name_trgm   ON users USING GIN (name    gin_trgm_ops);
CREATE INDEX idx_users_org_id      ON users (org_id);
CREATE INDEX idx_users_role        ON users (role);


-- =============================================================================
-- SECTION 3: AUTH TOKENS
-- Not tenant-scoped for lookup efficiency, but user_id implies org.
-- =============================================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,   -- store hashed, never raw
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);


CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 4: VENDORS
-- A vendor company is scoped to one org (per-org account model).
-- The corresponding login lives in users (role = 'vendor').
-- =============================================================================

CREATE TABLE vendors (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    company_name            TEXT NOT NULL,
    contact_person          TEXT NOT NULL,
    email                   TEXT NOT NULL,
    phone                   TEXT,
    address                 TEXT,

    gst_number              TEXT,
    pan_number              TEXT,

    -- Categories stored as an array; filter with && operator
    category                TEXT[] NOT NULL DEFAULT '{}',

    bank_name               TEXT,
    bank_account            TEXT,
    bank_ifsc               TEXT,

    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved             BOOLEAN NOT NULL DEFAULT FALSE,
    approval_remarks        TEXT,

    notes                   TEXT,

    -- Performance stats — computed on read, but cached here for fast list views.
    -- Refresh these via a background job or trigger after PO/invoice updates.
    cached_rating               NUMERIC(3, 2),          -- e.g. 4.50
    cached_total_orders         INT NOT NULL DEFAULT 0,
    cached_on_time_delivery_rate NUMERIC(5, 2),         -- percentage, e.g. 91.60

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (org_id, email)
);

CREATE INDEX idx_vendors_org_id        ON vendors (org_id);
CREATE INDEX idx_vendors_is_approved   ON vendors (is_approved);
CREATE INDEX idx_vendors_category      ON vendors USING GIN (category);
CREATE INDEX idx_vendors_name_trgm     ON vendors USING GIN (company_name gin_trgm_ops);

-- Now that vendors exists, add the FK from users
ALTER TABLE users
    ADD CONSTRAINT fk_users_vendor_id
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

CREATE INDEX idx_users_vendor_id ON users (vendor_id);


-- =============================================================================
-- SECTION 5: DOCUMENT SEQUENCES
-- Per-org, per-type, per-year counters for human-readable document numbers.
-- Pattern: RFQ-2026-0001, PO-2026-0001, QT-2026-0001, INV-2026-0001
-- Usage  : call next_document_number(org_id, 'rfq', 2026) from a transaction.
-- =============================================================================

CREATE TABLE document_sequences (
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    doc_type        document_type NOT NULL,
    year            SMALLINT NOT NULL,
    last_seq        INT NOT NULL DEFAULT 0,

    PRIMARY KEY (org_id, doc_type, year)
);

-- Function that atomically increments and returns the next formatted number
CREATE OR REPLACE FUNCTION next_document_number(
    p_org_id  UUID,
    p_type    document_type,
    p_year    SMALLINT
) RETURNS TEXT AS $$
DECLARE
    v_seq   INT;
    v_prefix TEXT;
BEGIN
    INSERT INTO document_sequences (org_id, doc_type, year, last_seq)
        VALUES (p_org_id, p_type, p_year, 1)
    ON CONFLICT (org_id, doc_type, year)
    DO UPDATE SET last_seq = document_sequences.last_seq + 1
    RETURNING last_seq INTO v_seq;

    v_prefix := CASE p_type
        WHEN 'rfq'      THEN 'RFQ'
        WHEN 'quotation' THEN 'QT'
        WHEN 'po'        THEN 'PO'
        WHEN 'invoice'   THEN 'INV'
    END;

    RETURN v_prefix || '-' || p_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 6: RFQs
-- =============================================================================

CREATE TABLE rfqs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    rfq_number          TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,

    deadline            TIMESTAMPTZ,
    delivery_location   TEXT,

    status              rfq_status NOT NULL DEFAULT 'draft',
    cancel_reason       TEXT,

    notes               TEXT,

    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (org_id, rfq_number)
);

CREATE INDEX idx_rfqs_org_id      ON rfqs (org_id);
CREATE INDEX idx_rfqs_status      ON rfqs (status);
CREATE INDEX idx_rfqs_created_by  ON rfqs (created_by);
CREATE INDEX idx_rfqs_title_trgm  ON rfqs USING GIN (title gin_trgm_ops);


CREATE TABLE rfq_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,

    product_name    TEXT NOT NULL,
    description     TEXT,
    quantity        NUMERIC(12, 3) NOT NULL,
    unit            TEXT NOT NULL,           -- "pieces", "kg", "litres", etc.
    specifications  TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfq_items_rfq_id ON rfq_items (rfq_id);


CREATE TABLE rfq_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    file_name   TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfq_attachments_rfq_id ON rfq_attachments (rfq_id);


-- Junction: which vendors received which RFQ, and their per-vendor status
CREATE TABLE rfq_vendors (
    rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status      rfq_vendor_status NOT NULL DEFAULT 'pending',
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (rfq_id, vendor_id)
);

CREATE INDEX idx_rfq_vendors_vendor_id ON rfq_vendors (vendor_id);


-- =============================================================================
-- SECTION 7: QUOTATIONS
-- =============================================================================

CREATE TABLE quotations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    quotation_number        TEXT NOT NULL,
    rfq_id                  UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id               UUID NOT NULL REFERENCES vendors(id),

    currency                TEXT NOT NULL DEFAULT 'INR',
    subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_total               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount            NUMERIC(14, 2) NOT NULL DEFAULT 0,

    delivery_timeline_days  INT,
    delivery_terms          TEXT,
    payment_terms           TEXT,
    validity_days           INT,

    notes                   TEXT,
    status                  quotation_status NOT NULL DEFAULT 'submitted',
    selection_reason        TEXT,            -- filled when procurement officer shortlists

    pdf_url                 TEXT,            -- generated PDF stored here

    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (org_id, quotation_number),
    -- One quotation per vendor per RFQ
    UNIQUE (rfq_id, vendor_id)
);

CREATE INDEX idx_quotations_org_id    ON quotations (org_id);
CREATE INDEX idx_quotations_rfq_id    ON quotations (rfq_id);
CREATE INDEX idx_quotations_vendor_id ON quotations (vendor_id);
CREATE INDEX idx_quotations_status    ON quotations (status);


CREATE TABLE quotation_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    rfq_item_id     UUID REFERENCES rfq_items(id) ON DELETE SET NULL,

    product_name    TEXT NOT NULL,
    quantity        NUMERIC(12, 3) NOT NULL,
    unit            TEXT NOT NULL,
    unit_price      NUMERIC(14, 4) NOT NULL,
    subtotal        NUMERIC(14, 2) NOT NULL,
    tax_percent     NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total           NUMERIC(14, 2) NOT NULL
);

CREATE INDEX idx_quotation_items_quotation_id ON quotation_items (quotation_id);
CREATE INDEX idx_quotation_items_rfq_item_id  ON quotation_items (rfq_item_id);


CREATE TABLE quotation_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    file_name   TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotation_attachments_quotation_id ON quotation_attachments (quotation_id);


-- =============================================================================
-- SECTION 8: APPROVAL REQUESTS
-- Flat single-level approval (by design). level column kept for future
-- multi-level without a migration.
-- =============================================================================

CREATE TABLE approval_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    rfq_id              UUID NOT NULL REFERENCES rfqs(id),
    quotation_id        UUID NOT NULL REFERENCES quotations(id),

    requested_by        UUID NOT NULL REFERENCES users(id),   -- procurement officer
    reviewed_by         UUID REFERENCES users(id),             -- manager who acted

    status              approval_status NOT NULL DEFAULT 'pending',
    priority            approval_priority NOT NULL DEFAULT 'medium',
    remarks             TEXT,

    -- Kept for future multi-level; always 1 for now
    level               SMALLINT NOT NULL DEFAULT 1,

    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ
);

CREATE INDEX idx_approvals_org_id        ON approval_requests (org_id);
CREATE INDEX idx_approvals_rfq_id        ON approval_requests (rfq_id);
CREATE INDEX idx_approvals_quotation_id  ON approval_requests (quotation_id);
CREATE INDEX idx_approvals_status        ON approval_requests (status);
CREATE INDEX idx_approvals_requested_by  ON approval_requests (requested_by);
CREATE INDEX idx_approvals_reviewed_by   ON approval_requests (reviewed_by);


-- =============================================================================
-- SECTION 9: PURCHASE ORDERS
-- Items are a snapshot of quotation_items at PO generation time.
-- Prices are legally committed; never FK to live quotation_items.
-- =============================================================================

CREATE TABLE purchase_orders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    po_number               TEXT NOT NULL,
    rfq_id                  UUID NOT NULL REFERENCES rfqs(id),
    quotation_id            UUID NOT NULL REFERENCES quotations(id),
    approval_id             UUID NOT NULL REFERENCES approval_requests(id),
    vendor_id               UUID NOT NULL REFERENCES vendors(id),

    subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_total               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    grand_total             NUMERIC(14, 2) NOT NULL DEFAULT 0,

    delivery_address        TEXT,
    expected_delivery_date  DATE,
    payment_terms           TEXT,
    special_instructions    TEXT,

    status                  po_status NOT NULL DEFAULT 'generated',

    -- Delivery timestamps — used to compute on_time_delivery_rate on vendors
    acknowledged_at         TIMESTAMPTZ,
    in_transit_at           TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,

    pdf_url                 TEXT,

    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (org_id, po_number)
);

CREATE INDEX idx_po_org_id      ON purchase_orders (org_id);
CREATE INDEX idx_po_vendor_id   ON purchase_orders (vendor_id);
CREATE INDEX idx_po_rfq_id      ON purchase_orders (rfq_id);
CREATE INDEX idx_po_status      ON purchase_orders (status);
CREATE INDEX idx_po_created_at  ON purchase_orders (created_at);


-- Snapshot of line items at the moment the PO was generated
CREATE TABLE po_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

    product_name    TEXT NOT NULL,
    quantity        NUMERIC(12, 3) NOT NULL,
    unit            TEXT NOT NULL,
    unit_price      NUMERIC(14, 4) NOT NULL,
    subtotal        NUMERIC(14, 2) NOT NULL,
    tax_percent     NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total           NUMERIC(14, 2) NOT NULL
);

CREATE INDEX idx_po_items_po_id ON po_items (po_id);


-- Status change audit trail for POs (separate from activity_logs)
CREATE TABLE po_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id       UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    from_status po_status,
    to_status   po_status NOT NULL,
    remarks     TEXT,
    changed_by  UUID REFERENCES users(id),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_po_status_history_po_id ON po_status_history (po_id);


-- =============================================================================
-- SECTION 10: INVOICES
-- Vendor generates an invoice against a PO.
-- Items are also snapshotted (partial deliveries are valid).
-- =============================================================================

CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    invoice_number          TEXT NOT NULL,           -- system-generated: INV-2026-0001
    invoice_number_vendor   TEXT,                    -- vendor's own reference number
    po_id                   UUID NOT NULL REFERENCES purchase_orders(id),
    vendor_id               UUID NOT NULL REFERENCES vendors(id),

    invoice_date            DATE NOT NULL,
    due_date                DATE,

    subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_total               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    grand_total             NUMERIC(14, 2) NOT NULL DEFAULT 0,

    bank_name               TEXT,
    bank_account            TEXT,
    bank_ifsc               TEXT,

    notes                   TEXT,
    status                  invoice_status NOT NULL DEFAULT 'pending',

    -- Payment confirmation fields (filled by procurement officer / admin)
    payment_date            DATE,
    payment_reference       TEXT,
    payment_remarks         TEXT,

    pdf_url                 TEXT,

    created_by              UUID NOT NULL REFERENCES users(id),   -- the vendor's user record
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (org_id, invoice_number)
);

CREATE INDEX idx_invoices_org_id    ON invoices (org_id);
CREATE INDEX idx_invoices_po_id     ON invoices (po_id);
CREATE INDEX idx_invoices_vendor_id ON invoices (vendor_id);
CREATE INDEX idx_invoices_status    ON invoices (status);
CREATE INDEX idx_invoices_due_date  ON invoices (due_date);


CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    product_name    TEXT NOT NULL,
    quantity        NUMERIC(12, 3) NOT NULL,
    unit            TEXT NOT NULL,
    unit_price      NUMERIC(14, 4) NOT NULL,
    subtotal        NUMERIC(14, 2) NOT NULL,
    tax_percent     NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total           NUMERIC(14, 2) NOT NULL
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items (invoice_id);


-- =============================================================================
-- SECTION 11: NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type        notification_type NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,

    entity_type entity_type,
    entity_id   UUID,

    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications (user_id);
CREATE INDEX idx_notifications_org_id   ON notifications (org_id);
CREATE INDEX idx_notifications_is_read  ON notifications (user_id, is_read);


-- =============================================================================
-- SECTION 12: ACTIVITY LOGS
-- Append-only audit trail. Never update or delete rows here.
-- =============================================================================

CREATE TABLE activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    entity_type entity_type NOT NULL,
    entity_id   UUID NOT NULL,
    entity_ref  TEXT,            -- human-readable: "RFQ-2026-0001"

    action      TEXT NOT NULL,   -- e.g. "rfq_sent", "po_generated", "invoice_paid"
    description TEXT,

    performed_by    UUID REFERENCES users(id),
    performed_role  user_role,
    ip_address      INET,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_org_id       ON activity_logs (org_id);
CREATE INDEX idx_activity_logs_entity       ON activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_performed_by ON activity_logs (performed_by);
CREATE INDEX idx_activity_logs_created_at   ON activity_logs (created_at);


-- =============================================================================
-- SECTION 13: FILE UPLOADS
-- Tracks every uploaded file, linked to an entity via entity_type + entity_id.
-- =============================================================================

CREATE TABLE file_uploads (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    file_url    TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    file_size   BIGINT,              -- bytes
    mime_type   TEXT,

    entity_type entity_type NOT NULL,
    entity_id   UUID,

    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_org_id    ON file_uploads (org_id);
CREATE INDEX idx_file_uploads_entity    ON file_uploads (entity_type, entity_id);


-- =============================================================================
-- SECTION 14: updated_at TRIGGER
-- Automatically bumps updated_at on every UPDATE across all tables that have it.
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table with an updated_at column
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organizations',
        'users',
        'vendors',
        'rfqs',
        'quotations',
        'purchase_orders',
        'invoices'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t
        );
    END LOOP;
END;
$$;


-- =============================================================================
-- SECTION 15: ROW LEVEL SECURITY
-- Every tenant-scoped table is locked down here.
-- The Express layer must SET LOCAL app.current_org_id, app.current_user_id,
-- and app.current_role at the start of each request transaction.
--
-- Helper functions read those session variables so policies stay clean.
-- =============================================================================

-- Helpers to read session config without boilerplate in every policy
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
    SELECT current_setting('app.current_org_id', TRUE)::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
    SELECT current_setting('app.current_user_id', TRUE)::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
    SELECT current_setting('app.current_role', TRUE);
$$ LANGUAGE sql STABLE;


-- Enable RLS on all tenant-scoped tables
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_vendors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences  ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- USERS
-- Internal users see all users in their org.
-- Vendors can only see their own row.
-- ---------------------------------------------------------------------------
CREATE POLICY users_org_isolation ON users
    FOR ALL
    USING (
        org_id = current_org_id()
        AND (
            current_user_role() IN ('admin', 'procurement_officer', 'manager')
            OR id = current_user_id()
        )
    );


-- ---------------------------------------------------------------------------
-- VENDORS
-- All internal roles see all vendors in their org.
-- A vendor user sees only their own vendor record.
-- ---------------------------------------------------------------------------
CREATE POLICY vendors_org_isolation ON vendors
    FOR ALL
    USING (
        org_id = current_org_id()
        AND (
            current_user_role() IN ('admin', 'procurement_officer', 'manager')
            OR id = (
                SELECT vendor_id FROM users WHERE id = current_user_id()
            )
        )
    );


-- ---------------------------------------------------------------------------
-- RFQs + children
-- Internal roles: org-scoped.
-- Vendors: only RFQs where they appear in rfq_vendors.
-- ---------------------------------------------------------------------------
CREATE POLICY rfqs_org_isolation ON rfqs
    FOR ALL
    USING (
        org_id = current_org_id()
        AND (
            current_user_role() IN ('admin', 'procurement_officer', 'manager')
            OR EXISTS (
                SELECT 1 FROM rfq_vendors rv
                JOIN users u ON u.vendor_id = rv.vendor_id
                WHERE rv.rfq_id = rfqs.id
                  AND u.id = current_user_id()
            )
        )
    );

-- rfq_items inherit access via their rfq
CREATE POLICY rfq_items_via_rfq ON rfq_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rfqs r
            WHERE r.id = rfq_items.rfq_id
        )
    );

CREATE POLICY rfq_attachments_via_rfq ON rfq_attachments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rfqs r
            WHERE r.id = rfq_attachments.rfq_id
        )
    );

CREATE POLICY rfq_vendors_via_rfq ON rfq_vendors
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rfqs r
            WHERE r.id = rfq_vendors.rfq_id
        )
    );


-- ---------------------------------------------------------------------------
-- QUOTATIONS + children
-- Internal roles: org-scoped.
-- Vendors: only their own quotations.
-- ---------------------------------------------------------------------------
CREATE POLICY quotations_org_isolation ON quotations
    FOR ALL
    USING (
        org_id = current_org_id()
        AND (
            current_user_role() IN ('admin', 'procurement_officer', 'manager')
            OR vendor_id = (
                SELECT vendor_id FROM users WHERE id = current_user_id()
            )
        )
    );

CREATE POLICY quotation_items_via_quotation ON quotation_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM quotations q
            WHERE q.id = quotation_items.quotation_id
        )
    );

CREATE POLICY quotation_attachments_via_quotation ON quotation_attachments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM quotations q
            WHERE q.id = quotation_attachments.quotation_id
        )
    );


-- ---------------------------------------------------------------------------
-- APPROVAL REQUESTS
-- Only managers and internal users in the same org.
-- Vendors have no access.
-- ---------------------------------------------------------------------------
CREATE POLICY approvals_org_isolation ON approval_requests
    FOR ALL
    USING (
        org_id = current_org_id()
        AND current_user_role() IN ('admin', 'procurement_officer', 'manager')
    );


-- ---------------------------------------------------------------------------
-- PURCHASE ORDERS + children
-- Internal roles: org-scoped.
-- Vendors: only POs where they are the vendor.
-- ---------------------------------------------------------------------------
CREATE POLICY po_org_isolation ON purchase_orders
    FOR ALL
    USING (
        org_id = current_org_id()
        AND (
            current_user_role() IN ('admin', 'procurement_officer', 'manager')
            OR vendor_id = (
                SELECT vendor_id FROM users WHERE id = current_user_id()
            )
        )
    );

CREATE POLICY po_items_via_po ON po_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = po_items.po_id
        )
    );

CREATE POLICY po_status_history_via_po ON po_status_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = po_status_history.po_id
        )
    );


-- ---------------------------------------------------------------------------
-- INVOICES + children
-- Internal roles: org-scoped.
-- Vendors: only their own invoices.
-- ---------------------------------------------------------------------------
CREATE POLICY invoices_org_isolation ON invoices
    FOR ALL
    USING (
        org_id = current_org_id()
        AND (
            current_user_role() IN ('admin', 'procurement_officer', 'manager')
            OR vendor_id = (
                SELECT vendor_id FROM users WHERE id = current_user_id()
            )
        )
    );

CREATE POLICY invoice_items_via_invoice ON invoice_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
        )
    );


-- ---------------------------------------------------------------------------
-- NOTIFICATIONS: each user sees only their own
-- ---------------------------------------------------------------------------
CREATE POLICY notifications_own ON notifications
    FOR ALL
    USING (
        org_id = current_org_id()
        AND user_id = current_user_id()
    );


-- ---------------------------------------------------------------------------
-- ACTIVITY LOGS: admins and managers only
-- ---------------------------------------------------------------------------
CREATE POLICY activity_logs_org_isolation ON activity_logs
    FOR ALL
    USING (
        org_id = current_org_id()
        AND current_user_role() IN ('admin', 'manager')
    );


-- ---------------------------------------------------------------------------
-- FILE UPLOADS: org-scoped, same rules as entity they're attached to.
-- Simplified to org-level here; fine-grained enforcement is at app layer.
-- ---------------------------------------------------------------------------
CREATE POLICY file_uploads_org_isolation ON file_uploads
    FOR ALL
    USING (org_id = current_org_id());


-- ---------------------------------------------------------------------------
-- DOCUMENT SEQUENCES: org-scoped, all internal roles (seq increments happen
-- inside transactions initiated by the service layer)
-- ---------------------------------------------------------------------------
CREATE POLICY doc_sequences_org_isolation ON document_sequences
    FOR ALL
    USING (org_id = current_org_id());


-- =============================================================================
-- SECTION 16: USEFUL VIEWS
-- Pre-joined views for the most common query patterns.
-- These respect RLS because they query the base tables.
-- =============================================================================

-- Vendor performance view — powers /reports/vendor-performance and vendor list ratings
CREATE OR REPLACE VIEW vendor_performance AS
SELECT
    v.id                                                    AS vendor_id,
    v.org_id,
    v.company_name,
    COUNT(DISTINCT po.id)                                   AS total_orders,
    COALESCE(SUM(po.grand_total), 0)                        AS total_value_awarded,
    COUNT(DISTINCT q.id)                                    AS quotations_submitted,
    COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'accepted') AS quotations_accepted,
    ROUND(
        100.0 * COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'accepted')
        / NULLIF(COUNT(DISTINCT q.id), 0),
        1
    )                                                       AS acceptance_rate,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (po.delivered_at - po.created_at)) / 86400
    )::NUMERIC, 1)                                          AS avg_delivery_time_days,
    ROUND(
        100.0 * COUNT(DISTINCT po.id) FILTER (
            WHERE po.delivered_at IS NOT NULL
              AND po.delivered_at::DATE <= po.expected_delivery_date
        ) / NULLIF(COUNT(DISTINCT po.id) FILTER (WHERE po.delivered_at IS NOT NULL), 0),
        1
    )                                                       AS on_time_delivery_rate
FROM vendors v
LEFT JOIN quotations q  ON q.vendor_id = v.id
LEFT JOIN purchase_orders po ON po.vendor_id = v.id
GROUP BY v.id, v.org_id, v.company_name;


-- RFQ summary view — powers the RFQ list endpoint
CREATE OR REPLACE VIEW rfq_summary AS
SELECT
    r.id,
    r.org_id,
    r.rfq_number,
    r.title,
    r.status,
    r.deadline,
    r.created_by,
    r.created_at,
    u.name                              AS created_by_name,
    COUNT(DISTINCT rv.vendor_id)        AS vendor_count,
    COUNT(DISTINCT q.id)                AS quotation_count
FROM rfqs r
LEFT JOIN users u           ON u.id = r.created_by
LEFT JOIN rfq_vendors rv    ON rv.rfq_id = r.id
LEFT JOIN quotations q      ON q.rfq_id = r.id
GROUP BY r.id, u.name;


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================