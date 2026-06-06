import { UserProfile } from "../../store/authStore";
import { NotificationItem } from "../../store/notifStore";

export const mockUsers: UserProfile[] = [
  {
    id: "admin-uuid",
    name: "Ahad Dngwala",
    email: "admin@vendorbridge.com",
    role: "admin",
    org_id: "org-1",
    org_name: "Acme Industries",
    phone: "+91-9876543210",
    department: "Executive",
  },
  {
    id: "po-uuid",
    name: "Jane Smith",
    email: "po@vendorbridge.com",
    role: "procurement_officer",
    org_id: "org-1",
    org_name: "Acme Industries",
    phone: "+91-9000000001",
    department: "Procurement",
  },
  {
    id: "manager-uuid",
    name: "Robert Miller",
    email: "manager@vendorbridge.com",
    role: "manager",
    org_id: "org-1",
    org_name: "Acme Industries",
    phone: "+91-9000000002",
    department: "Finance",
  },
  {
    id: "vendor-uuid",
    name: "Raj Kumar",
    email: "vendor@vendorbridge.com",
    role: "vendor",
    org_id: "org-1",
    org_name: "Steel Suppliers Ltd",
    phone: "+91-9111111111",
    department: "Sales",
  },
];

export const mockDashboards = {
  admin: {
    total_users: 12,
    total_vendors: 45,
    active_rfqs: 8,
    pending_approvals: 3,
    total_pos_this_month: 15,
    total_spend_this_month: 1250000,
    total_invoices_pending: 6,
    spend_by_category: [
      { category: "Raw Materials", amount: 750000 },
      { category: "Logistics", amount: 250000 },
      { category: "Office Equipment", amount: 150000 },
      { category: "IT Infrastructure", amount: 100000 },
    ],
  },
  procurement: {
    my_active_rfqs: 5,
    my_pending_approvals: 2,
    my_pos_this_month: 8,
    quotations_received_today: 3,
  },
  manager: {
    pending_approvals: 4,
    approved_this_month: 18,
    rejected_this_month: 2,
    total_spend_approved: 3250000,
    approval_trend: [
      { month: "Jan", approved: 12, rejected: 1 },
      { month: "Feb", approved: 15, rejected: 2 },
      { month: "Mar", approved: 18, rejected: 1 },
      { month: "Apr", approved: 14, rejected: 0 },
      { month: "May", approved: 20, rejected: 3 },
      { month: "Jun", approved: 18, rejected: 2 },
    ],
  },
  vendor: {
    active_rfqs_received: 3,
    quotations_submitted: 12,
    quotations_accepted: 4,
    active_pos: 2,
    pending_invoices: 1,
    total_revenue_this_month: 250000,
  },
};

export interface Vendor {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  pan_number: string;
  category: string[];
  is_active: boolean;
  is_approved: boolean;
  rating: number;
  total_orders: number;
  on_time_delivery_rate: number;
  created_at: string;
  notes?: string;
}

export const mockVendors: Vendor[] = [
  {
    id: "vendor-1",
    company_name: "Steel Suppliers Ltd",
    contact_person: "Raj Kumar",
    email: "raj@steelsuppliers.com",
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
    created_at: "2026-01-01T00:00:00Z",
    notes: "Primary steel supplier, reliable.",
  },
  {
    id: "vendor-2",
    company_name: "Iron Works Co",
    contact_person: "Sanjay Singh",
    email: "sanjay@ironworks.co.in",
    phone: "+91-9222222222",
    address: "Industrial Area Phase 2, Mumbai",
    gst_number: "27BBBPL1234C1Z5",
    pan_number: "BBBPL1234C",
    category: ["Raw Materials", "Iron"],
    is_active: true,
    is_approved: true,
    rating: 3.8,
    total_orders: 8,
    on_time_delivery_rate: 85.0,
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "vendor-3",
    company_name: "Apex Logistics",
    contact_person: "Vikram Malhotra",
    email: "vikram@apexlogistics.com",
    phone: "+91-9333333333",
    address: "Sector 15, Vashi, Navi Mumbai",
    gst_number: "27CCCPL1234C1Z5",
    pan_number: "CCCPL1234C",
    category: ["Logistics", "Transport"],
    is_active: true,
    is_approved: true,
    rating: 4.8,
    total_orders: 22,
    on_time_delivery_rate: 97.5,
    created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "vendor-4",
    company_name: "Office Stationers",
    contact_person: "Meera Nair",
    email: "meera@officestationers.com",
    phone: "+91-9444444444",
    address: "Parihar Chowk, Aundh, Pune",
    gst_number: "27DDDPL1234C1Z5",
    pan_number: "DDDPL1234C",
    category: ["Office Equipment", "Stationery"],
    is_active: true,
    is_approved: false,
    rating: 0,
    total_orders: 0,
    on_time_delivery_rate: 0,
    created_at: "2026-05-20T00:00:00Z",
    notes: "Awaiting GST document verification.",
  },
];

