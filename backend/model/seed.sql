-- =============================================================================
-- seed.sql
-- Run as postgres superuser to bypass RLS (this is local dev / demo only)
-- Command: psql -U postgres -d oddoHackathon -h localhost -f backend/model/seed.sql
--
-- All passwords = Demo@12345
-- bcrypt hash (12 rounds): $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES
--
-- Demo logins:
--   admin@vendorbridge.com          Admin
--   procurement@vendorbridge.com    Procurement Officer
--   manager@vendorbridge.com        Manager
--   vendor1@steelsuppliers.com      Vendor 1
--   vendor2@ironworks.com           Vendor 2
-- =============================================================================

BEGIN;

-- Disable triggers that depend on RLS session context
ALTER TABLE purchase_orders DISABLE TRIGGER trg_after_po_generated;
ALTER TABLE purchase_orders DISABLE TRIGGER trg_after_po_insert;
ALTER TABLE purchase_orders DISABLE TRIGGER trg_after_po_status_change;
ALTER TABLE purchase_orders DISABLE TRIGGER trg_before_po_status_change;
ALTER TABLE purchase_orders DISABLE TRIGGER trg_after_po_delivered;
ALTER TABLE purchase_orders DISABLE TRIGGER set_updated_at;


-- Step 1: Organization
INSERT INTO organizations (id, name, address, gst, industry, website, is_active)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'VendorBridge Demo Corp',
    '4th Floor, Tech Park, Pune - 411014',
    '27AABCV1234D1Z5',
    'Manufacturing',
    'https://vendorbridge.demo',
    TRUE
) ON CONFLICT (id) DO NOTHING;


-- Step 2: Vendors (before vendor users — FK dependency)
INSERT INTO vendors (
    id, org_id, company_name, contact_person, email, phone, address,
    gst_number, pan_number, category,
    bank_name, bank_account, bank_ifsc,
    is_active, is_approved
) VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Steel Suppliers Ltd', 'Raj Kumar', 'vendor1@steelsuppliers.com',
    '+91-9111111111', 'Plot 12, MIDC, Pune',
    '27AAAPL1234C1Z5', 'AAAPL1234C',
    ARRAY['Raw Materials', 'Steel'],
    'HDFC Bank', '12345678901234', 'HDFC0001234',
    TRUE, TRUE
),
(
    'c2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Iron Works Co', 'Priya Shah', 'vendor2@ironworks.com',
    '+91-9222222222', 'A-45, Andheri MIDC, Mumbai',
    '27BBBPL4567D1Z3', 'BBBPL4567D',
    ARRAY['Raw Materials', 'Steel', 'Fabrication'],
    'ICICI Bank', '98765432109876', 'ICIC0009876',
    TRUE, TRUE
) ON CONFLICT (id) DO NOTHING;


-- Step 3: Users (all passwords = Demo@12345)
INSERT INTO users (
    id, org_id, name, email, password_hash, role,
    phone, department, is_active, vendor_id
) VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Arjun Mehta', 'admin@vendorbridge.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'admin', '+91-9800000001', 'Administration', TRUE, NULL
),
(
    'b2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Jane Smith', 'procurement@vendorbridge.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'procurement_officer', '+91-9800000002', 'Procurement', TRUE, NULL
),
(
    'b3000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Ravi Sharma', 'manager@vendorbridge.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'manager', '+91-9800000003', 'Management', TRUE, NULL
),
(
    'b4000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'Raj Kumar', 'vendor1@steelsuppliers.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'vendor', '+91-9111111111', NULL, TRUE,
    'c1000000-0000-0000-0000-000000000001'
),
(
    'b5000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'Priya Shah', 'vendor2@ironworks.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBHnOCo7HkEuES',
    'vendor', '+91-9222222222', NULL, TRUE,
    'c2000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;


-- Step 4: Document sequence counters (pre-seeded so next real doc gets -0002)
INSERT INTO document_sequences (org_id, doc_type, year, last_seq) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'rfq',       2026, 1),
    ('a1000000-0000-0000-0000-000000000001', 'quotation', 2026, 2),
    ('a1000000-0000-0000-0000-000000000001', 'po',        2026, 1),
    ('a1000000-0000-0000-0000-000000000001', 'invoice',   2026, 1)
ON CONFLICT (org_id, doc_type, year) DO NOTHING;


