# VendorBridge - Exhaustive API Postman Collection

This reference serves as the master API execution sheet. It contains **every single endpoint** built on the backend, clearly displaying what the JSON structure should look like, what token is required, and any query parameters.

> [!IMPORTANT]
> - All roots start with `http://localhost:5000/api/v1`
> - `{{admin_token}}`, `{{po_token}}`, `{{manager_token}}`, and `{{vendor_token}}` represent the Bearer Authorization header for that respective role.

---

## 1. Authentication & Organization

### 1.1 Register Organization
- **Method**: `POST`
- **Route**: `/auth/register-org`
- **Auth**: None
```json
{
  "org_name": "Stark Industries",
  "org_address": "10880 Malibu Point",
  "org_gst": "29ABCDE1234F1Z5",
  "org_industry": "Defense",
  "admin_name": "Tony Stark",
  "admin_email": "tony@stark.com",
  "admin_password": "Password@123"
}
```

### 1.2 Login
- **Method**: `POST`
- **Route**: `/auth/login`
- **Auth**: None
```json
{
  "email": "tony@stark.com",
  "password": "Password@123"
}
```

### 1.3 Get My Profile
- **Method**: `GET`
- **Route**: `/auth/me`
- **Auth**: Any Token
*(No Body)*

### 1.4 Update My Profile
- **Method**: `PUT`
- **Route**: `/auth/me`
- **Auth**: Any Token
```json
{
  "name": "Tony Stark Updated",
  "phone": "+91-9999900000"
}
```

### 1.5 Refresh Token
- **Method**: `POST`
- **Route**: `/auth/refresh`
- **Auth**: None
```json
{
  "refresh_token": "<PASTE_REFRESH_TOKEN_HERE>"
}
```

---

## 2. User Management (Internal)

### 2.1 Invite Internal User
- **Method**: `POST`
- **Route**: `/admin/users/invite`
- **Auth**: `{{admin_token}}`
```json
{
  "name": "Pepper Potts",
  "email": "pepper@stark.com",
  "role": "procurement_officer",
  "phone": "+91-9000000001",
  "department": "Procurement",
  "generated_password": "Password@123"
}
```

### 2.2 List Users
- **Method**: `GET`
- **Route**: `/admin/users`
- **Auth**: `{{admin_token}}`
- **Query Params**: `?role=procurement_officer&page=1&limit=10`
*(No Body)*

### 2.3 Update User
- **Method**: `PUT`
- **Route**: `/admin/users/<USER_ID>`
- **Auth**: `{{admin_token}}`
```json
{
  "name": "Pepper Potts Updated",
  "department": "Finance"
}
```

### 2.4 Toggle User Status
- **Method**: `PATCH`
- **Route**: `/admin/users/<USER_ID>/status`
- **Auth**: `{{admin_token}}`
```json
{
  "is_active": false
}
```

---

## 3. Vendor Management

### 3.1 Create / Invite Vendor
- **Method**: `POST`
- **Route**: `/vendors`
- **Auth**: `{{admin_token}}`
```json
{
  "company_name": "Hammer Tech",
  "contact_person": "Justin Hammer",
  "email": "justin@hammertech.com",
  "phone": "+91-9111111111",
  "address": "Queens, NY",
  "gst_number": "27AAAPL1234C1Z5",
  "category": ["Weapons", "Raw Materials"],
  "bank_name": "Chase Bank",
  "bank_account": "111222333",
  "bank_ifsc": "CHAS0001",
  "generated_password": "Password@123",
  "notes": "Fast shipping provider"
}
```

### 3.2 List All Vendors
- **Method**: `GET`
- **Route**: `/vendors`
- **Auth**: `{{admin_token}}` or `{{po_token}}`
- **Query Params**: `?is_active=true&is_approved=true`
*(No Body)*

### 3.3 Get Single Vendor Detail
- **Method**: `GET`
- **Route**: `/vendors/<VENDOR_ID>`
- **Auth**: `{{admin_token}}` or `{{po_token}}`
*(No Body)*

