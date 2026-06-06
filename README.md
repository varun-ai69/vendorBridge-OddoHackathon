# 🏭 VendorBridge — Procurement Management System

> **Oddo Hackathon 2026** | Full-Stack Procurement Automation Platform

[![Node.js](https://img.shields.io/badge/Node.js-v26-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15-blue?logo=postgresql)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)](https://jwt.io/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Flow](#-system-flow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Roles & Permissions](#-roles--permissions)
- [API Contract](#-api-contract)
  - [1. Auth & Organization](#1-auth--organization)
  - [2. Organization Management](#2-organization-management)
  - [3. User Management (Admin)](#3-user-management-admin)
  - [4. Vendor Management](#4-vendor-management)
  - [5. RFQ (Request for Quotation)](#5-rfq-request-for-quotation)
  - [6. Quotations](#6-quotations)
  - [7. Approval Workflow](#7-approval-workflow)
  - [8. Purchase Orders (PO)](#8-purchase-orders-po)
  - [9. Invoices](#9-invoices)
  - [10. Activity Logs & Notifications](#10-activity-logs--notifications)
  - [11. Dashboard](#11-dashboard)
  - [12. Reports & Analytics](#12-reports--analytics)
  - [13. File Uploads](#13-file-uploads)
  - [14. Role Permission Matrix](#14-complete-role-permission-matrix)
  - [15. Standard Error Responses](#15-standard-error-responses)
  - [16. JWT Payload Structure](#16-jwt-payload-structure)
  - [17. Route Quick Reference](#17-route-summary-quick-reference)

---

## 🌟 Overview

**VendorBridge** is a comprehensive, role-based procurement management platform that digitizes and automates the entire procurement lifecycle — from vendor onboarding and RFQ generation to quotation comparison, manager approvals, purchase order generation, and invoice management.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 Role-Based Access | Admin, Procurement Officer, Manager, Vendor |
| 📋 RFQ Management | Create, send, and track Requests for Quotation |
| 💬 Vendor Quotations | Vendors submit quotations with auto-generated PDFs |
| ⚖️ Quotation Comparison | Side-by-side comparison with lowest price highlighting |
| ✅ Approval Workflow | Manager approve/reject with audit trail |
| 📦 Purchase Orders | Auto-generated POs sent directly to vendors |
| 🧾 Invoice Management | Vendor-generated invoices with PDF download |
| 📊 Analytics & Reports | Spending trends, vendor performance, exportable reports |
| 🔔 Real-time Notifications | Role-specific alerts and activity logs |

---

## 🔄 System Flow

```
1. Admin registers Organization
         ↓
2. Admin invites Procurement Officers, Managers, Vendors
         ↓
3. Procurement Officer creates RFQ → sends to selected (approved + active) Vendors
         ↓
4. Vendors receive RFQ → submit Quotations (auto-PDF generated)
         ↓
5. Procurement Officer compares Quotations → shortlists a Vendor
         ↓
6. Approval Request sent to Manager
         ↓
7. Manager approves / rejects
         ↓
8. (If approved) Procurement Officer generates Purchase Order
         ↓
9. Vendor receives PO → marks delivery → generates Invoice
         ↓
10. Procurement Officer reviews Invoice → marks as Paid
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js v26 |
| **Framework** | Express.js v5 |
| **Database** | PostgreSQL (via `pg`) |
| **Authentication** | JWT (`jsonwebtoken`) + `bcrypt` |
| **Environment** | `dotenv` |
| **CORS** | `cors` |
| **Frontend** | Next.js 16 (App Router) — `frontend/` → see `frontend/AGENTS.md` |

---

## 📁 Project Structure

```
Oddo-Hackathon-2026/
├── backend/
│   ├── controllers/        # Route handler logic
│   ├── db/                 # PostgreSQL connection
│   ├── middlewares/        # Auth, role-guard, error handler
│   ├── model/              # SQL schema & migrations
│   │   └── schema.sql
│   ├── routes/             # Express route definitions
│   ├── services/           # Business logic layer
│   ├── utils/              # Helpers (PDF gen, email, etc.)
│   ├── .env                # Environment variables
│   ├── package.json
│   └── server.js           # App entry point
├── frontend/               # Next.js frontend (see frontend/AGENTS.md)
├── api_contract.md         # Full API contract (standalone)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/varun-ai69/vendorBridge-OddoHackathon.git
cd vendorBridge-OddoHackathon

# Install backend dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# Run database migrations
psql -U postgres -d oddoHackathon -f model/schema.sql

# Start the backend server
npm run dev
```

### Running the Backend

```bash
cd backend
npm run dev        # Development (with nodemon)
npm start          # Production
```

> Server starts at `http://localhost:5000`

---

## 🔧 Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5000

# PostgreSQL
DB_USER=postgres
DB_HOST=localhost
DB_NAME=oddoHackathon
DB_PASSWORD=your_password_here
DB_PORT=5432

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email (for invite/reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Storage (CDN/S3)
STORAGE_BUCKET=your_bucket_name
STORAGE_URL=https://cdn.yourdomain.com
```

---

## 👥 Roles & Permissions

| Role | Description |
|------|-------------|
| `admin` | Full system control — manages users, vendors, analytics |
| `procurement_officer` | Creates RFQs, compares quotations, generates POs |
| `manager` | Approves or rejects procurement requests |
| `vendor` | Submits quotations, tracks RFQs, generates invoices |

---

## 📡 API Contract

> **Base URL:** `https://<your-domain>/api/v1`  
> **Auth:** `Authorization: Bearer <jwt_token>` (except public routes)

### Legend

| Symbol | Role |
|--------|------|
| 🌐 | Public (no auth) |
| 👑 | Admin only |
| 🛒 | Procurement Officer |
| ✅ | Manager / Approver |
| 🏪 | Vendor |
| 🔄 | All authenticated roles |

---

### 1. Auth & Organization

#### `POST /auth/register-org` 🌐
Register a new organization along with the first admin account.

**Request Body:**
```json
{
  "org_name": "Acme Corp",
  "org_address": "123 Main St",
  "org_gst": "29ABCDE1234F1Z5",
  "org_industry": "Manufacturing",
  "org_website": "https://acme.com",
  "admin_name": "John Doe",
  "admin_email": "john@acme.com",
  "admin_password": "StrongPass@123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "org_id": "uuid",
  "admin_id": "uuid"
}
```

---

#### `POST /auth/login` 🌐
Login for all roles (Admin, Procurement Officer, Manager, Vendor).

**Request Body:**
```json
{
  "email": "john@acme.com",
  "password": "StrongPass@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@acme.com",
    "role": "admin",
    "org_id": "uuid"
  }
}
```

---

#### `POST /auth/refresh-token` 🌐
```json
// Request
{ "refresh_token": "token_here" }

// Response 200
{ "token": "new_jwt_token" }
```

#### `POST /auth/logout` 🔄
```json
// Response 200
{ "success": true, "message": "Logged out successfully" }
```

#### `POST /auth/forgot-password` 🌐
```json
// Request
{ "email": "john@acme.com" }

// Response 200
{ "success": true, "message": "Password reset link sent to email" }
```

#### `POST /auth/reset-password` 🌐
```json
// Request
{ "token": "reset_token_from_email", "new_password": "NewPass@456" }
```

#### `PUT /auth/change-password` 🔄
```json
// Request
{ "current_password": "OldPass@123", "new_password": "NewPass@456" }
```

#### `GET /auth/me` 🔄
Returns the authenticated user's full profile including org info.

#### `PUT /auth/me` 🔄
```json
// Request
{ "name": "John Updated", "phone": "+91-9876543210", "avatar_url": "https://cdn/avatar.png" }
```

---

### 2. Organization Management

#### `GET /org/me` 👑
Get current organization details.

#### `PUT /org/me` 👑
```json
// Request
{
  "name": "Acme Corp Updated",
  "address": "456 New St",
  "gst": "29ABCDE1234F1Z5",
  "website": "https://acme-new.com",
  "logo_url": "https://cdn/logo.png"
}
```

---

### 3. User Management (Admin)

#### `POST /admin/users/invite` 👑
Invite a Procurement Officer or Manager with a generated password. Credentials are emailed to the user.

```json
// Request
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "role": "procurement_officer",
  "phone": "+91-9000000001",
  "department": "Procurement",
  "generated_password": "TempPass@789"
}

// Response 201
{
  "success": true,
  "message": "User invited. Credentials sent to email.",
  "user_id": "uuid"
}
```

#### `GET /admin/users` 👑
**Query Params:** `role`, `is_active`, `search`, `page`, `limit`

#### `GET /admin/users/:userId` 👑
#### `PUT /admin/users/:userId` 👑
#### `PATCH /admin/users/:userId/status` 👑
```json
{ "is_active": false }
```
#### `POST /admin/users/:userId/reset-password` 👑
```json
{ "new_password": "ResetPass@999" }
```
#### `DELETE /admin/users/:userId` 👑

---

### 4. Vendor Management

#### `POST /admin/vendors` 👑
Create and invite a vendor. Login credentials are emailed to the vendor.

```json
// Request
{
  "company_name": "Steel Suppliers Ltd",
  "contact_person": "Raj Kumar",
  "email": "raj@steelsuppliers.com",
  "phone": "+91-9111111111",
  "address": "Plot 12, MIDC, Pune",
  "gst_number": "27AAAPL1234C1Z5",
  "pan_number": "AAAPL1234C",
  "category": ["Raw Materials", "Steel"],
  "bank_name": "HDFC Bank",
  "bank_account": "12345678901234",
  "bank_ifsc": "HDFC0001234",
  "generated_password": "Vendor@123",
  "notes": "Preferred vendor for Q1"
}

// Response 201
{
  "success": true,
  "vendor_id": "uuid",
  "message": "Vendor created. Login credentials sent to vendor email."
}
```

#### `GET /admin/vendors` 👑 🛒
**Query Params:** `category`, `is_active`, `is_approved`, `search`, `page`, `limit`

#### `GET /admin/vendors/:vendorId` 👑 🛒
#### `PUT /admin/vendors/:vendorId` 👑
#### `PATCH /admin/vendors/:vendorId/status` 👑
```json
{ "is_approved": true, "is_active": true, "remarks": "Verified documents" }
```
#### `DELETE /admin/vendors/:vendorId` 👑

#### `GET /vendor/profile` 🏪
#### `PUT /vendor/profile` 🏪
```json
{
  "contact_person": "Raj Kumar Jr.",
  "phone": "+91-9222222222",
  "address": "New Address",
  "bank_account": "98765432109876",
  "bank_ifsc": "HDFC0009876"
}
```

---

### 5. RFQ (Request for Quotation)

#### `POST /rfq` 🛒
Create a new RFQ and send to selected approved + active vendors.

```json
// Request
{
  "title": "Steel Rods Q2 2026",
  "description": "Need 500 units of 10mm steel rods",
  "items": [
    {
      "product_name": "Steel Rod 10mm",
      "description": "Grade A, Hot Rolled",
      "quantity": 500,
      "unit": "pieces",
      "specifications": "IS:1786 Grade Fe 415"
    }
  ],
  "deadline": "2026-07-01T18:00:00Z",
  "delivery_location": "Pune Factory",
  "vendor_ids": ["uuid1", "uuid2", "uuid3"],
  "attachment_urls": ["https://cdn/spec.pdf"],
  "notes": "Urgent requirement"
}

// Response 201
{
  "success": true,
  "rfq_id": "uuid",
  "rfq_number": "RFQ-2026-0001",
  "status": "sent",
  "message": "RFQ sent to 3 approved vendors"
}
```

#### `GET /rfq` 👑 🛒 ✅
**Query Params:** `status` (`draft`|`sent`|`closed`|`awarded`|`cancelled`), `search`, `date_from`, `date_to`, `page`, `limit`

#### `GET /rfq/:rfqId` 👑 🛒 ✅
#### `PUT /rfq/:rfqId` 🛒 *(only when in `draft` status)*
#### `PATCH /rfq/:rfqId/cancel` 🛒
```json
{ "reason": "Budget constraint" }
```
#### `POST /rfq/:rfqId/vendors` 🛒
```json
{ "vendor_ids": ["uuid4", "uuid5"] }
```

#### `GET /vendor/rfqs` 🏪
**Query Params:** `status` (`pending`|`quoted`|`closed`|`awarded`), `page`, `limit`

#### `GET /vendor/rfqs/:rfqId` 🏪

---

### 6. Quotations

#### `POST /vendor/rfqs/:rfqId/quotation` 🏪
Submit a quotation. Auto-generates a PDF.

```json
// Request
{
  "items": [
    {
      "rfq_item_id": "uuid",
      "product_name": "Steel Rod 10mm",
      "unit_price": 85.50,
      "quantity": 500,
      "unit": "pieces",
      "tax_percent": 18,
      "subtotal": 42750
    }
  ],
  "total_amount": 50445,
  "currency": "INR",
  "delivery_timeline_days": 14,
  "delivery_terms": "Ex-Works Pune",
  "payment_terms": "Net 30",
  "validity_days": 30,
  "notes": "Prices valid for 30 days",
  "attachment_urls": ["https://cdn/quotation.pdf"]
}

// Response 201
{
  "success": true,
  "quotation_id": "uuid",
  "quotation_number": "QT-2026-0001",
  "pdf_url": "https://cdn/generated/QT-2026-0001.pdf",
  "message": "Quotation submitted and PDF generated"
}
```

#### `PUT /vendor/rfqs/:rfqId/quotation/:quotationId` 🏪 *(before PO is raised)*
#### `GET /vendor/quotations` 🏪
**Query Params:** `status` (`submitted`|`under_review`|`shortlisted`|`rejected`|`accepted`), `page`

#### `GET /vendor/quotations/:quotationId` 🏪

#### `GET /rfq/:rfqId/quotations` 🛒 ✅
List all quotations received for an RFQ.

#### `GET /rfq/:rfqId/quotations/compare` 🛒 ✅
Side-by-side comparison of all quotations for an RFQ.

```json
// Response 200
{
  "rfq_id": "uuid",
  "rfq_number": "RFQ-2026-0001",
  "items_comparison": [
    {
      "product_name": "Steel Rod 10mm",
      "quantity": 500,
      "vendors": [
        {
          "vendor_name": "Steel Suppliers Ltd",
          "unit_price": 85.50,
          "total": 50445,
          "delivery_days": 14,
          "is_lowest_price": true
        },
        {
          "vendor_name": "Iron Works Co",
          "unit_price": 92.00,
          "total": 54280,
          "delivery_days": 10,
          "is_lowest_price": false
        }
      ]
    }
  ],
  "summary": {
    "lowest_price_vendor_id": "uuid1",
    "fastest_delivery_vendor_id": "uuid2"
  }
}
```

#### `PATCH /rfq/:rfqId/quotations/:quotationId/select` 🛒
Shortlist a vendor — triggers approval request to Manager.
```json
// Request
{ "selection_reason": "Best price with acceptable delivery timeline" }

// Response 200
{
  "success": true,
  "message": "Quotation shortlisted. Approval request sent to manager.",
  "approval_request_id": "uuid"
}
```

---

### 7. Approval Workflow

#### `GET /approvals` ✅
**Query Params:** `status` (`pending`|`approved`|`rejected`), `page`, `limit`

```json
// Response 200
{
  "approvals": [
    {
      "approval_id": "uuid",
      "rfq_number": "RFQ-2026-0001",
      "rfq_title": "Steel Rods Q2 2026",
      "selected_vendor": "Steel Suppliers Ltd",
      "quotation_amount": 50445,
      "requested_by": "Jane Smith",
      "requested_at": "2026-06-12T09:00:00Z",
      "status": "pending"
    }
  ]
}
```

#### `GET /approvals/:approvalId` ✅ 🛒
Get detailed approval info with full timeline.

#### `PATCH /approvals/:approvalId/action` ✅
```json
// Request
{
  "action": "approved",
  "remarks": "Price is within budget. Proceed with PO generation."
}
// action: "approved" | "rejected"

// Response 200
{
  "success": true,
  "action": "approved",
  "message": "Procurement approved. Procurement Officer can now generate PO."
}
```

#### `GET /rfq/:rfqId/approval-status` 🛒

---

### 8. Purchase Orders (PO)

#### `POST /po` 🛒 *(only after manager approval)*
```json
// Request
{
  "rfq_id": "uuid",
  "quotation_id": "uuid",
  "approval_id": "uuid",
  "delivery_address": "Acme Corp, Plot 45, Pune - 411018",
  "expected_delivery_date": "2026-07-15",
  "payment_terms": "Net 30 days",
  "special_instructions": "Deliver to Gate 2, contact Ravi"
}

// Response 201
{
  "success": true,
  "po_id": "uuid",
  "po_number": "PO-2026-0001",
  "pdf_url": "https://cdn/generated/PO-2026-0001.pdf",
  "message": "Purchase Order generated and sent to vendor"
}
```

#### `GET /po` 👑 🛒 ✅
**Query Params:** `status` (`generated`|`acknowledged`|`in_transit`|`delivered`|`cancelled`), `vendor_id`, `date_from`, `date_to`, `page`, `limit`

#### `GET /po/:poId` 👑 🛒 ✅ 🏪*(own)*
#### `GET /po/:poId/download` 👑 🛒 🏪
Returns PDF binary (`Content-Type: application/pdf`)

#### `POST /po/:poId/send-email` 🛒
```json
{ "recipient_email": "raj@steelsuppliers.com", "message": "Please find attached the PO." }
```

#### `PATCH /po/:poId/status` 🛒 🏪
```json
{ "status": "acknowledged", "remarks": "PO received, will deliver by July 12." }
```
> Vendor: `acknowledged` → `in_transit` → `delivered`  
> Procurement Officer: can `cancel`

#### `GET /vendor/po` 🏪

---

### 9. Invoices

#### `POST /vendor/po/:poId/invoice` 🏪
Generate an invoice for a delivered PO. Auto-generates PDF.

```json
// Request
{
  "invoice_date": "2026-07-16",
  "invoice_number_vendor": "INV-SS-2026-045",
  "items": [
    {
      "product_name": "Steel Rod 10mm",
      "quantity": 500,
      "unit_price": 85.50,
      "subtotal": 42750,
      "tax_percent": 18,
      "tax_amount": 7695,
      "total": 50445
    }
  ],
  "subtotal": 42750,
  "tax_total": 7695,
  "grand_total": 50445,
  "bank_name": "HDFC Bank",
  "bank_account": "12345678901234",
  "bank_ifsc": "HDFC0001234",
  "due_date": "2026-08-15",
  "notes": "Payment due within 30 days"
}

// Response 201
{
  "success": true,
  "invoice_id": "uuid",
  "invoice_number": "INV-2026-0001",
  "pdf_url": "https://cdn/generated/INV-2026-0001.pdf",
  "message": "Invoice generated and sent to Procurement Officer"
}
```

#### `GET /invoices` 👑 🛒 ✅
**Query Params:** `status` (`pending`|`paid`|`overdue`|`disputed`), `vendor_id`, `date_from`, `date_to`, `page`

#### `GET /invoices/:invoiceId` 👑 🛒 ✅ 🏪*(own)*
#### `GET /invoices/:invoiceId/download` 👑 🛒 🏪
Returns PDF binary

#### `POST /invoices/:invoiceId/send-email` 🛒 🏪
```json
{ "recipient_email": "finance@acme.com", "message": "Please process the invoice." }
```

#### `PATCH /invoices/:invoiceId/status` 👑 🛒
```json
{
  "status": "paid",
  "payment_date": "2026-08-10",
  "payment_reference": "NEFT-TXN-12345",
  "remarks": "Payment completed"
}
```

#### `GET /vendor/invoices` 🏪
#### `GET /vendor/invoices/:invoiceId` 🏪

---

### 10. Activity Logs & Notifications

#### `GET /activity-logs` 👑 ✅
**Query Params:** `entity_type` (`rfq`|`quotation`|`po`|`invoice`|`user`|`vendor`), `entity_id`, `user_id`, `date_from`, `date_to`, `page`

```json
// Response 200
{
  "logs": [
    {
      "log_id": "uuid",
      "entity_type": "rfq",
      "entity_ref": "RFQ-2026-0001",
      "action": "rfq_sent",
      "description": "RFQ sent to 3 vendors",
      "performed_by": "Jane Smith",
      "role": "procurement_officer",
      "timestamp": "2026-06-01T10:00:00Z"
    }
  ]
}
```

#### `GET /notifications` 🔄
**Query Params:** `is_read`, `type` (`rfq`|`quotation`|`approval`|`po`|`invoice`), `page`

```json
// Response 200
{
  "notifications": [
    {
      "id": "uuid",
      "type": "approval",
      "title": "Approval Required",
      "message": "RFQ-2026-0001 is awaiting your approval",
      "is_read": false,
      "created_at": "2026-06-12T09:00:00Z"
    }
  ],
  "unread_count": 3
}
```

#### `PATCH /notifications/:notificationId/read` 🔄
#### `PATCH /notifications/read-all` 🔄
#### `GET /notifications/unread-count` 🔄
```json
// Response 200
{ "unread_count": 3 }
```

---

### 11. Dashboard

#### `GET /dashboard/admin` 👑
```json
{
  "total_users": 12,
  "total_vendors": 45,
  "active_rfqs": 8,
  "pending_approvals": 3,
  "total_pos_this_month": 15,
  "total_spend_this_month": 1250000,
  "total_invoices_pending": 6,
  "recent_rfqs": [],
  "spend_by_category": [
    { "category": "Raw Materials", "amount": 750000 }
  ]
}
```

#### `GET /dashboard/procurement` 🛒
```json
{
  "my_active_rfqs": 5,
  "my_pending_approvals": 2,
  "my_pos_this_month": 8,
  "quotations_received_today": 3,
  "recent_rfqs": [],
  "recent_pos": []
}
```

#### `GET /dashboard/manager` ✅
```json
{
  "pending_approvals": 4,
  "approved_this_month": 18,
  "rejected_this_month": 2,
  "total_spend_approved": 3250000,
  "approval_trend": [
    { "month": "Jan", "approved": 12, "rejected": 1 }
  ]
}
```

#### `GET /dashboard/vendor` 🏪
```json
{
  "active_rfqs_received": 3,
  "quotations_submitted": 12,
  "quotations_accepted": 4,
  "active_pos": 2,
  "pending_invoices": 1,
  "total_revenue_this_month": 250000
}
```

---

### 12. Reports & Analytics

#### `GET /reports/procurement-summary` 👑 ✅ 🛒
**Query Params:** `date_from`, `date_to`, `vendor_id`, `category`, `format` (`json`|`csv`|`pdf`)

```json
// Response 200
{
  "period": { "from": "2026-01-01", "to": "2026-06-30" },
  "total_rfqs_created": 45,
  "total_quotations_received": 132,
  "total_pos_generated": 38,
  "total_spend": 12500000,
  "avg_quotation_response_time_days": 4.2,
  "avg_approval_time_hours": 18.5,
  "top_vendors": [
    { "vendor_name": "Steel Suppliers Ltd", "total_orders": 12, "total_value": 4200000 }
  ]
}
```

#### `GET /reports/spend-trend` 👑 ✅
**Query Params:** `year`, `category`

```json
// Response 200
{
  "year": 2026,
  "monthly_trend": [
    { "month": "January", "month_num": 1, "total_spend": 1200000, "po_count": 8 }
  ]
}
```

#### `GET /reports/vendor-performance` 👑 ✅ 🛒
**Query Params:** `vendor_id`, `date_from`, `date_to`

```json
// Response 200
{
  "vendors": [
    {
      "vendor_name": "Steel Suppliers Ltd",
      "total_rfqs_received": 20,
      "quotations_submitted": 18,
      "acceptance_rate": 66.7,
      "on_time_delivery_rate": 91.6,
      "total_value_awarded": 4200000,
      "avg_rating": 4.5
    }
  ]
}
```

#### `GET /reports/approval-analytics` 👑 ✅
#### `GET /reports/spend-by-category` 👑 ✅ 🛒

#### `POST /reports/export` 👑 ✅ 🛒
```json
// Request
{
  "report_type": "procurement_summary",
  "format": "csv",
  "date_from": "2026-01-01",
  "date_to": "2026-06-30"
}
```
Returns file download

#### `GET /vendor/reports/performance` 🏪
```json
{
  "total_rfqs_received": 20,
  "quotations_submitted": 18,
  "acceptance_rate": 66.7,
  "on_time_delivery_rate": 91.6,
  "total_revenue": 4200000,
  "monthly_revenue": [
    { "month": "January", "revenue": 350000 }
  ]
}
```

---

### 13. File Uploads

#### `POST /upload` 🔄
**Request:** `multipart/form-data`

| Field | Type | Values |
|-------|------|--------|
| `file` | File | Any document/image |
| `entity_type` | string | `rfq` \| `quotation` \| `po` \| `invoice` |

```json
// Response 200
{
  "success": true,
  "file_url": "https://cdn/uploads/uuid-filename.pdf",
  "file_name": "specification.pdf",
  "file_size": 204800,
  "mime_type": "application/pdf"
}
```

---

### 14. Complete Role Permission Matrix

| Endpoint Area | Admin | Procurement Officer | Manager | Vendor |
|:-------------|:-----:|:-------------------:|:-------:|:------:|
| Register Org | ✅ | ❌ | ❌ | ❌ |
| Login / Auth | ✅ | ✅ | ✅ | ✅ |
| Forgot/Reset Password | ✅ | ✅ | ✅ | ✅ |
| Invite Users | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ Full CRUD | ❌ | ❌ | ❌ |
| Create Vendor | ✅ | ❌ | ❌ | ❌ |
| View Vendors | ✅ | ✅ | Read only | Own profile |
| Approve Vendor | ✅ | ❌ | ❌ | ❌ |
| Create RFQ | ❌ | ✅ | ❌ | ❌ |
| View RFQs | ✅ | ✅ | ✅ | Own RFQs |
| Submit Quotation | ❌ | ❌ | ❌ | ✅ |
| Compare Quotations | ❌ | ✅ | ✅ view | ❌ |
| Shortlist Vendor | ❌ | ✅ | ❌ | ❌ |
| Approve/Reject | ❌ | ❌ | ✅ | ❌ |
| Generate PO | ❌ | ✅ post-approval | ❌ | ❌ |
| View POs | ✅ | ✅ | ✅ | Own POs |
| Generate Invoice | ❌ | ❌ | ❌ | ✅ |
| View Invoices | ✅ | ✅ | ✅ | Own invoices |
| Mark Invoice Paid | ✅ | ✅ | ❌ | ❌ |
| Activity Logs | ✅ Full | ❌ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Admin Dashboard | ✅ | ❌ | ❌ | ❌ |
| Procurement Dashboard | ❌ | ✅ | ❌ | ❌ |
| Manager Dashboard | ❌ | ❌ | ✅ | ❌ |
| Vendor Dashboard | ❌ | ❌ | ❌ | ✅ |
| Reports (Full) | ✅ | Partial | ✅ | Own stats |
| Export Reports | ✅ | ✅ | ✅ | ❌ |

---

### 15. Standard Error Responses

```json
// 400 Bad Request
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "details": [{ "field": "email", "issue": "required" }]
}

// 401 Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}

// 403 Forbidden
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You do not have permission to perform this action"
}

// 404 Not Found
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "RFQ not found"
}

// 409 Conflict
{
  "success": false,
  "error": "CONFLICT",
  "message": "A quotation has already been submitted for this RFQ"
}

// 422 Unprocessable Entity
{
  "success": false,
  "error": "BUSINESS_RULE_VIOLATION",
  "message": "Cannot generate PO without manager approval"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Something went wrong. Please try again."
}
```

---

### 16. JWT Payload Structure

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

> **Token Expiry:** Access token = `24h` | Refresh token = `7 days`

---

### 17. Route Summary Quick Reference

```
AUTH
  POST   /api/v1/auth/register-org
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh-token
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password
  PUT    /api/v1/auth/change-password
  GET    /api/v1/auth/me
  PUT    /api/v1/auth/me

ORG
  GET    /api/v1/org/me
  PUT    /api/v1/org/me

ADMIN ─ USERS
  POST   /api/v1/admin/users/invite
  GET    /api/v1/admin/users
  GET    /api/v1/admin/users/:userId
  PUT    /api/v1/admin/users/:userId
  PATCH  /api/v1/admin/users/:userId/status
  POST   /api/v1/admin/users/:userId/reset-password
  DELETE /api/v1/admin/users/:userId

ADMIN ─ VENDORS
  POST   /api/v1/admin/vendors
  GET    /api/v1/admin/vendors
  GET    /api/v1/admin/vendors/:vendorId
  PUT    /api/v1/admin/vendors/:vendorId
  PATCH  /api/v1/admin/vendors/:vendorId/status
  DELETE /api/v1/admin/vendors/:vendorId

VENDOR SELF
  GET    /api/v1/vendor/profile
  PUT    /api/v1/vendor/profile
  GET    /api/v1/vendor/rfqs
  GET    /api/v1/vendor/rfqs/:rfqId
  POST   /api/v1/vendor/rfqs/:rfqId/quotation
  PUT    /api/v1/vendor/rfqs/:rfqId/quotation/:quotationId
  GET    /api/v1/vendor/quotations
  GET    /api/v1/vendor/quotations/:quotationId
  GET    /api/v1/vendor/po
  POST   /api/v1/vendor/po/:poId/invoice
  GET    /api/v1/vendor/invoices
  GET    /api/v1/vendor/invoices/:invoiceId
  GET    /api/v1/vendor/reports/performance
  GET    /api/v1/dashboard/vendor

RFQ
  POST   /api/v1/rfq
  GET    /api/v1/rfq
  GET    /api/v1/rfq/:rfqId
  PUT    /api/v1/rfq/:rfqId
  PATCH  /api/v1/rfq/:rfqId/cancel
  POST   /api/v1/rfq/:rfqId/vendors
  GET    /api/v1/rfq/:rfqId/quotations
  GET    /api/v1/rfq/:rfqId/quotations/compare
  PATCH  /api/v1/rfq/:rfqId/quotations/:quotationId/select
  GET    /api/v1/rfq/:rfqId/approval-status

APPROVALS
  GET    /api/v1/approvals
  GET    /api/v1/approvals/:approvalId
  PATCH  /api/v1/approvals/:approvalId/action

PURCHASE ORDERS
  POST   /api/v1/po
  GET    /api/v1/po
  GET    /api/v1/po/:poId
  GET    /api/v1/po/:poId/download
  POST   /api/v1/po/:poId/send-email
  PATCH  /api/v1/po/:poId/status

INVOICES
  GET    /api/v1/invoices
  GET    /api/v1/invoices/:invoiceId
  GET    /api/v1/invoices/:invoiceId/download
  POST   /api/v1/invoices/:invoiceId/send-email
  PATCH  /api/v1/invoices/:invoiceId/status

NOTIFICATIONS
  GET    /api/v1/notifications
  PATCH  /api/v1/notifications/:id/read
  PATCH  /api/v1/notifications/read-all
  GET    /api/v1/notifications/unread-count

ACTIVITY LOGS
  GET    /api/v1/activity-logs

DASHBOARDS
  GET    /api/v1/dashboard/admin
  GET    /api/v1/dashboard/procurement
  GET    /api/v1/dashboard/manager
  GET    /api/v1/dashboard/vendor

REPORTS
  GET    /api/v1/reports/procurement-summary
  GET    /api/v1/reports/spend-trend
  GET    /api/v1/reports/vendor-performance
  GET    /api/v1/reports/approval-analytics
  GET    /api/v1/reports/spend-by-category
  POST   /api/v1/reports/export

UPLOADS
  POST   /api/v1/upload
```

---

## 📱 Mobile Application

VendorBridge includes a native mobile application built using **React Native (Expo SDK ~53)** and **TypeScript**. It serves the Admin, Procurement Officer, Manager, and Vendor roles in a responsive, modern environment with offline capabilities, biometric auth, haptic alerts, and custom dashboard layouts.

For the full mobile project plan, execution timeline, technical stack details, and the 74-item implementation checklist, refer to the [Mobile App Handbook](file:///C:/Users/ahadd/Documents/GitHub/vendorBridge-OddoHackathon/Mobile%20App/README.md).

### Quick Setup
To get started with the mobile app:
1. Go to the mobile application directory:
   ```bash
   cd "Mobile App"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (in mock mode by default):
   ```bash
   npx expo start
   ```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — © 2026 VendorBridge Team | Oddo Hackathon

---

*Built with ❤️ for Oddo Hackathon 2026*
