import { TEST_USERS } from "./testUsers";
import { ROLES } from "./constants";

const ORG_ID = "org-acme-001";

function buildUser(key, extra = {}) {
  const t = TEST_USERS[key];
  return {
    id: `user-${key}`,
    name: t.name,
    email: t.email,
    phone: t.phone,
    role: t.role,
    org_id: ORG_ID,
    org_name: t.org_name || "Acme Corp",
    is_active: true,
    avatar_url: null,
    created_at: "2026-01-01T00:00:00Z",
    ...extra,
  };
}

const DEFAULT_STORE = {
  users: [
    buildUser(ROLES.ADMIN),
    buildUser(ROLES.PROCUREMENT, { department: "Procurement" }),
    buildUser(ROLES.MANAGER, { department: "Finance" }),
    buildUser(ROLES.VENDOR),
  ],
  vendors: [
    {
      id: "vendor-001",
      company_name: "Steel Suppliers Ltd",
      contact_person: "Raj Kumar",
      email: "vendor@steelsuppliers.com",
      phone: "+91-9111111111",
      address: "Plot 12, MIDC, Pune",
      gst_number: "27AAAPL1234C1Z5",
      pan_number: "AAAPL1234C",
      category: ["Raw Materials", "Steel"],
      is_active: true,
      is_approved: true,
      rating: 4.5,
      total_orders: 12,
      on_time_delivery_rate: 91.6,
      created_at: "2026-01-15T00:00:00Z",
    },
    {
      id: "vendor-002",
      company_name: "Iron Works Co",
      contact_person: "Amit Shah",
      email: "amit@ironworks.com",
      phone: "+91-9222222222",
      address: "Sector 5, Industrial Area, Mumbai",
      gst_number: "27BBBBB5678D1Z9",
      pan_number: "BBBBB5678D",
      category: ["Steel", "Iron"],
      is_active: true,
      is_approved: true,
      rating: 4.2,
      total_orders: 8,
      on_time_delivery_rate: 85.0,
      created_at: "2026-02-01T00:00:00Z",
    },
    {
      id: "vendor-003",
      company_name: "Precision Metals",
      contact_person: "Priya Desai",
      email: "priya@precision.com",
      phone: "+91-9333333333",
      address: "GIDC, Ahmedabad",
      gst_number: "24CCCCC9012E1Z3",
      pan_number: "CCCCC9012E",
      category: ["Raw Materials"],
      is_active: true,
      is_approved: false,
      rating: 0,
      total_orders: 0,
      created_at: "2026-05-20T00:00:00Z",
    },
  ],
  rfqs: [
    {
      id: "rfq-001",
      rfq_id: "rfq-001",
      rfq_number: "RFQ-2026-0001",
      title: "Steel Rods Q2 2026",
      description: "Need 500 units of 10mm steel rods, Grade A hot rolled",
      status: "sent",
      deadline: "2026-07-01T18:00:00Z",
      delivery_location: "Pune Factory",
      vendor_count: 2,
      quotation_count: 2,
      created_at: "2026-06-01T10:00:00Z",
      items: [
        { id: "item-001", product_name: "Steel Rod 10mm", description: "Grade A, Hot Rolled", quantity: 500, unit: "pieces", specifications: "IS:1786 Grade Fe 415" },
      ],
      vendors: [
        { id: "vendor-001", company_name: "Steel Suppliers Ltd" },
        { id: "vendor-002", company_name: "Iron Works Co" },
      ],
    },
    {
      id: "rfq-002",
      rfq_id: "rfq-002",
      rfq_number: "RFQ-2026-0002",
      title: "Office Laptops Q3",
      description: "100 laptops for new employees",
      status: "awarded",
      deadline: "2026-08-15T18:00:00Z",
      delivery_location: "Mumbai HQ",
      vendor_count: 3,
      quotation_count: 3,
      created_at: "2026-05-15T09:00:00Z",
      items: [
        { id: "item-002", product_name: "Business Laptop", description: "i5, 16GB RAM, 512GB SSD", quantity: 100, unit: "pieces" },
      ],
    },
  ],
  approvals: [
    {
      approval_id: "appr-001",
      rfq_number: "RFQ-2026-0001",
      rfq_title: "Steel Rods Q2 2026",
      selected_vendor: "Steel Suppliers Ltd",
      quotation_amount: 50445,
      requested_by: "Jane Procurement",
      requested_at: "2026-06-12T09:00:00Z",
      status: "pending",
    },
    {
      approval_id: "appr-002",
      rfq_number: "RFQ-2026-0003",
      rfq_title: "Industrial Pumps",
      selected_vendor: "Iron Works Co",
      quotation_amount: 125000,
      requested_by: "Jane Procurement",
      requested_at: "2026-06-10T14:00:00Z",
      status: "approved",
    },
  ],
  pos: [
    {
      po_id: "po-001",
      id: "po-001",
      po_number: "PO-2026-0001",
      vendor_name: "Steel Suppliers Ltd",
      org_name: "Acme Corp",
      total_amount: 50445,
      status: "acknowledged",
      expected_delivery_date: "2026-07-15",
      created_at: "2026-06-15T10:00:00Z",
    },
    {
      po_id: "po-002",
      id: "po-002",
      po_number: "PO-2026-0002",
      vendor_name: "Iron Works Co",
      org_name: "Acme Corp",
      total_amount: 125000,
      status: "in_transit",
      expected_delivery_date: "2026-07-20",
      created_at: "2026-06-18T11:00:00Z",
    },
  ],
  invoices: [
    {
      invoice_id: "inv-001",
      id: "inv-001",
      invoice_number: "INV-2026-0001",
      po_number: "PO-2026-0001",
      vendor_name: "Steel Suppliers Ltd",
      grand_total: 50445,
      status: "pending",
      due_date: "2026-08-15",
      created_at: "2026-07-16T09:00:00Z",
    },
    {
      invoice_id: "inv-002",
      id: "inv-002",
      invoice_number: "INV-2026-0002",
      po_number: "PO-2026-0002",
      vendor_name: "Iron Works Co",
      grand_total: 125000,
      status: "paid",
      due_date: "2026-08-20",
      created_at: "2026-07-20T10:00:00Z",
    },
  ],
  vendorRfqs: [
    {
      id: "rfq-001",
      rfq_id: "rfq-001",
      rfq_number: "RFQ-2026-0001",
      title: "Steel Rods Q2 2026",
      status: "pending",
      deadline: "2026-07-01T18:00:00Z",
      org_name: "Acme Corp",
      has_quotation: false,
      items: [
        { id: "item-001", rfq_item_id: "item-001", product_name: "Steel Rod 10mm", description: "Grade A, Hot Rolled", quantity: 500, unit: "pieces" },
      ],
    },
  ],
  vendorQuotations: [
    {
      quotation_id: "qt-001",
      quotation_number: "QT-2026-0001",
      rfq_number: "RFQ-2026-0000",
      total_amount: 42000,
      status: "accepted",
      created_at: "2026-05-01T10:00:00Z",
    },
  ],
  notifications: [
    { id: "n-001", type: "approval", title: "Approval Required", message: "RFQ-2026-0001 is awaiting your approval", is_read: false, created_at: "2026-06-12T09:00:00Z" },
    { id: "n-002", type: "quotation", title: "Quotation Received", message: "Steel Suppliers Ltd submitted a quotation", is_read: false, created_at: "2026-06-11T15:00:00Z" },
    { id: "n-003", type: "rfq", title: "New RFQ", message: "RFQ-2026-0001 sent to vendors", is_read: true, created_at: "2026-06-01T10:00:00Z" },
  ],
  activityLogs: [
    { log_id: "log-001", entity_type: "rfq", entity_ref: "RFQ-2026-0001", action: "rfq_sent", description: "RFQ sent to 2 vendors", performed_by: "Jane Procurement", role: "procurement_officer", timestamp: "2026-06-01T10:00:00Z" },
    { log_id: "log-002", entity_type: "quotation", entity_ref: "QT-2026-0001", action: "quotation_submitted", description: "Quotation submitted by Steel Suppliers Ltd", performed_by: "Raj Kumar", role: "vendor", timestamp: "2026-06-11T15:00:00Z" },
    { log_id: "log-003", entity_type: "approval", entity_ref: "RFQ-2026-0001", action: "approval_requested", description: "Approval request sent to manager", performed_by: "Jane Procurement", role: "procurement_officer", timestamp: "2026-06-12T09:00:00Z" },
  ],
};

let store = null;

export function getStore() {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STORE);
  if (!store) {
    const saved = sessionStorage.getItem("vb_mock_store");
    store = saved ? JSON.parse(saved) : structuredClone(DEFAULT_STORE);
  }
  return store;
}

export function saveStore() {
  if (typeof window !== "undefined" && store) {
    sessionStorage.setItem("vb_mock_store", JSON.stringify(store));
  }
}

export function resetStore() {
  store = structuredClone(DEFAULT_STORE);
  saveStore();
}

export function findTestUserByCredentials(email, password) {
  return Object.values(TEST_USERS).find(
    (u) => u.email === email && u.password === password
  );
}

export function testUserToAuthUser(testUser) {
  return {
    id: `user-${testUser.role}`,
    name: testUser.name,
    email: testUser.email,
    phone: testUser.phone,
    role: testUser.role,
    org_id: ORG_ID,
    org_name: testUser.org_name || "Acme Corp",
    avatar_url: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  };
}