-- Step 5: RFQ (awarded — full lifecycle is visible in demo)
INSERT INTO rfqs (
    id, org_id, rfq_number, title, description,
    deadline, delivery_location, status, created_by
) VALUES (
    'd1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'RFQ-2026-0001',
    'Steel Rods Q2 2026',
    'Requirement of 500 units of 10mm steel rods for Q2 production.',
    '2026-07-01 18:00:00+00',
    'Pune Factory - Gate 2',
    'awarded',
    'b2000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rfq_items (id, rfq_id, product_name, description, quantity, unit, specifications)
VALUES
    ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
     'Steel Rod 10mm', 'Grade A, Hot Rolled', 500, 'pieces', 'IS 1786 Grade Fe 415'),
    ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001',
     'Steel Rod 12mm', 'Grade A, Hot Rolled', 200, 'pieces', 'IS 1786 Grade Fe 500')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rfq_vendors (rfq_id, vendor_id, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'awarded'),
    ('d1000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'closed')
ON CONFLICT (rfq_id, vendor_id) DO NOTHING;


-- Step 6: Quotations
INSERT INTO quotations (
    id, org_id, quotation_number, rfq_id, vendor_id,
    currency, subtotal, tax_total, total_amount,
    delivery_timeline_days, delivery_terms, payment_terms, validity_days,
    notes, status, selection_reason
) VALUES
(
    'e1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'QT-2026-0001',
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'INR', 55250.00, 9945.00, 65195.00,
    14, 'Ex-Works Pune', 'Net 30', 30,
    'Prices valid for 30 days. ISI certified material.',
    'accepted',
    'Best price with acceptable delivery timeline'
),
(
    'e2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'QT-2026-0002',
    'd1000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000002',
    'INR', 59500.00, 10710.00, 70210.00,
    10, 'FOR Destination', 'Net 45', 30,
    'Faster delivery, includes transportation.',
    'rejected',
    NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quotation_items (
    quotation_id, rfq_item_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    ('e1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001',
     'Steel Rod 10mm', 500, 'pieces', 85.50, 42750.00, 18, 7695.00, 50445.00),
    ('e1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002',
     'Steel Rod 12mm', 200, 'pieces', 62.50, 12500.00, 18, 2250.00, 14750.00),
    ('e2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001',
     'Steel Rod 10mm', 500, 'pieces', 91.00, 45500.00, 18, 8190.00, 53690.00),
    ('e2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000002',
     'Steel Rod 12mm', 200, 'pieces', 70.00, 14000.00, 18, 2520.00, 16520.00);


-- Step 7: Approval (approved)
INSERT INTO approval_requests (
    id, org_id, rfq_id, quotation_id,
    requested_by, reviewed_by,
    status, priority, remarks,
    requested_at, reviewed_at
) VALUES (
    'f1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    'b3000000-0000-0000-0000-000000000003',
    'approved', 'high',
    'Price is within Q2 budget allocation. Proceed with PO generation.',
    '2026-06-12 09:00:00+00',
    '2026-06-12 14:30:00+00'
) ON CONFLICT (id) DO NOTHING;


-- Step 8: Purchase Order (delivered)
INSERT INTO purchase_orders (
    id, org_id, po_number, rfq_id, quotation_id, approval_id, vendor_id,
    subtotal, tax_total, grand_total,
    delivery_address, expected_delivery_date, payment_terms, special_instructions,
    status, acknowledged_at, in_transit_at, delivered_at,
    created_by, created_at
) VALUES (
    'a7000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'PO-2026-0001',
    'd1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    55250.00, 9945.00, 65195.00,
    'VendorBridge Demo Corp, Plot 45, Pune - 411018',
    '2026-07-15', 'Net 30 days', 'Deliver to Gate 2, contact Ravi',
    'delivered',
    '2026-06-13 10:00:00+00',
    '2026-06-20 08:00:00+00',
    '2026-07-12 16:00:00+00',
    'b2000000-0000-0000-0000-000000000002',
    '2026-06-13 09:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO po_items (
    po_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    ('a7000000-0000-0000-0000-000000000001', 'Steel Rod 10mm', 500, 'pieces',
     85.50, 42750.00, 18, 7695.00, 50445.00),
    ('a7000000-0000-0000-0000-000000000001', 'Steel Rod 12mm', 200, 'pieces',
     62.50, 12500.00, 18, 2250.00, 14750.00);

INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, changed_at) VALUES
    ('a7000000-0000-0000-0000-000000000001', 'generated',    'acknowledged',
     'b4000000-0000-0000-0000-000000000004', '2026-06-13 10:00:00+00'),
    ('a7000000-0000-0000-0000-000000000001', 'acknowledged', 'in_transit',
     'b4000000-0000-0000-0000-000000000004', '2026-06-20 08:00:00+00'),
    ('a7000000-0000-0000-0000-000000000001', 'in_transit',   'delivered',
     'b4000000-0000-0000-0000-000000000004', '2026-07-12 16:00:00+00');

UPDATE vendors
SET cached_total_orders = 1, cached_on_time_delivery_rate = 100.00
WHERE id = 'c1000000-0000-0000-0000-000000000001';


-- Step 9: Invoice (pending — so judges can trigger the pay action)
INSERT INTO invoices (
    id, org_id, invoice_number, invoice_number_vendor, po_id, vendor_id,
    invoice_date, due_date,
    subtotal, tax_total, grand_total,
    bank_name, bank_account, bank_ifsc,
    notes, status, created_by
) VALUES (
    'a8000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'INV-2026-0001', 'INV-SS-2026-045',
    'a7000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    '2026-07-16', '2026-08-15',
    55250.00, 9945.00, 65195.00,
    'HDFC Bank', '12345678901234', 'HDFC0001234',
    'Payment due within 30 days of delivery.',
    'pending',
    'b4000000-0000-0000-0000-000000000004'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (
    invoice_id, product_name, quantity, unit,
    unit_price, subtotal, tax_percent, tax_amount, total
) VALUES
    ('a8000000-0000-0000-0000-000000000001', 'Steel Rod 10mm', 500, 'pieces',
     85.50, 42750.00, 18, 7695.00, 50445.00),
    ('a8000000-0000-0000-0000-000000000001', 'Steel Rod 12mm', 200, 'pieces',
     62.50, 12500.00, 18, 2250.00, 14750.00);


-- Step 10: Activity logs
INSERT INTO activity_logs (
    org_id, entity_type, entity_id, entity_ref,
    action, description, performed_by, performed_role, ip_address
) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'rfq',
     'd1000000-0000-0000-0000-000000000001', 'RFQ-2026-0001',
     'rfq_created', 'RFQ created and sent to 2 approved vendors',
     'b2000000-0000-0000-0000-000000000002', 'procurement_officer', '192.168.1.10'),
    ('a1000000-0000-0000-0000-000000000001', 'quotation',
     'e1000000-0000-0000-0000-000000000001', 'QT-2026-0001',
     'quotation_submitted', 'Steel Suppliers Ltd submitted a quotation',
     'b4000000-0000-0000-0000-000000000004', 'vendor', '192.168.1.20'),
    ('a1000000-0000-0000-0000-000000000001', 'quotation',
     'e2000000-0000-0000-0000-000000000002', 'QT-2026-0002',
     'quotation_submitted', 'Iron Works Co submitted a quotation',
     'b5000000-0000-0000-0000-000000000005', 'vendor', '192.168.1.21'),
    ('a1000000-0000-0000-0000-000000000001', 'rfq',
     'd1000000-0000-0000-0000-000000000001', 'RFQ-2026-0001',
     'vendor_shortlisted', 'Steel Suppliers Ltd shortlisted - best price',
     'b2000000-0000-0000-0000-000000000002', 'procurement_officer', '192.168.1.10'),
    ('a1000000-0000-0000-0000-000000000001', 'rfq',
     'd1000000-0000-0000-0000-000000000001', 'RFQ-2026-0001',
     'approval_requested', 'Approval request sent to manager',
     'b2000000-0000-0000-0000-000000000002', 'procurement_officer', '192.168.1.10'),
    ('a1000000-0000-0000-0000-000000000001', 'rfq',
     'd1000000-0000-0000-0000-000000000001', 'RFQ-2026-0001',
     'approval_granted', 'Manager approved procurement of Steel Rods Q2 2026',
     'b3000000-0000-0000-0000-000000000003', 'manager', '192.168.1.30'),
    ('a1000000-0000-0000-0000-000000000001', 'po',
     'a7000000-0000-0000-0000-000000000001', 'PO-2026-0001',
     'po_generated', 'Purchase Order generated and sent to Steel Suppliers Ltd',
     'b2000000-0000-0000-0000-000000000002', 'procurement_officer', '192.168.1.10'),
    ('a1000000-0000-0000-0000-000000000001', 'po',
     'a7000000-0000-0000-0000-000000000001', 'PO-2026-0001',
     'po_delivered', 'Delivery confirmed by vendor',
     'b4000000-0000-0000-0000-000000000004', 'vendor', '192.168.1.20'),
    ('a1000000-0000-0000-0000-000000000001', 'invoice',
     'a8000000-0000-0000-0000-000000000001', 'INV-2026-0001',
     'invoice_submitted', 'Invoice submitted by Steel Suppliers Ltd for PO-2026-0001',
     'b4000000-0000-0000-0000-000000000004', 'vendor', '192.168.1.20');


-- Step 11: Notifications
INSERT INTO notifications (org_id, user_id, type, title, message, entity_type, entity_id, is_read)
VALUES
    ('a1000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000002',
     'invoice', 'Invoice Received',
     'Steel Suppliers Ltd submitted invoice INV-2026-0001. Please review and process payment.',
     'invoice', 'a8000000-0000-0000-0000-000000000001', FALSE),
    ('a1000000-0000-0000-0000-000000000001',
     'b3000000-0000-0000-0000-000000000003',
     'approval', 'Approval Granted',
     'Your approval for RFQ-2026-0001 was recorded.',
     'rfq', 'd1000000-0000-0000-0000-000000000001', TRUE),
    ('a1000000-0000-0000-0000-000000000001',
     'b4000000-0000-0000-0000-000000000004',
     'po', 'Purchase Order Received',
     'Purchase Order PO-2026-0001 has been issued to you.',
     'po', 'a7000000-0000-0000-0000-000000000001', TRUE);


-- Re-enable all triggers
ALTER TABLE purchase_orders ENABLE TRIGGER trg_after_po_generated;
ALTER TABLE purchase_orders ENABLE TRIGGER trg_after_po_insert;
ALTER TABLE purchase_orders ENABLE TRIGGER trg_after_po_status_change;
ALTER TABLE purchase_orders ENABLE TRIGGER trg_before_po_status_change;
ALTER TABLE purchase_orders ENABLE TRIGGER trg_after_po_delivered;
ALTER TABLE purchase_orders ENABLE TRIGGER set_updated_at;

COMMIT;