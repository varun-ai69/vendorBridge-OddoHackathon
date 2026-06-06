-- =============================================================================
-- seed.sql — Demo Data for VendorBridge
-- Run this AFTER schema.sql and triggers.sql
--
-- Creates a fully wired demo environment so judges can log in immediately.
-- All passwords are hashed from 'Demo@12345' using bcrypt (12 rounds).
-- The hash below is pre-computed — no bcrypt needed at seed time.
--
-- Login credentials (all passwords: Demo@12345)
-- ─────────────────────────────────────────────
-- Admin             : admin@vendorbridge.com
-- Procurement Ofc   : procurement@vendorbridge.com
-- Manager           : manager@vendorbridge.com
-- Vendor 1          : vendor1@steelsuppliers.com
-- Vendor 2          : vendor2@ironworks.com
-- =============================================================================

BEGIN;

-- Disable RLS for the seed session (we are running as the DB owner)
SET LOCAL app.current_org_id  = '00000000-0000-0000-0000-000000000000';
SET LOCAL app.current_user_id = '00000000-0000-0000-0000-000000000000';
SET LOCAL app.current_user_role = 'admin';

-- ---------------------------------------------------------------------------
-- Fixed UUIDs so seed is idempotent and re-runnable
-- ---------------------------------------------------------------------------

-- Organization
\set ORG_ID         '\'a1000000-0000-0000-0000-000000000001\''

-- Users
\set ADMIN_ID       '\'b1000000-0000-0000-0000-000000000001\''
\set PO_ID          '\'b2000000-0000-0000-0000-000000000002\''
\set MGR_ID         '\'b3000000-0000-0000-0000-000000000003\''
\set VENDOR1_USR    '\'b4000000-0000-0000-0000-000000000004\''
\set VENDOR2_USR    '\'b5000000-0000-0000-0000-000000000005\''

-- Vendors
\set VENDOR1_ID     '\'c1000000-0000-0000-0000-000000000001\''
\set VENDOR2_ID     '\'c2000000-0000-0000-0000-000000000002\''

-- RFQ
\set RFQ1_ID        '\'d1000000-0000-0000-0000-000000000001\''
\set RFQ_ITEM1      '\'d2000000-0000-0000-0000-000000000001\''
\set RFQ_ITEM2      '\'d2000000-0000-0000-0000-000000000002\''

-- Quotations
\set QUOT1_ID       '\'e1000000-0000-0000-0000-000000000001\''
\set QUOT2_ID       '\'e2000000-0000-0000-0000-000000000002\''

-- Approval
\set APPR1_ID       '\'f1000000-0000-0000-0000-000000000001\''

-- PO
\set PO1_ID         '\'g1000000-0000-0000-0000-000000000001\''

-- Invoice
\set INV1_ID        '\'h1000000-0000-0000-0000-000000000001\''


-- ---------------------------------------------------------------------------
-- Step 1: Organization
-- ---------------------------------------------------------------------------