### 3.4 Update Vendor (Admin)
- **Method**: `PUT`
- **Route**: `/vendors/<VENDOR_ID>`
- **Auth**: `{{admin_token}}`
```json
{
  "phone": "+91-8888888888"
}
```

### 3.5 Approve / Status Vendor
- **Method**: `PATCH`
- **Route**: `/vendors/<VENDOR_ID>/status`
- **Auth**: `{{admin_token}}`
```json
{
  "is_approved": true,
  "is_active": true,
  "remarks": "Background check cleared."
}
```

### 3.6 Delete Vendor
- **Method**: `DELETE`
- **Route**: `/vendors/<VENDOR_ID>`
- **Auth**: `{{admin_token}}`
*(No Body)*

### 3.7 Get Vendor Profile (Self)
- **Method**: `GET`
- **Route**: `/vendor/profile`
- **Auth**: `{{vendor_token}}`
*(No Body)*

### 3.8 Update Vendor Profile (Self)
- **Method**: `PUT`
- **Route**: `/vendor/profile`
- **Auth**: `{{vendor_token}}`
```json
{
  "address": "New Office Address, NY"
}
```

---

## 4. Request for Quotation (RFQ)

### 4.1 Create RFQ
- **Method**: `POST`
- **Route**: `/rfq`
- **Auth**: `{{po_token}}`
```json
{
  "title": "Titanium Alloy Q3",
  "description": "Need 500 units of high-grade Titanium",
  "items": [
    {
      "product_name": "Titanium Plate",
      "description": "Grade 5, Rolled",
      "quantity": 500,
      "unit": "pieces",
      "specifications": "IS:1234"
    }
  ],
  "deadline": "2026-12-01T18:00:00Z",
  "delivery_location": "Malibu Point",
  "vendor_ids": ["<VENDOR_ID_1>"],
  "notes": "Urgent requirement"
}
```

### 4.2 List RFQs
- **Method**: `GET`
- **Route**: `/rfq`
- **Auth**: `{{po_token}}` or `{{manager_token}}`
- **Query Params**: `?status=sent`
*(No Body)*

### 4.3 Get Single RFQ
- **Method**: `GET`
- **Route**: `/rfq/<RFQ_ID>`
- **Auth**: `{{po_token}}` or `{{manager_token}}`
*(No Body)*

### 4.4 Update RFQ
- **Method**: `PUT`
- **Route**: `/rfq/<RFQ_ID>`
- **Auth**: `{{po_token}}`
```json
{
  "delivery_location": "New Jersey Warehouse"
}
```

### 4.5 Cancel RFQ
- **Method**: `PATCH`
- **Route**: `/rfq/<RFQ_ID>/status`
- **Auth**: `{{po_token}}`
```json
{
  "status": "cancelled",
  "cancel_reason": "Budget cuts"
}
```

---

## 5. Quotations

### 5.1 Vendor Submit Quotation
- **Method**: `POST`
- **Route**: `/vendor/rfqs/<RFQ_ID>/quotation`
- **Auth**: `{{vendor_token}}`
```json
{
  "items": [
    {
      "product_name": "Titanium Plate",
      "unit_price": 1000,
      "quantity": 500,
      "unit": "pieces",
      "tax_percent": 18,
      "tax_amount": 90000,
      "subtotal": 500000,
      "total": 590000
    }
  ],
  "total_amount": 590000,
  "currency": "USD",
  "delivery_timeline_days": 14,
  "delivery_terms": "Ex-Works",
  "payment_terms": "Net 30",
  "validity_days": 30
}
```

### 5.2 Vendor Update Quotation
- **Method**: `PUT`
- **Route**: `/vendor/rfqs/<RFQ_ID>/quotation/<QUOTA_ID>`
- **Auth**: `{{vendor_token}}`
```json
{
  "total_amount": 580000,
  "delivery_timeline_days": 12
}
```

### 5.3 Vendor List My Quotations
- **Method**: `GET`
- **Route**: `/vendor/quotations`
- **Auth**: `{{vendor_token}}`
*(No Body)*

### 5.4 Vendor Get Single Quotation
- **Method**: `GET`
- **Route**: `/vendor/quotations/<QUOTA_ID>`
- **Auth**: `{{vendor_token}}`
*(No Body)*

