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
      tagline: "India's leading manufacturer of structural steel & alloy rods",
      contact_person: "Raj Kumar",
      email: "vendor@steelsuppliers.com",
      phone: "+91-9111111111",
      address: "Plot 12, MIDC, Pune",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      gst_number: "27AAAPL1234C1Z5",
      pan_number: "AAAPL1234C",
      category: ["Raw Materials", "Steel"],
      industry: "Metallurgy",
      is_active: true,
      is_approved: true,
      premium: true,
      rating: 4.8,
      rating_details: { delivery: 4.9, quality: 4.8, communication: 4.7, pricing: 4.6, documentation: 4.8 },
      total_orders: 12,
      on_time_delivery_rate: 96.5,
      response_rate: 98,
      rfqs_completed: 24,
      establishment_year: 2004,
      team_size: "100-250 employees",
      website: "https://steelsuppliers.com",
      about: "Steel Suppliers Ltd has been a pioneer in structural steel manufacturing for over two decades. We supply high-tensile steel rods, sheets, and structural columns to top infrastructure and manufacturing firms across India. Our state-of-the-art facility in Pune ensures ISO-certified quality controls and precise metallurgical engineering.",
      logo_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80",
      banner_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
      top_products: ["TMT Rebars", "Steel Round Bars", "Mild Steel Plates"],
      created_at: "2026-01-15T00:00:00Z",
    },
    {
      id: "vendor-002",
      company_name: "Iron Works Co",
      tagline: "High precision casting & iron forging since 2010",
      contact_person: "Amit Shah",
      email: "amit@ironworks.com",
      phone: "+91-9222222222",
      address: "Sector 5, Industrial Area, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      gst_number: "27BBBBB5678D1Z9",
      pan_number: "BBBBB5678D",
      category: ["Steel", "Iron", "Hardware"],
      industry: "Manufacturing",
      is_active: true,
      is_approved: true,
      premium: false,
      rating: 4.2,
      rating_details: { delivery: 4.1, quality: 4.3, communication: 4.0, pricing: 4.5, documentation: 4.2 },
      total_orders: 8,
      on_time_delivery_rate: 85.0,
      response_rate: 90,
      rfqs_completed: 15,
      establishment_year: 2010,
      team_size: "50-100 employees",
      website: "https://ironworks.co.in",
      about: "Iron Works Co specializes in heavy industrial iron forging, sand castings, and sheet metal fabrications. Serving the automotive, agriculture, and construction sectors, we deliver durable hardware, flanges, and customized molds matching strict IS specifications.",
      logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80",
      banner_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      top_products: ["Forged Flanges", "Cast Iron Pipes", "Custom Molds"],
      created_at: "2026-02-01T00:00:00Z",
    },
    {
      id: "vendor-003",
      company_name: "Precision Metals",
      tagline: "Ultra-precision alloy components and CNC machining",
      contact_person: "Priya Desai",
      email: "priya@precision.com",
      phone: "+91-9333333333",
      address: "GIDC, Ahmedabad",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      gst_number: "24CCCCC9012E1Z3",
      pan_number: "CCCCC9012E",
      category: ["Raw Materials", "Electronics"],
      industry: "Electronics",
      is_active: true,
      is_approved: false,
      premium: true,
      rating: 4.6,
      rating_details: { delivery: 4.5, quality: 4.7, communication: 4.6, pricing: 4.2, documentation: 4.8 },
      total_orders: 4,
      on_time_delivery_rate: 92.0,
      response_rate: 95,
      rfqs_completed: 6,
      establishment_year: 2018,
      team_size: "10-50 employees",
      website: "https://precisionmetals.in",
      about: "Precision Metals manufactures high-tolerance copper, brass, and aluminum machined components for aerospace, defense, and electronics companies. With advanced Japanese CNC machine lines, we achieve tolerances down to 5 microns.",
      logo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80",
      banner_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
      top_products: ["CNC Machined Screws", "Copper Contacts", "Aluminum Spacers"],
      created_at: "2026-05-20T00:00:00Z",
    },
  ],
  vendorProducts: [
    { id: "vp-1", vendor_id: "vendor-001", name: "High-Tensile TMT Rebar Fe 550D", category: "Raw Materials", moq: "5 Metric Tons", price_range: "₹52,000 - ₹55,000 per Ton", availability: "In Stock", images: ["https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=80"], description: "Premium grade thermo-mechanically treated steel reinforcement bars, ideal for heavy load structures and seismic zones." },
    { id: "vp-2", vendor_id: "vendor-001", name: "Mild Steel Round Bar 12mm", category: "Steel", moq: "1,000 kg", price_range: "₹62 - ₹68 per kg", availability: "In Stock", images: ["https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=300&auto=format&fit=crop&q=80"], description: "Highly versatile mild steel round bars with superior surface finish, suitable for machining, forging, and structural framing." },
    { id: "vp-3", vendor_id: "vendor-002", name: "Forged Steel Slip-On Flange", category: "Hardware", moq: "50 Units", price_range: "₹1,200 - ₹1,800 per Unit", availability: "2 Weeks Lead Time", images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80"], description: "Heavy duty slip-on pipe flange manufactured via precision closed-die forging conforming to ASME B16.5 specifications." },
    { id: "vp-4", vendor_id: "vendor-003", name: "Gold-Plated Brass PCB Terminal Pins", category: "Electronics", moq: "10,000 Pcs", price_range: "₹1.80 - ₹2.50 per Piece", availability: "In Stock", images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80"], description: "CNC-machined brass contact pins with 3u-inch gold electroplating for excellent conductivity and corrosion resistance." }
  ],
  vendorLinks: [
    { id: "vl-1", vendor_id: "vendor-001", platform: "linkedin", url: "https://linkedin.com/company/steel-suppliers-ltd" },
    { id: "vl-2", vendor_id: "vendor-001", platform: "indiamart", url: "https://indiamart.com/steelsupplierpune" },
    { id: "vl-3", vendor_id: "vendor-001", platform: "website", url: "https://steelsuppliers.com" },
    { id: "vl-4", vendor_id: "vendor-002", platform: "facebook", url: "https://facebook.com/ironworksco" },
    { id: "vl-5", vendor_id: "vendor-002", platform: "website", url: "https://ironworks.co.in" },
    { id: "vl-6", vendor_id: "vendor-003", platform: "linkedin", url: "https://linkedin.com/company/precisionmetals-ahmedabad" }
  ],
  vendorAssignments: [
    { id: "va-1", vendor_id: "vendor-001", employee_id: "user-procurement_officer", employee_name: "Jane Procurement", department: "Procurement", status: "active", date_assigned: "2026-06-01" },
    { id: "va-2", vendor_id: "vendor-002", employee_id: "user-procurement_officer", employee_name: "Jane Procurement", department: "Procurement", status: "negotiation", date_assigned: "2026-06-02" },
    { id: "va-3", vendor_id: "vendor-003", employee_id: "user-admin", employee_name: "John Admin", department: "Management", status: "assigned", date_assigned: "2026-06-03" }
  ],
  vendorTimeline: [
    { id: "vt-1", vendor_id: "vendor-001", type: "rfq_sent", title: "RFQ Created", performer: "Jane Procurement", notes: "Sent RFQ-2026-0001 for Steel Rods to vendor", timestamp: "2026-06-01T10:00:00Z" },
    { id: "vt-2", vendor_id: "vendor-001", type: "quotation_submitted", title: "Quotation Submitted", performer: "Raj Kumar", notes: "Submitted Quotation QT-2026-0001 with total ₹50,445", timestamp: "2026-06-11T15:00:00Z" },
    { id: "vt-3", vendor_id: "vendor-001", type: "approval_completed", title: "Quotation Approved", performer: "Finance Manager", notes: "Shortlisted quotation approved by Manager approval appr-002", timestamp: "2026-06-12T09:00:00Z" },
    { id: "vt-4", vendor_id: "vendor-001", type: "po_generated", title: "Purchase Order Issued", performer: "Jane Procurement", notes: "Generated PO-2026-0001 under contract terms", timestamp: "2026-06-15T10:00:00Z" },
    { id: "vt-5", vendor_id: "vendor-002", type: "rfq_sent", title: "RFQ Created", performer: "Jane Procurement", notes: "Sent RFQ-2026-0001 for Steel Rods to vendor", timestamp: "2026-06-01T10:00:00Z" }
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
  categories: ["Raw Materials", "Steel", "Iron", "Hardware", "Electronics", "Office Supplies"],
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