INSERT INTO organizations (id, name, address, gst, industry, website, is_active)
VALUES (
    :ORG_ID,
    'VendorBridge Demo Corp',
    '4th Floor, Tech Park, Pune - 411014',
    '27AABCV1234D1Z5',
    'Manufacturing',
    'https://vendorbridge.demo',
    TRUE
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 2: Vendors (must exist before vendor users for the FK)
-- ---------------------------------------------------------------------------

INSERT INTO vendors (
    id, org_id, company_name, contact_person, email, phone, address,
    gst_number, pan_number, category,
    bank_name, bank_account, bank_ifsc,
    is_active, is_approved
) VALUES
(
    :VENDOR1_ID, :ORG_ID,
    'Steel Suppliers Ltd', 'Raj Kumar', 'vendor1@steelsuppliers.com',
    '+91-9111111111', 'Plot 12, MIDC, Pune',
    '27AAAPL1234C1Z5', 'AAAPL1234C',
    ARRAY['Raw Materials', 'Steel'],
    'HDFC Bank', '12345678901234', 'HDFC0001234',
    TRUE, TRUE
),
(
    :VENDOR2_ID, :ORG_ID,
    'Iron Works Co', 'Priya Shah', 'vendor2@ironworks.com',
    '+91-9222222222', 'A-45, Andheri MIDC, Mumbai',
    '27BBBPL4567D1Z3', 'BBBPL4567D',
    ARRAY['Raw Materials', 'Steel', 'Fabrication'],
    'ICICI Bank', '98765432109876', 'ICIC0009876',
    TRUE, TRUE
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 3: Users
-- Password hash = bcrypt('Demo@12345', 12 rounds)
-- Pre-computed: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES
-- ---------------------------------------------------------------------------

INSERT INTO users (
    id, org_id, name, email, password_hash, role,
    phone, department, is_active, vendor_id
) VALUES
-- Admin
(
    :ADMIN_ID, :ORG_ID,
    'Arjun Mehta', 'admin@vendorbridge.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'admin',
    '+91-9800000001', 'Administration',
    TRUE, NULL
),
-- Procurement Officer
(
    :PO_ID, :ORG_ID,
    'Jane Smith', 'procurement@vendorbridge.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'procurement_officer',
    '+91-9800000002', 'Procurement',
    TRUE, NULL
),
-- Manager
(
    :MGR_ID, :ORG_ID,
    'Ravi Sharma', 'manager@vendorbridge.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'manager',
    '+91-9800000003', 'Management',
    TRUE, NULL
),
-- Vendor 1 user
(
    :VENDOR1_USR, :ORG_ID,
    'Raj Kumar', 'vendor1@steelsuppliers.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'vendor',
    '+91-9111111111', NULL,
    TRUE, :VENDOR1_ID
),
-- Vendor 2 user
(
    :VENDOR2_USR, :ORG_ID,
    'Priya Shah', 'vendor2@ironworks.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'vendor',
    '+91-9222222222', NULL,
    TRUE, :VENDOR2_ID
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 4: Document sequences bootstrap
-- Pre-seed so the first real document gets -0002 (not a collision with demo)
-- ---------------------------------------------------------------------------

INSERT INTO document_sequences (org_id, doc_type, year, last_seq) VALUES
    (:ORG_ID, 'rfq',       2026, 1),
    (:ORG_ID, 'quotation', 2026, 2),
    (:ORG_ID, 'po',        2026, 1),
    (:ORG_ID, 'invoice',   2026, 1)
ON CONFLICT (org_id, doc_type, year) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 5: RFQ (status = awarded, so the full lifecycle demo is visible)
-- ---------------------------------------------------------------------------

INSERT INTO rfqs (
    id, org_id, rfq_number, title, description,
    deadline, delivery_location, status, created_by
) VALUES (
    :RFQ1_ID, :ORG_ID,
    'RFQ-2026-0001',
    'Steel Rods Q2 2026',
    'Requirement of 500 units of 10mm steel rods for Q2 production.',
    '2026-07-01T18:00:00Z',
    'Pune Factory - Gate 2',
    'awarded',
    :PO_ID
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rfq_items (id, rfq_id, product_name, description, quantity, unit, specifications)
VALUES
    (:RFQ_ITEM1, :RFQ1_ID, 'Steel Rod 10mm', 'Grade A, Hot Rolled', 500, 'pieces', 'IS:1786 Grade Fe 415'),
    (:RFQ_ITEM2, :RFQ1_ID, 'Steel Rod 12mm', 'Grade A, Hot Rolled', 200, 'pieces', 'IS:1786 Grade Fe 500')
ON CONFLICT (id) DO NOTHING;

-- Both vendors were invited to this RFQ
INSERT INTO rfq_vendors (rfq_id, vendor_id, status) VALUES
    (:RFQ1_ID, :VENDOR1_ID, 'awarded'),
    (:RFQ1_ID, :VENDOR2_ID, 'closed')
ON CONFLICT (rfq_id, vendor_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 6: Quotations (both vendors quoted; vendor 1 won)
-- ---------------------------------------------------------------------------

INSERT INTO quotations (
    id, org_id, quotation_number, rfq_id, vendor_id,
    currency, subtotal, tax_total, total_amount,
    delivery_timeline_days, delivery_terms, payment_terms, validity_days,
    notes, status, selection_reason
) VALUES
-- Winning quotation (Vendor 1 - lower price)
(
    :QUOT1_ID, :ORG_ID,
    'QT-2026-0001', :RFQ1_ID, :VENDOR1_ID,
    'INR', 55250.00, 9945.00, 65195.00,
    14, 'Ex-Works Pune', 'Net 30', 30,
    'Prices valid for 30 days. ISI certified material.',
    'accepted',
    'Best price with acceptable delivery timeline'
),
-- Losing quotation (Vendor 2 - higher price but faster delivery)
(
    :QUOT2_ID, :ORG_ID,
    'QT-2026-0002', :RFQ1_ID, :VENDOR2_ID,
    'INR', 59500.00, 10710.00, 70210.00,
    10, 'FOR Destination', 'Net 45', 30,
    'Faster delivery, includes transportation.',
    'rejected',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Quotation line items for winning quotation
INSERT INTO quotation_items (
    quotation_id, rfq_item_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    (:QUOT1_ID, :RFQ_ITEM1, 'Steel Rod 10mm', 500, 'pieces', 85.50, 42750.00, 18, 7695.00, 50445.00),
    (:QUOT1_ID, :RFQ_ITEM2, 'Steel Rod 12mm', 200, 'pieces', 62.50, 12500.00, 18, 2250.00, 14750.00)
ON CONFLICT DO NOTHING;

-- Quotation line items for losing quotation
INSERT INTO quotation_items (
    quotation_id, rfq_item_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    (:QUOT2_ID, :RFQ_ITEM1, 'Steel Rod 10mm', 500, 'pieces', 91.00, 45500.00, 18, 8190.00, 53690.00),
    (:QUOT2_ID, :RFQ_ITEM2, 'Steel Rod 12mm', 200, 'pieces', 70.00, 14000.00, 18, 2520.00, 16520.00)
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 7: Approval request (approved)
-- ---------------------------------------------------------------------------

INSERT INTO approval_requests (
    id, org_id, rfq_id, quotation_id,
    requested_by, reviewed_by,
    status, priority, remarks,
    requested_at, reviewed_at
) VALUES (
    :APPR1_ID, :ORG_ID, :RFQ1_ID, :QUOT1_ID,
    :PO_ID, :MGR_ID,
    'approved', 'high',
    'Price is within Q2 budget allocation. Proceed with PO generation.',
    '2026-06-12T09:00:00Z',
    '2026-06-12T14:30:00Z'
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 8: Purchase Order (delivered)
-- Note: We insert directly and bypass the PO trigger side-effects since
-- the RFQ/quotation statuses are already set correctly above.
-- ---------------------------------------------------------------------------

INSERT INTO purchase_orders (
    id, org_id, po_number, rfq_id, quotation_id, approval_id, vendor_id,
    subtotal, tax_total, grand_total,
    delivery_address, expected_delivery_date, payment_terms, special_instructions,
    status,
    acknowledged_at, in_transit_at, delivered_at,
    created_by, created_at
) VALUES (
    :PO1_ID, :ORG_ID,
    'PO-2026-0001', :RFQ1_ID, :QUOT1_ID, :APPR1_ID, :VENDOR1_ID,
    55250.00, 9945.00, 65195.00,
    'VendorBridge Demo Corp, Plot 45, Pune - 411018',
    '2026-07-15',
    'Net 30 days',
    'Deliver to Gate 2, contact Ravi (+91-9800000099)',
    'delivered',
    '2026-06-13T10:00:00Z',
    '2026-06-20T08:00:00Z',
    '2026-07-12T16:00:00Z',
    :PO_ID,
    '2026-06-13T09:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO po_items (
    po_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    (:PO1_ID, 'Steel Rod 10mm', 500, 'pieces', 85.50, 42750.00, 18, 7695.00, 50445.00),
    (:PO1_ID, 'Steel Rod 12mm', 200, 'pieces', 62.50, 12500.00, 18, 2250.00, 14750.00)
ON CONFLICT DO NOTHING;

INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, changed_at) VALUES
    (:PO1_ID, 'generated',    'acknowledged', :VENDOR1_USR, '2026-06-13T10:00:00Z'),
    (:PO1_ID, 'acknowledged', 'in_transit',   :VENDOR1_USR, '2026-06-20T08:00:00Z'),
    (:PO1_ID, 'in_transit',   'delivered',    :VENDOR1_USR, '2026-07-12T16:00:00Z')
ON CONFLICT DO NOTHING;

-- Update vendor cache to reflect the delivered PO
UPDATE vendors
SET cached_total_orders = 1,
    cached_on_time_delivery_rate = 100.00
WHERE id = :VENDOR1_ID;


-- ---------------------------------------------------------------------------
-- Step 9: Invoice (pending payment — so judges can see the pay action)
-- ---------------------------------------------------------------------------

INSERT INTO invoices (
    id, org_id, invoice_number, invoice_number_vendor, po_id, vendor_id,
    invoice_date, due_date,
    subtotal, tax_total, grand_total,
    bank_name, bank_account, bank_ifsc,
    notes, status,
    created_by
) VALUES (
    :INV1_ID, :ORG_ID,
    'INV-2026-0001', 'INV-SS-2026-045',
    :PO1_ID, :VENDOR1_ID,
    '2026-07-16', '2026-08-15',
    55250.00, 9945.00, 65195.00,
    'HDFC Bank', '12345678901234', 'HDFC0001234',
    'Payment due within 30 days of delivery.',
    'pending',
    :VENDOR1_USR
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (
    invoice_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    (:INV1_ID, 'Steel Rod 10mm', 500, 'pieces', 85.50, 42750.00, 18, 7695.00, 50445.00),
    (:INV1_ID, 'Steel Rod 12mm', 200, 'pieces', 62.50, 12500.00, 18, 2250.00, 14750.00)
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 10: Activity log entries (so the admin audit trail isn't empty)
-- ---------------------------------------------------------------------------

INSERT INTO activity_logs (
    org_id, entity_type, entity_id, entity_ref,
    action, description,
    performed_by, performed_role, ip_address
) VALUES
    (:ORG_ID, 'rfq', :RFQ1_ID, 'RFQ-2026-0001',
     'rfq_created', 'RFQ created and sent to 2 approved vendors',
     :PO_ID, 'procurement_officer', '192.168.1.10'),

    (:ORG_ID, 'quotation', :QUOT1_ID, 'QT-2026-0001',
     'quotation_submitted', 'Steel Suppliers Ltd submitted a quotation',
     :VENDOR1_USR, 'vendor', '192.168.1.20'),

    (:ORG_ID, 'quotation', :QUOT2_ID, 'QT-2026-0002',
     'quotation_submitted', 'Iron Works Co submitted a quotation',
     :VENDOR2_USR, 'vendor', '192.168.1.21'),

    (:ORG_ID, 'rfq', :RFQ1_ID, 'RFQ-2026-0001',
     'vendor_shortlisted', 'Steel Suppliers Ltd shortlisted — best price with acceptable delivery',
     :PO_ID, 'procurement_officer', '192.168.1.10'),

    (:ORG_ID, 'rfq', :RFQ1_ID, 'RFQ-2026-0001',
     'approval_requested', 'Approval request sent to manager',
     :PO_ID, 'procurement_officer', '192.168.1.10'),

    (:ORG_ID, 'rfq', :RFQ1_ID, 'RFQ-2026-0001',
     'approval_granted', 'Manager approved procurement of Steel Rods Q2 2026',
     :MGR_ID, 'manager', '192.168.1.30'),

    (:ORG_ID, 'po', :PO1_ID, 'PO-2026-0001',
     'po_generated', 'Purchase Order generated and sent to Steel Suppliers Ltd',
     :PO_ID, 'procurement_officer', '192.168.1.10'),

    (:ORG_ID, 'po', :PO1_ID, 'PO-2026-0001',
     'po_acknowledged', 'Vendor acknowledged PO. Expected delivery by July 12.',
     :VENDOR1_USR, 'vendor', '192.168.1.20'),

    (:ORG_ID, 'po', :PO1_ID, 'PO-2026-0001',
     'po_delivered', 'Delivery confirmed by vendor',
     :VENDOR1_USR, 'vendor', '192.168.1.20'),

    (:ORG_ID, 'invoice', :INV1_ID, 'INV-2026-0001',
     'invoice_submitted', 'Invoice submitted by Steel Suppliers Ltd for PO-2026-0001',
     :VENDOR1_USR, 'vendor', '192.168.1.20');


-- ---------------------------------------------------------------------------
-- Step 11: Notifications (a few unread ones so the bell icon isn't empty)
-- ---------------------------------------------------------------------------

INSERT INTO notifications (org_id, user_id, type, title, message, entity_type, entity_id, is_read)
VALUES
    -- Procurement officer has a pending invoice to review
    (:ORG_ID, :PO_ID, 'invoice', 'Invoice Received',
     'Steel Suppliers Ltd submitted invoice INV-2026-0001. Please review and process payment.',
     'invoice', :INV1_ID, FALSE),

    -- Manager has no pending approvals but has a history item (read)
    (:ORG_ID, :MGR_ID, 'approval', 'Approval Granted',
     'Your approval for RFQ-2026-0001 was recorded.',
     'rfq', :RFQ1_ID, TRUE),

    -- Vendor 1 has a paid status pending
    (:ORG_ID, :VENDOR1_USR, 'po', 'Purchase Order Received',
     'A new Purchase Order PO-2026-0001 has been issued to you. Please acknowledge.',
     'po', :PO1_ID, TRUE);


COMMIT;