export interface RFQItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
}

export interface RFQ {
  id: string;
  rfq_number: string;
  title: string;
  description: string;
  status: "draft" | "sent" | "closed" | "awarded" | "cancelled";
  deadline: string;
  delivery_location: string;
  items: RFQItem[];
  vendor_ids: string[];
  attachment_urls: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  cancel_reason?: string;
}

export const mockRFQs: RFQ[] = [
  {
    id: "rfq-1",
    rfq_number: "RFQ-2026-0001",
    title: "Steel Rods Q2 2026",
    description: "Need 500 units of 10mm steel rods for Pune Factory construction.",
    status: "sent",
    deadline: "2026-07-01T18:00:00Z",
    delivery_location: "Pune Factory",
    items: [
      {
        id: "rfq-item-1-1",
        product_name: "Steel Rod 10mm",
        description: "Grade A, Hot Rolled",
        quantity: 500,
        unit: "pieces",
        specifications: "IS:1786 Grade Fe 415",
      },
    ],
    vendor_ids: ["vendor-1", "vendor-2"],
    attachment_urls: ["https://cdn/spec.pdf"],
    notes: "Urgent requirement, structural usage.",
    created_by: "Jane Smith",
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "rfq-2",
    rfq_number: "RFQ-2026-0002",
    title: "Logistics Services West Zone",
    description: "Annual transport contract for western India distribution.",
    status: "draft",
    deadline: "2026-08-15T18:00:00Z",
    delivery_location: "All Zones (Western Region)",
    items: [
      {
        id: "rfq-item-2-1",
        product_name: "32ft Container Transport",
        description: "Flatbed or closed container shipping",
        quantity: 120,
        unit: "trips",
        specifications: "GPS tracker enabled, transit insurance included",
      },
    ],
    vendor_ids: ["vendor-3"],
    attachment_urls: [],
    created_by: "Jane Smith",
    created_at: "2026-06-05T12:00:00Z",
  },
];

export interface QuotationItem {
  id: string;
  rfq_item_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  unit: string;
  tax_percent: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  rfq_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_rating: number;
  items: QuotationItem[];
  total_amount: number;
  currency: string;
  delivery_timeline_days: number;
  delivery_terms: string;
  payment_terms: string;
  validity_days: number;
  notes?: string;
  attachment_urls: string[];
  pdf_url: string;
  status: "submitted" | "under_review" | "shortlisted" | "rejected" | "accepted";
  submitted_at: string;
}

export const mockQuotations: Quotation[] = [
  {
    id: "quote-1-1",
    quotation_number: "QT-2026-0001",
    rfq_id: "rfq-1",
    vendor_id: "vendor-1",
    vendor_name: "Steel Suppliers Ltd",
    vendor_rating: 4.5,
    items: [
      {
        id: "qi-1-1",
        rfq_item_id: "rfq-item-1-1",
        product_name: "Steel Rod 10mm",
        unit_price: 85.5,
        quantity: 500,
        unit: "pieces",
        tax_percent: 18,
        subtotal: 42750,
      },
    ],
    total_amount: 50445,
    currency: "INR",
    delivery_timeline_days: 14,
    delivery_terms: "Ex-Works Pune",
    payment_terms: "Net 30",
    validity_days: 30,
    notes: "Prices valid for 30 days. Stock readily available.",
    attachment_urls: ["https://cdn/quotation.pdf"],
    pdf_url: "https://cdn/generated/QT-2026-0001.pdf",
    status: "submitted",
    submitted_at: "2026-06-10T12:00:00Z",
  },
  {
    id: "quote-1-2",
    quotation_number: "QT-2026-0002",
    rfq_id: "rfq-1",
    vendor_id: "vendor-2",
    vendor_name: "Iron Works Co",
    vendor_rating: 3.8,
    items: [
      {
        id: "qi-1-2",
        rfq_item_id: "rfq-item-1-1",
        product_name: "Steel Rod 10mm",
        unit_price: 92.0,
        quantity: 500,
        unit: "pieces",
        tax_percent: 18,
        subtotal: 46000,
      },
    ],
    total_amount: 54280,
    currency: "INR",
    delivery_timeline_days: 10,
    delivery_terms: "FOB Mumbai",
    payment_terms: "Net 15",
    validity_days: 15,
    notes: "Fast delivery within 10 days.",
    attachment_urls: [],
    pdf_url: "https://cdn/generated/QT-2026-0002.pdf",
    status: "submitted",
    submitted_at: "2026-06-11T09:30:00Z",
  },
];

