# SCHEMA.md

PostgreSQL 15+. Single-tenant-per-org model. RLS enforced on all tenant-scoped tables via session variables `app.current_org_id`, `app.current_user_id`, `app.current_role` (set by Express per request).

Extensions: `pgcrypto` (UUIDs), `pg_trgm` (trigram search indexes).

---

## Enums

| Enum | Values |
|---|---|
| `user_role` | admin, procurement_officer, manager, vendor |
| `rfq_status` | draft, sent, closed, awarded, cancelled |
| `rfq_vendor_status` | pending, quoted, closed, awarded |
| `quotation_status` | submitted, under_review, shortlisted, rejected, accepted |
| `approval_status` | pending, approved, rejected |
| `approval_priority` | low, medium, high |
| `po_status` | generated, acknowledged, in_transit, delivered, cancelled |
| `invoice_status` | pending, paid, overdue, disputed |
| `notification_type` | rfq, quotation, approval, po, invoice |
| `entity_type` | rfq, quotation, po, invoice, user, vendor |
| `document_type` | rfq, quotation, po, invoice |

---

## Tables

### organizations
Root tenant table. No RLS.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT NN | |
| address, gst, industry, website, logo_url | TEXT | gst UNIQUE |
| is_active | BOOLEAN | default TRUE |
| created_at, updated_at | TIMESTAMPTZ | |

---

### users
All roles in one table. Vendors get `vendor_id` populated; internal users leave it NULL.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| name, email | TEXT NN | UNIQUE(org_id, email) |
| password_hash | TEXT NN | bcrypt |
| role | user_role NN | |
| phone, department, avatar_url | TEXT | internal users only |
| vendor_id | UUID FK vendors | NULL for internal users |
| is_active | BOOLEAN | default TRUE |
| created_at, updated_at | TIMESTAMPTZ | |

RLS: internal roles see all users in org; vendors see only own row.

---

### refresh_tokens / password_reset_tokens
Standard auth token tables. Not tenant-scoped. `token_hash` stored (never raw). `revoked` / `used` flags.

---

### vendors
One vendor company per org. Corresponds to a `users` row with `role = 'vendor'`.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | UNIQUE(org_id, email) |
| company_name, contact_person, email, phone, address | TEXT | |
| gst_number, pan_number | TEXT | |
| category | TEXT[] | filter with `&&` operator |
| bank_name, bank_account, bank_ifsc | TEXT | |
| is_active, is_approved | BOOLEAN | |
| approval_remarks, notes | TEXT | |
| cached_rating | NUMERIC(3,2) | denormalized, refreshed by trigger |
| cached_total_orders | INT | denormalized |
| cached_on_time_delivery_rate | NUMERIC(5,2) | percentage, refreshed by trigger |
| created_at, updated_at | TIMESTAMPTZ | |

RLS: internal roles see all vendors in org; vendor user sees only own record.

---

### document_sequences
Per-org, per-type, per-year auto-increment counters.

PK: `(org_id, doc_type, year)`. `last_seq INT`.

Function `next_document_number(org_id, doc_type, year)` atomically increments and returns formatted strings like `RFQ-2026-0001`, `PO-2026-0001`, `QT-2026-0001`, `INV-2026-0001`.

---

### rfqs

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| rfq_number | TEXT NN | UNIQUE(org_id, rfq_number) |
| title, description, notes | TEXT | |
| deadline | TIMESTAMPTZ | |
| delivery_location | TEXT | |
| status | rfq_status | default draft |
| cancel_reason | TEXT | |
| created_by | UUID FK users | |
| created_at, updated_at | TIMESTAMPTZ | |

RLS: internal roles see all in org; vendors see only RFQs where they appear in `rfq_vendors`.

### rfq_items
Child of rfqs (CASCADE delete). Fields: `product_name, description, quantity NUMERIC(12,3), unit, specifications`.

### rfq_attachments
Child of rfqs. Fields: `file_url, file_name, uploaded_by FK users`.

### rfq_vendors
Junction: which vendors received which RFQ.

PK: `(rfq_id, vendor_id)`. Fields: `status rfq_vendor_status` (default pending), `sent_at`.

---