### 5.5 PO List Quotations for RFQ
- **Method**: `GET`
- **Route**: `/rfq/<RFQ_ID>/quotations`
- **Auth**: `{{po_token}}`
*(No Body)*

### 5.6 PO Compare Quotations (Side-by-Side Matrix)
- **Method**: `GET`
- **Route**: `/rfq/<RFQ_ID>/compare`
- **Auth**: `{{po_token}}`
*(No Body)*

### 5.7 PO Shortlist Quotation (Creates Approval Request)
- **Method**: `PATCH`
- **Route**: `/rfq/<RFQ_ID>/quotations/<QUOTA_ID>/select`
- **Auth**: `{{po_token}}`
```json
{
  "selection_reason": "Lowest price and meets specs."
}
```

---

## 6. Approvals

### 6.1 Manager List Pending Approvals
- **Method**: `GET`
- **Route**: `/approvals`
- **Auth**: `{{manager_token}}`
- **Query Params**: `?status=pending`
*(No Body)*

### 6.2 Manager Get Approval Detail
- **Method**: `GET`
- **Route**: `/approvals/<APPROVAL_ID>`
- **Auth**: `{{manager_token}}` or `{{po_token}}`
*(No Body)*

### 6.3 Manager Approve/Reject
- **Method**: `PATCH`
- **Route**: `/approvals/<APPROVAL_ID>/action`
- **Auth**: `{{manager_token}}`
```json
{
  "action": "approved",
  "remarks": "Approved. Send the PO."
}
```

### 6.4 PO View RFQ Approvals Status
- **Method**: `GET`
- **Route**: `/rfq/<RFQ_ID>/approvals`
- **Auth**: `{{po_token}}`
*(No Body)*

---

## 7. Purchase Orders (PO)

### 7.1 Generate PO
- **Method**: `POST`
- **Route**: `/po`
- **Auth**: `{{po_token}}`
```json
{
  "rfq_id": "<RFQ_ID>",
  "quotation_id": "<QUOTA_ID>",
  "approval_id": "<APPROVAL_ID>",
  "delivery_address": "10880 Malibu Point",
  "expected_delivery_date": "2026-07-15",
  "payment_terms": "Net 30 days",
  "special_instructions": "Gate 4 delivery only."
}
```

### 7.2 PO/Admin List All POs
- **Method**: `GET`
- **Route**: `/po`
- **Auth**: `{{po_token}}` or `{{admin_token}}`
*(No Body)*

### 7.3 PO/Admin Get Single PO
- **Method**: `GET`
- **Route**: `/po/<PO_ID>`
- **Auth**: `{{po_token}}` or `{{admin_token}}`
*(No Body)*

### 7.4 Change PO Status
- **Method**: `PATCH`
- **Route**: `/po/<PO_ID>/status`
- **Auth**: `{{po_token}}`
```json
{
  "status": "delivered",
  "remarks": "Items verified at warehouse."
}
```

### 7.5 Vendor List My POs
- **Method**: `GET`
- **Route**: `/vendor/po`
- **Auth**: `{{vendor_token}}`
*(No Body)*

### 7.6 Vendor Get Single PO
- **Method**: `GET`
- **Route**: `/vendor/po/<PO_ID>`
- **Auth**: `{{vendor_token}}`
*(No Body)*

### 7.7 Vendor Acknowledge PO
- **Method**: `PATCH`
- **Route**: `/vendor/po/<PO_ID>/ack`
- **Auth**: `{{vendor_token}}`
```json
{
  "action": "acknowledged",
  "remarks": "Will ship tomorrow."
}
```

---

## 8. Invoices (Accounts Payable)