export interface Approval {
  approval_id: string;
  rfq_id: string;
  rfq_number: string;
  rfq_title: string;
  selected_vendor: string;
  quotation_id: string;
  quotation_amount: number;
  requested_by: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
}

export const mockApprovals: Approval[] = [
  {
    approval_id: "approval-1",
    rfq_id: "rfq-1",
    rfq_number: "RFQ-2026-0001",
    rfq_title: "Steel Rods Q2 2026",
    selected_vendor: "Steel Suppliers Ltd",
    quotation_id: "quote-1-1",
    quotation_amount: 50445,
    requested_by: "Jane Smith",
    requested_at: "2026-06-12T09:00:00Z",
    status: "pending",
  },
];

export interface PurchaseOrder {
  id: string;
  po_number: string;
  rfq_id: string;
  quotation_id: string;
  vendor_id: string;
  vendor_name: string;
  total_amount: number;
  currency: string;
  delivery_address: string;
  expected_delivery_date: string;
  payment_terms: string;
  special_instructions?: string;
  status: "generated" | "acknowledged" | "in_transit" | "delivered" | "cancelled";
  pdf_url: string;
  created_at: string;
  remarks?: string;
}

export const mockPOs: PurchaseOrder[] = [
  {
    id: "po-1",
    po_number: "PO-2026-0001",
    rfq_id: "rfq-1",
    quotation_id: "quote-1-1",
    vendor_id: "vendor-1",
    vendor_name: "Steel Suppliers Ltd",
    total_amount: 50445,
    currency: "INR",
    delivery_address: "Acme Corp, Plot 45, Pune - 411018",
    expected_delivery_date: "2026-07-15",
    payment_terms: "Net 30 days",
    special_instructions: "Deliver to Gate 2, contact Ravi (+91-9000000100)",
    status: "generated",
    pdf_url: "https://cdn/generated/PO-2026-0001.pdf",
    created_at: "2026-06-15T10:00:00Z",
  },
];

export interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_number_vendor: string;
  po_id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_total: number;
  grand_total: number;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  status: "pending" | "paid" | "overdue" | "disputed";
  pdf_url: string;
  payment_date?: string;
  payment_reference?: string;
  remarks?: string;
  notes?: string;
}

export const mockInvoices: Invoice[] = [];

export const mockActivityLogs = [
  {
    log_id: "log-1",
    entity_type: "rfq",
    entity_ref: "RFQ-2026-0001",
    action: "rfq_sent",
    description: "RFQ sent to 2 vendors",
    performed_by: "Jane Smith",
    role: "procurement_officer",
    timestamp: "2026-06-01T10:00:00Z",
  },
  {
    log_id: "log-2",
    entity_type: "quotation",
    entity_ref: "QT-2026-0001",
    action: "quotation_submitted",
    description: "Steel Suppliers Ltd submitted a bid of ₹50,445",
    performed_by: "Raj Kumar",
    role: "vendor",
    timestamp: "2026-06-10T12:00:00Z",
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "approval",
    title: "Approval Required",
    message: "RFQ-2026-0001 is awaiting your approval",
    is_read: false,
    created_at: "2026-06-12T09:00:00Z",
  },
];

export const mockReports = {
  spendTrend: {
    year: 2026,
    monthly_trend: [
      { month: "Jan", month_num: 1, total_spend: 320000, po_count: 3 },
      { month: "Feb", month_num: 2, total_spend: 480000, po_count: 5 },
      { month: "Mar", month_num: 3, total_spend: 210000, po_count: 2 },
      { month: "Apr", month_num: 4, total_spend: 780000, po_count: 8 },
      { month: "May", month_num: 5, total_spend: 920000, po_count: 9 },
      { month: "Jun", month_num: 6, total_spend: 1250000, po_count: 15 },
    ],
  },
  vendorPerformance: [
    {
      vendor_id: "vendor-1",
      vendor_name: "Steel Suppliers Ltd",
      total_rfqs_received: 20,
      quotations_submitted: 18,
      acceptance_rate: 66.7,
      on_time_delivery_rate: 91.6,
      total_value_awarded: 4200000,
      avg_rating: 4.5,
    },
    {
      vendor_id: "vendor-2",
      vendor_name: "Iron Works Co",
      total_rfqs_received: 15,
      quotations_submitted: 12,
      acceptance_rate: 40.0,
      on_time_delivery_rate: 85.0,
      total_value_awarded: 1500000,
      avg_rating: 3.8,
    },
  ],
};