### quotations
One quotation per vendor per RFQ. UNIQUE `(rfq_id, vendor_id)`.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| quotation_number | TEXT NN | UNIQUE(org_id, quotation_number) |
| rfq_id | UUID FK rfqs | |
| vendor_id | UUID FK vendors | |
| currency | TEXT | default INR |
| subtotal, tax_total, total_amount | NUMERIC(14,2) | |
| delivery_timeline_days | INT | |
| delivery_terms, payment_terms | TEXT | |
| validity_days | INT | |
| notes, selection_reason | TEXT | selection_reason filled on shortlist |
| status | quotation_status | default submitted |
| pdf_url | TEXT | |
| submitted_at, updated_at | TIMESTAMPTZ | |

RLS: internal roles see all in org; vendors see only own quotations.

### quotation_items
Child of quotations. `rfq_item_id FK rfq_items` (SET NULL on delete). Fields: `product_name, quantity, unit, unit_price NUMERIC(14,4), subtotal, tax_percent, tax_amount, total`.

### quotation_attachments
Child of quotations. Fields: `file_url, file_name, uploaded_at`.

---

### approval_requests
Single-level approval (manager approves procurement officer's request). `level SMALLINT` kept for future multi-level.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| rfq_id | UUID FK rfqs | |
| quotation_id | UUID FK quotations | |
| requested_by | UUID FK users | procurement officer |
| reviewed_by | UUID FK users | manager who acted, nullable |
| status | approval_status | default pending |
| priority | approval_priority | default medium |
| remarks | TEXT | |
| level | SMALLINT | default 1, reserved |
| requested_at, reviewed_at | TIMESTAMPTZ | |

RLS: internal roles only (admin, procurement_officer, manager). Vendors have no access.

---

### purchase_orders
PO items are a snapshot at generation time; never FK to live `quotation_items`.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| po_number | TEXT NN | UNIQUE(org_id, po_number) |
| rfq_id | UUID FK rfqs | |
| quotation_id | UUID FK quotations | |
| approval_id | UUID FK approval_requests | |
| vendor_id | UUID FK vendors | |
| subtotal, tax_total, grand_total | NUMERIC(14,2) | |
| delivery_address | TEXT | |
| expected_delivery_date | DATE | used for on_time calc |
| payment_terms, special_instructions | TEXT | |
| status | po_status | default generated |
| acknowledged_at, in_transit_at, delivered_at, cancelled_at | TIMESTAMPTZ | stamped by trigger |
| pdf_url | TEXT | |
| created_by | UUID FK users | |
| created_at, updated_at | TIMESTAMPTZ | |

RLS: internal roles see all in org; vendors see only own POs.

### po_items
Snapshot child of purchase_orders (CASCADE delete). Same line-item columns as quotation_items.

### po_status_history
Audit trail for PO status changes. Fields: `po_id, from_status po_status, to_status po_status, remarks, changed_by FK users, changed_at`. Populated by trigger (reads `app.current_user_id`).

---

### invoices
Vendor raises against a PO. Partial deliveries allowed (items are also snapshotted).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| invoice_number | TEXT NN | system-generated, UNIQUE(org_id, invoice_number) |
| invoice_number_vendor | TEXT | vendor's own reference |
| po_id | UUID FK purchase_orders | |
| vendor_id | UUID FK vendors | |
| invoice_date | DATE NN | |
| due_date | DATE | |
| subtotal, tax_total, grand_total | NUMERIC(14,2) | |
| bank_name, bank_account, bank_ifsc | TEXT | |
| notes | TEXT | |
| status | invoice_status | default pending |
| payment_date, payment_reference, payment_remarks | - | filled by procurement/admin on pay |
| pdf_url | TEXT | |
| created_by | UUID FK users | vendor's user record |
| created_at, updated_at | TIMESTAMPTZ | |

RLS: internal roles see all in org; vendors see only own invoices.

### invoice_items
Child of invoices (CASCADE delete). Same line-item columns as po_items.

---

### notifications

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| user_id | UUID FK users | |
| type | notification_type | |
| title, message | TEXT NN | |
| entity_type | entity_type | nullable |
| entity_id | UUID | nullable, no FK (polymorphic) |
| is_read | BOOLEAN | default FALSE |
| created_at | TIMESTAMPTZ | |

RLS: each user sees only own rows.

---

### activity_logs
Append-only audit trail. Never update or delete.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK organizations | |
| entity_type | entity_type NN | |
| entity_id | UUID NN | |
| entity_ref | TEXT | human-readable e.g. "RFQ-2026-0001" |
| action | TEXT NN | e.g. "rfq_sent", "po_generated", "invoice_paid" |
| description | TEXT | |
| performed_by | UUID FK users | nullable |
| performed_role | user_role | |
| ip_address | INET | |
| created_at | TIMESTAMPTZ | |

RLS: admin and manager only.

---

### file_uploads
Polymorphic file tracker via `(entity_type, entity_id)`. No FK on entity_id.

Fields: `org_id, file_url, file_name, file_size BIGINT, mime_type, entity_type, entity_id, uploaded_by FK users, uploaded_at`.

RLS: org-scoped; fine-grained enforcement at app layer.

---

## Triggers

| # | Trigger | Event | Effect |
|---|---|---|---|
| 1 | `trg_after_quotation_submitted` | INSERT or UPDATE status→submitted on quotations | Sets `rfq_vendors.status = 'quoted'` for that vendor |
| 2 | `trg_after_po_generated` | INSERT on purchase_orders | Awards RFQ, accepts winning quotation, rejects all other open quotations, sets rfq_vendors awarded/closed |
| 3 | `trg_before_po_status_change` | BEFORE UPDATE status on purchase_orders | Stamps `acknowledged_at / in_transit_at / delivered_at / cancelled_at` (COALESCE guard, no overwrite) |
| 4 | `trg_after_po_status_change` | AFTER UPDATE status on purchase_orders | Inserts row into `po_status_history`; reads actor from `app.current_user_id` |
| 5 | `trg_after_po_delivered` | AFTER UPDATE status on purchase_orders | On delivered/cancelled: recomputes `cached_total_orders` and `cached_on_time_delivery_rate` on vendor row |
| 6 | `trg_after_invoice_paid` | AFTER UPDATE status on invoices | On status→paid: touches `vendors.updated_at` for app-layer cache invalidation |
| 7 | `trg_after_approval_action` | AFTER UPDATE status on approval_requests | On approved/rejected: inserts notification to the requesting procurement officer |
| 8 | `trg_after_quotation_insert` | AFTER INSERT on quotations | Inserts notification to RFQ creator (procurement officer) |
| 9 | `trg_after_po_insert` | AFTER INSERT on purchase_orders | Inserts notification to vendor user (looks up via `users.vendor_id`) |
| 10 | `trg_after_invoice_insert` | AFTER INSERT on invoices | Inserts notification to PO creator (procurement officer) |
| auto | `set_updated_at` | BEFORE UPDATE on organizations, users, vendors, rfqs, quotations, purchase_orders, invoices | Sets `updated_at = NOW()` |

---

## Views

**vendor_performance** — joins vendors + quotations + purchase_orders. Computes: `total_orders, total_value_awarded, quotations_submitted, quotations_accepted, acceptance_rate, avg_delivery_time_days, on_time_delivery_rate`. Used by vendor list and reports endpoints.

**rfq_summary** — joins rfqs + users + rfq_vendors + quotations. Returns per-RFQ: `vendor_count, quotation_count, created_by_name`. Used by RFQ list endpoint.

Both views query base tables and respect RLS.

---

## RLS Session Variables

Set by Express at the start of every request transaction:

```sql
SET LOCAL app.current_user_id = '<uuid>';
SET LOCAL app.current_org_id  = '<uuid>';
SET LOCAL app.current_role    = 'procurement_officer'; -- user_role enum value
```

Helper functions used inside policies: `current_org_id()`, `current_user_id()`, `current_user_role()`.

Superuser connections (e.g. seed scripts) bypass RLS.

---

## Core FK Chain (happy path)

```
organizations
  └── vendors
  └── users (vendor_id → vendors)
        └── rfqs (created_by)
              └── rfq_items
              └── rfq_vendors (vendor_id)
              └── quotations (rfq_id, vendor_id)
                    └── quotation_items (rfq_item_id → rfq_items)
                    └── approval_requests (rfq_id, quotation_id)
                          └── purchase_orders (rfq_id, quotation_id, approval_id, vendor_id)
                                └── po_items
                                └── po_status_history
                                └── invoices (po_id, vendor_id)
                                      └── invoice_items
```