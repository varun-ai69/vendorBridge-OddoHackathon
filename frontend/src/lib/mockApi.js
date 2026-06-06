import {
  getStore,
  saveStore,
  findTestUserByCredentials,
  testUserToAuthUser,
} from "./mockStore";

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("vb_user"));
  } catch {
    return null;
  }
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}

function matchEndpoint(endpoint, pattern) {
  const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, "([^/]+)") + "$");
  const m = endpoint.match(regex);
  if (!m) return null;
  const keys = (pattern.match(/:[^/]+/g) || []).map((k) => k.slice(1));
  const params = {};
  keys.forEach((k, i) => { params[k] = m[i + 1]; });
  return params;
}

export async function mockRequest(endpoint, options = {}) {
  const { method = "GET", body, params } = options;
  const store = getStore();
  const parsed = parseBody(body);
  const user = getStoredUser();

  await delay(200);

  // ─── Auth ───────────────────────────────────────────────────────────────
  if (endpoint === "/auth/login" && method === "POST") {
    const match = findTestUserByCredentials(parsed.email, parsed.password);
    if (!match) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }
    return {
      success: true,
      token: "mock-jwt-token",
      refresh_token: "mock-refresh-token",
      user: testUserToAuthUser(match),
    };
  }

  if (endpoint === "/auth/register-org" && method === "POST") {
    return { success: true, message: "Organization registered", org_id: "org-new", admin_id: "user-new" };
  }

  if (endpoint === "/auth/logout" && method === "POST") {
    return { success: true, message: "Logged out" };
  }

  if (endpoint === "/auth/forgot-password" && method === "POST") {
    return { success: true, message: "Password reset link sent" };
  }

  if (endpoint === "/auth/me" && method === "GET") {
    if (!user) { const e = new Error("Unauthorized"); e.status = 401; throw e; }
    return user;
  }

  if (endpoint === "/auth/me" && method === "PUT") {
    return { ...user, ...parsed };
  }

  if (endpoint === "/auth/change-password" && method === "PUT") {
    return { success: true, message: "Password changed" };
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────
  if (endpoint === "/dashboard/admin" && method === "GET") {
    return {
      total_users: store.users.length,
      total_vendors: store.vendors.length,
      active_rfqs: store.rfqs.filter((r) => r.status === "sent").length,
      pending_approvals: store.approvals.filter((a) => a.status === "pending").length,
      total_pos_this_month: store.pos.length,
      total_spend_this_month: 1250000,
      total_invoices_pending: store.invoices.filter((i) => i.status === "pending").length,
      recent_rfqs: store.rfqs.slice(0, 3),
      spend_by_category: [
        { category: "Raw Materials", amount: 750000 },
        { category: "Electronics", amount: 350000 },
        { category: "Services", amount: 150000 },
      ],
    };
  }

  if (endpoint === "/dashboard/procurement" && method === "GET") {
    return {
      my_active_rfqs: 3,
      my_pending_approvals: 1,
      my_pos_this_month: 2,
      quotations_received_today: 1,
      recent_rfqs: store.rfqs.slice(0, 3),
      recent_pos: store.pos.slice(0, 2),
    };
  }

  if (endpoint === "/dashboard/manager" && method === "GET") {
    return {
      pending_approvals: store.approvals.filter((a) => a.status === "pending").length,
      approved_this_month: 5,
      rejected_this_month: 1,
      total_spend_approved: 3250000,
      approval_trend: [
        { month: "Jan", approved: 4, rejected: 0 },
        { month: "Feb", approved: 6, rejected: 1 },
        { month: "Mar", approved: 5, rejected: 0 },
        { month: "Apr", approved: 8, rejected: 1 },
        { month: "May", approved: 7, rejected: 0 },
        { month: "Jun", approved: 5, rejected: 1 },
      ],
    };
  }

  if (endpoint === "/dashboard/vendor" && method === "GET") {
    return {
      active_rfqs_received: store.vendorRfqs.filter((r) => r.status === "pending").length,
      quotations_submitted: store.vendorQuotations.length,
      quotations_accepted: 1,
      active_pos: store.pos.filter((p) => ["generated", "acknowledged", "in_transit"].includes(p.status)).length,
      pending_invoices: 1,
      total_revenue_this_month: 250000,
      monthly_revenue: [
        { month: "Jan", revenue: 180000 },
        { month: "Feb", revenue: 220000 },
        { month: "Mar", revenue: 195000 },
        { month: "Apr", revenue: 310000 },
        { month: "May", revenue: 275000 },
        { month: "Jun", revenue: 250000 },
      ],
    };
  }

  // ─── Users ──────────────────────────────────────────────────────────────
  if (endpoint === "/admin/users" && method === "GET") {
    return { users: store.users, total: store.users.length, page: 1, limit: 50 };
  }

  if (endpoint === "/admin/users/invite" && method === "POST") {
    const newUser = {
      id: `user-${Date.now()}`,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    store.users.push(newUser);

    if (parsed.role === "vendor") {
      const newVendorId = `vendor-${Date.now()}`;
      const newVendor = {
        id: newVendorId,
        company_name: parsed.company_name || "New Partner Vendor",
        tagline: "Quality supplier partner.",
        contact_person: parsed.name,
        email: parsed.email,
        phone: parsed.phone || "",
        address: "Industrial Area",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        gst_number: "",
        pan_number: "",
        category: ["General"],
        industry: "Manufacturing",
        is_active: true,
        is_approved: true,
        premium: false,
        rating: 4.0,
        rating_details: { delivery: 4.0, quality: 4.0, communication: 4.0, pricing: 4.0, documentation: 4.0 },
        total_orders: 0,
        on_time_delivery_rate: 100,
        response_rate: 100,
        rfqs_completed: 0,
        establishment_year: new Date().getFullYear(),
        team_size: "10-50 employees",
        website: "",
        about: "We are an approved vendor partner registered directly by the Organization Administrator.",
        logo_url: "",
        banner_url: "",
        top_products: [],
        created_at: new Date().toISOString(),
      };
      store.vendors.push(newVendor);
    }

    saveStore();
    return { success: true, message: "User invited", user_id: newUser.id };
  }

  if (endpoint.match(/^\/admin\/users\/[^/]+\/status$/) && method === "PATCH") {
    const id = endpoint.split("/")[3];
    const u = store.users.find((x) => x.id === id);
    if (u) { u.is_active = parsed.is_active; saveStore(); }
    return { success: true };
  }

  // ─── Vendors ────────────────────────────────────────────────────────────
  if (endpoint === "/admin/vendors" && method === "GET") {
    let list = [...store.vendors];
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((v) => v.company_name.toLowerCase().includes(s) || v.email.toLowerCase().includes(s));
    }
    return { vendors: list, total: list.length };
  }

  if (endpoint === "/admin/vendors" && method === "POST") {
    const v = { 
      id: `vendor-${Date.now()}`, 
      ...parsed, 
      is_active: true, 
      is_approved: true, 
      rating: 4.0, 
      rating_details: { delivery: 4.0, quality: 4.0, communication: 4.0, pricing: 4.0, documentation: 4.0 },
      created_at: new Date().toISOString() 
    };
    store.vendors.push(v);

    // Auto-create user login
    const newUser = {
      id: `user-${Date.now()}`,
      name: parsed.contact_person || parsed.company_name,
      email: parsed.email,
      role: "vendor",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    store.users.push(newUser);

    saveStore();
    return { success: true, vendor_id: v.id, message: "Vendor created" };
  }

  if (endpoint.match(/^\/admin\/vendors\/[^/]+\/status$/) && method === "PATCH") {
    const id = endpoint.split("/")[3];
    const v = store.vendors.find((x) => x.id === id);
    if (v) { Object.assign(v, parsed); saveStore(); }
    return { success: true };
  }

  // ─── Vendor Directory & Assignments ─────────────────────────────────────────
  if (endpoint === "/vendors" && method === "GET") {
    let list = [...store.vendors];
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((v) => v.company_name.toLowerCase().includes(s) || (v.tagline && v.tagline.toLowerCase().includes(s)));
    }
    if (params?.category) {
      list = list.filter((v) => v.category.includes(params.category));
    }
    if (params?.industry) {
      list = list.filter((v) => v.industry === params.industry);
    }
    if (params?.city) {
      list = list.filter((v) => v.city?.toLowerCase() === params.city.toLowerCase());
    }
    if (params?.rating) {
      list = list.filter((v) => v.rating >= parseFloat(params.rating));
    }
    if (params?.gst_verified === "true") {
      list = list.filter((v) => !!v.gst_number);
    }
    if (params?.premium === "true") {
      list = list.filter((v) => !!v.premium);
    }
    return { vendors: list, total: list.length };
  }

  if (endpoint.match(/^\/vendors\/[^/]+$/) && method === "GET") {
    const id = endpoint.split("/")[2];
    const vendor = store.vendors.find((v) => v.id === id);
    if (!vendor) {
      const err = new Error("Vendor not found");
      err.status = 404;
      throw err;
    }
    const products = store.vendorProducts.filter((p) => p.vendor_id === id);
    const links = store.vendorLinks.filter((l) => l.vendor_id === id);
    const timeline = store.vendorTimeline.filter((t) => t.vendor_id === id);
    const analytics = {
      rating_details: vendor.rating_details || { delivery: 4.0, quality: 4.0, communication: 4.0, pricing: 4.0, documentation: 4.0 },
      on_time_delivery_rate: vendor.on_time_delivery_rate || 90,
      response_rate: vendor.response_rate || 90,
      rfqs_completed: vendor.rfqs_completed || 10,
      monthly_performance: [
        { month: "Jan", score: 4.2 },
        { month: "Feb", score: 4.4 },
        { month: "Mar", score: 4.3 },
        { month: "Apr", score: 4.6 },
        { month: "May", score: 4.5 },
        { month: "Jun", score: vendor.rating || 4.5 },
      ]
    };
    return { vendor, products, links, analytics, timeline };
  }

  if (endpoint.match(/^\/vendors\/[^/]+$/) && method === "PUT") {
    const id = endpoint.split("/")[2];
    const vendor = store.vendors.find((v) => v.id === id);
    if (vendor) {
      Object.assign(vendor, parsed);
      saveStore();
      return { success: true, vendor };
    }
    const err = new Error("Vendor not found");
    err.status = 404;
    throw err;
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/products$/) && method === "GET") {
    const id = endpoint.split("/")[2];
    const products = store.vendorProducts.filter((p) => p.vendor_id === id);
    return { products };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/products$/) && method === "POST") {
    const id = endpoint.split("/")[2];
    const newProduct = {
      id: `vp-${Date.now()}`,
      vendor_id: id,
      name: parsed.name,
      category: parsed.category || "General",
      moq: parsed.moq || "1 Unit",
      price_range: parsed.price_range || "Contact for Price",
      availability: "In Stock",
      images: [parsed.image || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=80"],
      description: parsed.description || "",
    };
    store.vendorProducts.push(newProduct);
    saveStore();
    return { success: true, product: newProduct };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/products\/[^/]+$/) && method === "DELETE") {
    const parts = endpoint.split("/");
    const productId = parts[4];
    store.vendorProducts = store.vendorProducts.filter((p) => p.id !== productId);
    saveStore();
    return { success: true };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/media$/) && method === "POST") {
    return { success: true, file_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80" };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/links$/) && method === "GET") {
    const id = endpoint.split("/")[2];
    const links = store.vendorLinks.filter((l) => l.vendor_id === id);
    return { links };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/links$/) && method === "POST") {
    const id = endpoint.split("/")[2];
    const newLink = { id: `vl-${Date.now()}`, vendor_id: id, platform: parsed.platform, url: parsed.url };
    store.vendorLinks.push(newLink);
    saveStore();
    return { success: true, link: newLink };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/links\/[^/]+$/) && method === "PUT") {
    const parts = endpoint.split("/");
    const linkId = parts[4];
    const link = store.vendorLinks.find((l) => l.id === linkId);
    if (link) {
      link.url = parsed.url;
      link.platform = parsed.platform;
      saveStore();
    }
    return { success: true, link };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/links\/[^/]+$/) && method === "DELETE") {
    const parts = endpoint.split("/");
    const linkId = parts[4];
    store.vendorLinks = store.vendorLinks.filter((l) => l.id !== linkId);
    saveStore();
    return { success: true };
  }

  if (endpoint === "/vendor-assignments" && method === "POST") {
    const u = store.users.find((x) => x.id === parsed.employeeId);
    const newAssignment = {
      id: `va-${Date.now()}`,
      vendor_id: parsed.vendorId,
      employee_id: parsed.employeeId,
      employee_name: u ? u.name : "Employee",
      department: parsed.departmentId || (u ? u.department || "Procurement" : "Procurement"),
      status: parsed.status || "assigned",
      date_assigned: new Date().toISOString().split("T")[0]
    };
    // Update existing or add new
    store.vendorAssignments = store.vendorAssignments.filter((a) => a.vendor_id !== parsed.vendorId);
    store.vendorAssignments.push(newAssignment);
    saveStore();
    return { success: true, assignment: newAssignment };
  }

  if (endpoint.match(/^\/employees\/[^/]+\/vendors$/) && method === "GET") {
    const empId = endpoint.split("/")[2];
    const assignments = store.vendorAssignments.filter((a) => a.employee_id === empId);
    const list = assignments.map((a) => {
      const v = store.vendors.find((vendor) => vendor.id === a.vendor_id);
      if (v) return { ...v, assignment: a };
      return null;
    }).filter(Boolean);
    return { vendors: list };
  }

  if (endpoint.match(/^\/rfqs\/[^/]+\/vendors$/) && method === "POST") {
    const rfqId = endpoint.split("/")[2];
    const rfq = store.rfqs.find((r) => r.id === rfqId || r.rfq_id === rfqId);
    if (rfq) {
      const vendorIds = parsed.vendorIds || [];
      vendorIds.forEach((vid) => {
        const exists = rfq.vendors?.find((v) => v.id === vid);
        if (!exists) {
          const v = store.vendors.find((vend) => vend.id === vid);
          if (v) {
            rfq.vendors = rfq.vendors || [];
            rfq.vendors.push({ id: v.id, company_name: v.company_name });
          }
        }
      });
      rfq.vendor_count = rfq.vendors?.length || 0;
      saveStore();
    }
    return { success: true, message: "Vendors assigned to RFQ" };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/analytics$/) && method === "GET") {
    const id = endpoint.split("/")[2];
    const vendor = store.vendors.find((v) => v.id === id);
    return {
      rating_details: vendor?.rating_details || { delivery: 4.0, quality: 4.0, communication: 4.0, pricing: 4.0, documentation: 4.0 },
      on_time_delivery_rate: vendor?.on_time_delivery_rate || 90,
      response_rate: vendor?.response_rate || 90,
      rfqs_completed: vendor?.rfqs_completed || 10,
    };
  }

  if (endpoint.match(/^\/vendors\/[^/]+\/timeline$/) && method === "GET") {
    const id = endpoint.split("/")[2];
    const timeline = store.vendorTimeline.filter((t) => t.vendor_id === id);
    return { timeline };
  }

  // ─── Categories ─────────────────────────────────────────────────────────────
  if (endpoint === "/categories" && method === "GET") {
    return { categories: store.categories || [] };
  }

  if (endpoint === "/categories" && method === "POST") {
    const name = parsed.name?.trim();
    if (name && !store.categories.includes(name)) {
      store.categories.push(name);
      saveStore();
    }
    return { success: true, categories: store.categories };
  }

  if (endpoint.match(/^\/categories\/[^/]+$/) && method === "DELETE") {
    const name = decodeURIComponent(endpoint.split("/")[2]);
    store.categories = (store.categories || []).filter((c) => c !== name);
    saveStore();
    return { success: true, categories: store.categories };
  }

  if (endpoint === "/vendor/profile" && method === "GET") {
    const profile = store.vendors.find(v => v.email === user?.email) || store.vendors[0];
    return profile;
  }
 
  if (endpoint === "/vendor/profile" && method === "PUT") {
    const idx = store.vendors.findIndex(v => v.email === user?.email);
    if (idx !== -1) {
      Object.assign(store.vendors[idx], parsed);
      saveStore();
      return store.vendors[idx];
    } else {
      Object.assign(store.vendors[0], parsed);
      saveStore();
      return store.vendors[0];
    }
  }

  // ─── RFQ ────────────────────────────────────────────────────────────────
  if (endpoint === "/rfq" && method === "GET") {
    let list = [...store.rfqs];
    if (params?.status) list = list.filter((r) => r.status === params.status);
    return { rfqs: list, total: list.length };
  }

  if (endpoint === "/rfq" && method === "POST") {
    const rfq = {
      id: `rfq-${Date.now()}`,
      rfq_id: `rfq-${Date.now()}`,
      rfq_number: `RFQ-2026-${String(store.rfqs.length + 1).padStart(4, "0")}`,
      title: parsed.title,
      description: parsed.description,
      status: "sent",
      deadline: parsed.deadline,
      delivery_location: parsed.delivery_location,
      vendor_count: parsed.vendor_ids?.length || 0,
      quotation_count: 0,
      created_at: new Date().toISOString(),
      items: parsed.items,
    };
    store.rfqs.unshift(rfq);
    saveStore();
    return { success: true, rfq_id: rfq.id, rfq_number: rfq.rfq_number, status: "sent", message: "RFQ sent" };
  }

  if (endpoint.match(/^\/rfq\/[^/]+$/) && method === "GET" && !endpoint.includes("quotations") && !endpoint.includes("approval")) {
    const id = endpoint.split("/")[2];
    const rfq = store.rfqs.find((r) => r.id === id || r.rfq_id === id);
    if (!rfq) { const e = new Error("RFQ not found"); e.status = 404; throw e; }
    return rfq;
  }

  if (endpoint.match(/^\/rfq\/[^/]+\/quotations\/compare$/) && method === "GET") {
    const id = endpoint.split("/")[2];
    const rfq = store.rfqs.find((r) => r.id === id);
    return {
      rfq_id: id,
      rfq_number: rfq?.rfq_number || "RFQ-2026-0001",
      items_comparison: [
        {
          product_name: "Steel Rod 10mm",
          quantity: 500,
          vendors: [
            { vendor_name: "Steel Suppliers Ltd", quotation_id: "qt-001", unit_price: 85.5, total: 50445, delivery_days: 14, is_lowest_price: true },
            { vendor_name: "Iron Works Co", quotation_id: "qt-002", unit_price: 92, total: 54280, delivery_days: 10, is_lowest_price: false },
          ],
        },
      ],
      summary: {
        lowest_price_vendor_id: "vendor-001",
        lowest_price_vendor_name: "Steel Suppliers Ltd",
        fastest_delivery_vendor_id: "vendor-002",
        fastest_delivery_vendor_name: "Iron Works Co",
      },
    };
  }

  if (endpoint.match(/^\/rfq\/[^/]+\/quotations\/[^/]+\/select$/) && method === "PATCH") {
    const approval = {
      approval_id: `appr-${Date.now()}`,
      rfq_number: "RFQ-2026-0001",
      rfq_title: "Steel Rods Q2 2026",
      selected_vendor: "Steel Suppliers Ltd",
      quotation_amount: 50445,
      requested_by: "Jane Procurement",
      requested_at: new Date().toISOString(),
      status: "pending",
    };
    store.approvals.unshift(approval);
    saveStore();
    return { success: true, message: "Quotation shortlisted", approval_request_id: approval.approval_id };
  }

  // ─── Vendor RFQs ──────────────────────────────────────────────────────
  if (endpoint === "/vendor/rfqs" && method === "GET") {
    return { rfqs: store.vendorRfqs, total: store.vendorRfqs.length };
  }

  if (endpoint.match(/^\/vendor\/rfqs\/[^/]+$/) && method === "GET") {
    const id = endpoint.split("/")[3];
    return store.vendorRfqs.find((r) => r.id === id) || store.vendorRfqs[0];
  }

  if (endpoint.match(/^\/vendor\/rfqs\/[^/]+\/quotation$/) && method === "POST") {
    const qt = {
      quotation_id: `qt-${Date.now()}`,
      quotation_number: `QT-2026-${String(store.vendorQuotations.length + 1).padStart(4, "0")}`,
      rfq_number: "RFQ-2026-0001",
      total_amount: parsed.total_amount,
      status: "submitted",
      created_at: new Date().toISOString(),
    };
    store.vendorQuotations.unshift(qt);
    const rfq = store.vendorRfqs[0];
    if (rfq) rfq.has_quotation = true;
    saveStore();
    return { success: true, quotation_id: qt.quotation_id, quotation_number: qt.quotation_number, message: "Quotation submitted" };
  }

  if (endpoint === "/vendor/quotations" && method === "GET") {
    return { quotations: store.vendorQuotations };
  }

  // ─── Approvals ──────────────────────────────────────────────────────────
  if (endpoint === "/approvals" && method === "GET") {
    let list = [...store.approvals];
    if (params?.status) list = list.filter((a) => a.status === params.status);
    return { approvals: list };
  }

  if (endpoint.match(/^\/approvals\/[^/]+\/action$/) && method === "PATCH") {
    const id = endpoint.split("/")[2];
    const a = store.approvals.find((x) => x.approval_id === id);
    if (a) {
      a.status = parsed.action === "approved" ? "approved" : "rejected";
      a.remarks = parsed.remarks;
      if (parsed.action === "approved") {
        store.pos.unshift({
          po_id: `po-${Date.now()}`,
          id: `po-${Date.now()}`,
          po_number: `PO-2026-${String(store.pos.length + 1).padStart(4, "0")}`,
          vendor_name: a.selected_vendor,
          total_amount: a.quotation_amount,
          status: "generated",
          expected_delivery_date: "2026-08-01",
          created_at: new Date().toISOString(),
        });
      }
      saveStore();
    }
    return { success: true, action: parsed.action, message: `Procurement ${parsed.action}` };
  }

  // ─── PO ─────────────────────────────────────────────────────────────────
  if (endpoint === "/po" && method === "GET") {
    return { purchase_orders: store.pos, pos: store.pos };
  }

  if (endpoint === "/vendor/po" && method === "GET") {
    return { purchase_orders: store.pos, pos: store.pos };
  }

  if (endpoint.match(/^\/po\/[^/]+\/status$/) && method === "PATCH") {
    const id = endpoint.split("/")[2];
    const p = store.pos.find((x) => x.po_id === id || x.id === id);
    if (p) { p.status = parsed.status; saveStore(); }
    return { success: true };
  }

  // ─── Invoices ───────────────────────────────────────────────────────────
  if (endpoint === "/invoices" && method === "GET") {
    return { invoices: store.invoices };
  }

  if (endpoint === "/vendor/invoices" && method === "GET") {
    return { invoices: store.invoices };
  }

  if (endpoint.match(/^\/invoices\/[^/]+\/status$/) && method === "PATCH") {
    const id = endpoint.split("/")[2];
    const inv = store.invoices.find((x) => x.invoice_id === id || x.id === id);
    if (inv) { Object.assign(inv, parsed); saveStore(); }
    return { success: true };
  }

  // ─── Notifications ──────────────────────────────────────────────────────
  if (endpoint === "/notifications" && method === "GET") {
    return { notifications: store.notifications, unread_count: store.notifications.filter((n) => !n.is_read).length };
  }

  if (endpoint === "/notifications/unread-count" && method === "GET") {
    return { unread_count: store.notifications.filter((n) => !n.is_read).length };
  }

  if (endpoint.match(/^\/notifications\/[^/]+\/read$/) && method === "PATCH") {
    const id = endpoint.split("/")[2];
    const n = store.notifications.find((x) => x.id === id);
    if (n) { n.is_read = true; saveStore(); }
    return { success: true };
  }

  if (endpoint === "/notifications/read-all" && method === "PATCH") {
    store.notifications.forEach((n) => { n.is_read = true; });
    saveStore();
    return { success: true };
  }

  // ─── Activity Logs ──────────────────────────────────────────────────────
  if (endpoint === "/activity-logs" && method === "GET") {
    return { logs: store.activityLogs };
  }

  // ─── Reports ────────────────────────────────────────────────────────────
  if (endpoint === "/reports/procurement-summary" && method === "GET") {
    return {
      period: { from: "2026-01-01", to: "2026-12-31" },
      total_rfqs_created: store.rfqs.length,
      total_quotations_received: 8,
      total_pos_generated: store.pos.length,
      total_spend: 12500000,
      avg_quotation_response_time_days: 4.2,
      avg_approval_time_hours: 18.5,
      top_vendors: store.vendors.slice(0, 3).map((v) => ({
        vendor_name: v.company_name,
        total_orders: v.total_orders || 5,
        total_value: 420000,
      })),
    };
  }

  if (endpoint === "/reports/spend-trend" && method === "GET") {
    return {
      year: 2026,
      monthly_trend: [
        { month: "January", month_num: 1, total_spend: 1200000, po_count: 8 },
        { month: "February", month_num: 2, total_spend: 980000, po_count: 6 },
        { month: "March", month_num: 3, total_spend: 1450000, po_count: 10 },
        { month: "April", month_num: 4, total_spend: 1100000, po_count: 7 },
        { month: "May", month_num: 5, total_spend: 1350000, po_count: 9 },
        { month: "June", month_num: 6, total_spend: 1250000, po_count: 8 },
      ],
    };
  }

  if (endpoint === "/reports/vendor-performance" && method === "GET") {
    return {
      vendors: store.vendors.map((v) => ({
        vendor_name: v.company_name,
        total_rfqs_received: 10,
        quotations_submitted: 8,
        acceptance_rate: 66.7,
        on_time_delivery_rate: v.on_time_delivery_rate || 90,
        total_value_awarded: 420000,
        avg_rating: v.rating,
      })),
    };
  }

  // Default success for unhandled mutations
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return { success: true, message: "OK (demo mode)" };
  }

  return {};
}

export const IS_MOCK_MODE =
  process.env.NEXT_PUBLIC_MOCK_API !== "false";