### 8.1 Vendor Generate Invoice
- **Method**: `POST`
- **Route**: `/vendor/po/<PO_ID>/invoice`
- **Auth**: `{{vendor_token}}`
```json
{
  "invoice_date": "2026-07-16",
  "invoice_number_vendor": "INV-HT-999",
  "items": [
    {
      "product_name": "Titanium Plate",
      "quantity": 500,
      "unit": "pieces",
      "unit_price": 1000,
      "subtotal": 500000,
      "tax_percent": 18,
      "tax_amount": 90000,
      "total": 590000
    }
  ],
  "subtotal": 500000,
  "tax_total": 90000,
  "grand_total": 590000,
  "bank_name": "Bank of America",
  "bank_account": "123456789",
  "bank_ifsc": "BOA001",
  "due_date": "2026-08-15"
}
```

### 8.2 List Invoices
- **Method**: `GET`
- **Route**: `/invoices`
- **Auth**: `{{po_token}}` or `{{admin_token}}`
*(No Body)*

### 8.3 Get Single Invoice
- **Method**: `GET`
- **Route**: `/invoices/<INVOICE_ID>`
- **Auth**: `{{po_token}}` or `{{admin_token}}`
*(No Body)*

### 8.4 Pay Invoice
- **Method**: `PATCH`
- **Route**: `/invoices/<INVOICE_ID>/status`
- **Auth**: `{{po_token}}` or `{{admin_token}}`
```json
{
  "status": "paid",
  "payment_date": "2026-08-10",
  "payment_reference": "WIRE-TXN-12345",
  "remarks": "Payment confirmed cleared."
}
```

---

## 9. Activity Logs & Notifications

### 9.1 Get Global Activity Logs
- **Method**: `GET`
- **Route**: `/activity-logs`
- **Auth**: `{{admin_token}}` or `{{manager_token}}`
*(No Body)*

### 9.2 Get My Notifications
- **Method**: `GET`
- **Route**: `/notifications`
- **Auth**: Any Token
*(No Body)*

### 9.3 Mark Notification Read
- **Method**: `PATCH`
- **Route**: `/notifications/<NOTIFICATION_ID>/read`
- **Auth**: Any Token
*(No Body)*

### 9.4 Mark All Notifications Read
- **Method**: `POST`
- **Route**: `/notifications/read-all`
- **Auth**: Any Token
*(No Body)*

### 9.5 Get Unread Notifications Count
- **Method**: `GET`
- **Route**: `/notifications/unread-count`
- **Auth**: Any Token
*(No Body)*

---

## 10. Analytical Dashboards

### 10.1 Admin Dashboard
- **Method**: `GET`
- **Route**: `/dashboard/admin`
- **Auth**: `{{admin_token}}`

### 10.2 Procurement Officer Dashboard
- **Method**: `GET`
- **Route**: `/dashboard/procurement`
- **Auth**: `{{po_token}}`

### 10.3 Manager Dashboard
- **Method**: `GET`
- **Route**: `/dashboard/manager`
- **Auth**: `{{manager_token}}`

### 10.4 Vendor Dashboard
- **Method**: `GET`
- **Route**: `/vendor/dashboard`
- **Auth**: `{{vendor_token}}`

---

## 11. Reports Generation

### 11.1 Procurement Summary
- **Method**: `GET`
- **Route**: `/reports/procurement-summary`
- **Auth**: `{{admin_token}}`

### 11.2 Spend Trend
- **Method**: `GET`
- **Route**: `/reports/spend-trend`
- **Auth**: `{{admin_token}}`

### 11.3 Vendor Performance
- **Method**: `GET`
- **Route**: `/reports/vendor-performance`
- **Auth**: `{{admin_token}}`

### 11.4 Approval Analytics
- **Method**: `GET`
- **Route**: `/reports/approval-analytics`
- **Auth**: `{{admin_token}}`

### 11.5 Export Report (CSV)
- **Method**: `POST`
- **Route**: `/reports/export`
- **Auth**: `{{admin_token}}`

---

## 12. File Uploads

### 12.1 Upload Global Attachment
- **Method**: `POST`
- **Route**: `/upload`
- **Auth**: Any Token
- **Headers**: `Content-Type: multipart/form-data`
*Note: In postman, use the Form-Data tab.*
- `file`: (Select a file to upload)
- `entity_type`: "rfq"
- `entity_id`: "<RFQ_ID>"
- `file_name`: "Specs.pdf"
