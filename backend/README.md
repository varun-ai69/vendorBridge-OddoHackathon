# backend/README.md

Backend service for VendorBridge. Node.js + Express on top of PostgreSQL with row-level security. Exposes a REST API at `/api/v1`.

---

## Directory layout

```
backend/
├── server.js              # entry point, mounts all routes
├── package.json
├── DockerFile
├── db/
│   ├── index.js           # pool export: query / withSession / withTransaction / close
│   └── db.js
├── middlewares/
│   └── authMiddleware.js  # JWT verification + role guard
└── model/
    ├── schema.sql
    ├── triggers.sql
    ├── seed.sql
    └── SCHEMA.md          # LLM-optimized schema reference (tables, enums, triggers, views)
```

---

## Stack

| | |
|---|---|
| Runtime | Node.js 20 (Docker), 18+ (local) |
| Framework | Express 5 |
| Database | PostgreSQL 15+ via `pg` pool |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| RLS | PostgreSQL row-level security — enforced per request via session variables |

---

## Environment variables

Place in `backend/.env`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=oddoHackathon
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Optional — email (invite / password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Optional — file storage
STORAGE_BUCKET=your_bucket
STORAGE_URL=https://cdn.yourdomain.com
```

---

## DB connection (`db/index.js`)

Three exported functions:

`query(text, params)` — bare query, no RLS context. Use only for unauthenticated routes (login, register-org, forgot/reset password).

`withSession(user, fn)` — checks out a client, opens a transaction, injects the three RLS session variables via `SET LOCAL`, runs `fn(boundQuery)`, commits. Rolls back on error. Use for every authenticated route. `user` must carry `{ id, org_id, role }`.

`withTransaction(fn)` — transaction without RLS variables. Use for multi-step public operations (e.g. register-org creates org + admin user atomically).

The session variables set inside `withSession`:

```sql
SET LOCAL app.current_user_id = '<uuid>';
SET LOCAL app.current_org_id  = '<uuid>';
SET LOCAL app.current_role    = 'procurement_officer';
```

PostgreSQL RLS policies on every tenant-scoped table read these via helper functions `current_user_id()`, `current_org_id()`, `current_user_role()`. They are scoped to the transaction and cleared automatically on commit/rollback.

---

## Auth flow

1. `POST /api/v1/auth/login` — validates credentials, returns access token (24h) + refresh token (7d). Refresh token hash stored in `refresh_tokens` table.
2. `authMiddleware.js` — verifies JWT on every protected route, attaches `req.user = { id, org_id, role, ... }`.
3. Route handlers call `db.withSession(req.user, ...)` — this is where RLS is activated.
4. `POST /api/v1/auth/refresh-token` — validates refresh token hash, issues new access token.
5. `POST /api/v1/auth/logout` — marks refresh token as revoked.

JWT payload:

```json
{
  "sub": "uuid",
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "role": "procurement_officer",
  "org_id": "uuid",
  "iat": 1717200000,
  "exp": 1717286400
}
```

---

## Roles

| Role | What they own |
|---|---|
| `admin` | Full org control — users, vendors, analytics |
| `procurement_officer` | Creates RFQs, compares quotations, generates POs, marks invoices paid |
| `manager` | Approves or rejects procurement requests |
| `vendor` | Submits quotations, updates PO delivery status, generates invoices |

---

## Demo credentials (seed data)

All passwords: `Demo@12345`

| Email | Role |
|---|---|
| admin@vendorbridge.com | admin |
| procurement@vendorbridge.com | procurement_officer |
| manager@vendorbridge.com | manager |
| vendor1@steelsuppliers.com | vendor |
| vendor2@ironworks.com | vendor |

The seed also loads a complete lifecycle demo: RFQ-2026-0001 awarded to Steel Suppliers Ltd, PO-2026-0001 delivered, INV-2026-0001 pending payment — so every flow is visible on first login.

---

## Procurement lifecycle (state machine)

```
RFQ: draft -> sent -> awarded | cancelled | closed

  rfq_vendors (per vendor slot):
    pending -> quoted -> awarded | closed

  quotations:
    submitted -> under_review -> shortlisted -> accepted | rejected

  approval_requests:
    pending -> approved | rejected

  purchase_orders:
    generated -> acknowledged -> in_transit -> delivered | cancelled

  invoices:
    pending -> paid | overdue | disputed
```

Trigger 2 (`trg_after_po_generated`) fans out state across rfqs, quotations, and rfq_vendors in a single INSERT on purchase_orders — no application-layer orchestration needed.

---

## API base path

All routes are prefixed `/api/v1`. Full route list below. Detailed request/response shapes are in `api_contract.md` at the repo root.

### Route reference

```
AUTH
  POST   /auth/register-org          public
  POST   /auth/login                 public
  POST   /auth/refresh-token         public
  POST   /auth/logout                authenticated
  POST   /auth/forgot-password       public
  POST   /auth/reset-password        public
  PUT    /auth/change-password       authenticated
  GET    /auth/me                    authenticated
  PUT    /auth/me                    authenticated

ORG
  GET    /org/me                     admin
  PUT    /org/me                     admin

ADMIN — USERS
  POST   /admin/users/invite
  GET    /admin/users
  GET    /admin/users/:userId
  PUT    /admin/users/:userId
  PATCH  /admin/users/:userId/status
  POST   /admin/users/:userId/reset-password
  DELETE /admin/users/:userId

ADMIN — VENDORS
  POST   /admin/vendors
  GET    /admin/vendors
  GET    /admin/vendors/:vendorId
  PUT    /admin/vendors/:vendorId
  PATCH  /admin/vendors/:vendorId/status
  DELETE /admin/vendors/:vendorId

VENDOR SELF
  GET    /vendor/profile
  PUT    /vendor/profile
  GET    /vendor/rfqs
  GET    /vendor/rfqs/:rfqId
  POST   /vendor/rfqs/:rfqId/quotation
  PUT    /vendor/rfqs/:rfqId/quotation/:quotationId
  GET    /vendor/quotations
  GET    /vendor/quotations/:quotationId
  GET    /vendor/po
  POST   /vendor/po/:poId/invoice
  GET    /vendor/invoices
  GET    /vendor/invoices/:invoiceId
  GET    /vendor/reports/performance

RFQ
  POST   /rfq
  GET    /rfq
  GET    /rfq/:rfqId
  PUT    /rfq/:rfqId
  PATCH  /rfq/:rfqId/cancel
  POST   /rfq/:rfqId/vendors
  GET    /rfq/:rfqId/quotations
  GET    /rfq/:rfqId/quotations/compare
  PATCH  /rfq/:rfqId/quotations/:quotationId/select
  GET    /rfq/:rfqId/approval-status

APPROVALS
  GET    /approvals
  GET    /approvals/:approvalId
  PATCH  /approvals/:approvalId/action

PURCHASE ORDERS
  POST   /po
  GET    /po
  GET    /po/:poId
  GET    /po/:poId/download
  POST   /po/:poId/send-email
  PATCH  /po/:poId/status

INVOICES
  GET    /invoices
  GET    /invoices/:invoiceId
  GET    /invoices/:invoiceId/download
  POST   /invoices/:invoiceId/send-email
  PATCH  /invoices/:invoiceId/status

NOTIFICATIONS
  GET    /notifications
  PATCH  /notifications/:id/read
  PATCH  /notifications/read-all
  GET    /notifications/unread-count

ACTIVITY LOGS
  GET    /activity-logs              admin, manager

DASHBOARDS
  GET    /dashboard/admin
  GET    /dashboard/procurement
  GET    /dashboard/manager
  GET    /dashboard/vendor

REPORTS
  GET    /reports/procurement-summary
  GET    /reports/spend-trend
  GET    /reports/vendor-performance
  GET    /reports/approval-analytics
  GET    /reports/spend-by-category
  POST   /reports/export

UPLOADS
  POST   /upload                     multipart/form-data, field: file + entity_type
```

### Standard error shape

```json
{ "success": false, "error": "ERROR_CODE", "message": "human readable" }
```

Codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `BUSINESS_RULE_VIOLATION` (422), `INTERNAL_SERVER_ERROR` (500).

---

## Docker

The backend image is a two-stage build (node:20-alpine). Builder installs all deps; runner copies only what's needed and drops to a non-root user (`appuser`). Exposes port 5000.

```bash
docker build -t vendorbridge-backend .
docker run --env-file .env -p 5000:5000 vendorbridge-backend
```

SQL files (`model/`) are not needed inside the backend image — they are mounted into the Postgres init container at DB setup time.

---

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | nodemon server.js |
| `npm start` | node server.js |
| `npm run db:reset` | drops and recreates schema, triggers, seed in order |
| `npm run db:schema` | applies schema.sql only |
| `npm run db:seed` | applies seed.sql only |

`db:reset` requires `DB_USER`, `DB_NAME`, `DB_HOST` in environment.

---

## Schema reference

See `model/SCHEMA.md` for the full table reference: all columns with types and FK targets, enums, trigger summary, RLS rules, views, and the FK chain tree.