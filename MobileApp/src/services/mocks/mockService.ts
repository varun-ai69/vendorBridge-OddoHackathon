import { mockUsers, mockDashboards, mockVendors, mockRFQs, mockQuotations, mockApprovals, mockPOs, mockInvoices, mockActivityLogs, mockNotifications, mockReports, Vendor, RFQ, Quotation, PurchaseOrder, Invoice, Approval } from "./mockData";
import { UserProfile, UserRole } from "../../store/authStore";
import { NotificationItem } from "../../store/notifStore";

const DELAY_MS = 600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockService = {
  // 1. Auth & Profile
  login: async (email: string): Promise<{ token: string; refresh_token: string; user: UserProfile }> => {
    await sleep(DELAY_MS);
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error("Invalid email or password");
    }
    return {
      token: `mock-jwt-token-for-${user.role}`,
      refresh_token: `mock-refresh-token-for-${user.role}`,
      user,
    };
  },

  getMe: async (token: string): Promise<UserProfile> => {
    await sleep(DELAY_MS);
    const role = token.replace("mock-jwt-token-for-", "");
    const user = mockUsers.find((u) => u.role === role);
    if (!user) {
      throw new Error("Invalid or expired token");
    }
    return user;
  },

  // 2. Dashboards
  getDashboard: async (role: UserRole) => {
    await sleep(DELAY_MS);
    if (role === "procurement_officer") return mockDashboards.procurement;
    if (role === "manager") return mockDashboards.manager;
    if (role === "vendor") return mockDashboards.vendor;
    return mockDashboards.admin;
  },

  // 3. Vendors
  getVendors: async (): Promise<Vendor[]> => {
    await sleep(DELAY_MS);
    return mockVendors;
  },

  getVendorDetail: async (id: string): Promise<Vendor> => {
    await sleep(DELAY_MS);
    const vendor = mockVendors.find((v) => v.id === id);
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
  },

  createVendor: async (vendorData: Partial<Vendor>): Promise<Vendor> => {
    await sleep(DELAY_MS);
    const newVendor: Vendor = {
      id: `vendor-${mockVendors.length + 1}`,
      company_name: vendorData.company_name || "New Vendor",
      contact_person: vendorData.contact_person || "",
      email: vendorData.email || "",
      phone: vendorData.phone || "",
      address: vendorData.address || "",
      gst_number: vendorData.gst_number || "",
      pan_number: vendorData.pan_number || "",
      category: vendorData.category || [],
      is_active: true,
      is_approved: false,
      rating: 0,
      total_orders: 0,
      on_time_delivery_rate: 0,
      created_at: new Date().toISOString(),
      notes: vendorData.notes,
    };
    mockVendors.push(newVendor);
    return newVendor;
  },

  updateVendorStatus: async (id: string, is_approved: boolean, is_active: boolean): Promise<Vendor> => {
    await sleep(DELAY_MS);
    const vendor = mockVendors.find((v) => v.id === id);
    if (!vendor) throw new Error("Vendor not found");
    vendor.is_approved = is_approved;
    vendor.is_active = is_active;
    return vendor;
  },

  // 4. RFQ
  getRFQs: async (): Promise<RFQ[]> => {
    await sleep(DELAY_MS);
    return mockRFQs;
  },

  getRFQDetail: async (id: string): Promise<RFQ> => {
    await sleep(DELAY_MS);
    const rfq = mockRFQs.find((r) => r.id === id);
    if (!rfq) throw new Error("RFQ not found");
    return rfq;
  },

  createRFQ: async (rfqData: Partial<RFQ>): Promise<RFQ> => {
    await sleep(DELAY_MS);
    const newRFQ: RFQ = {
      id: `rfq-${mockRFQs.length + 1}`,
      rfq_number: `RFQ-2026-000${mockRFQs.length + 1}`,
      title: rfqData.title || "Untitled RFQ",
      description: rfqData.description || "",
      status: "sent",
      deadline: rfqData.deadline || new Date().toISOString(),
      delivery_location: rfqData.delivery_location || "",
      items: (rfqData.items || []).map((item, idx) => ({ ...item, id: `item-${mockRFQs.length + 1}-${idx}` })),
      vendor_ids: rfqData.vendor_ids || [],
      attachment_urls: rfqData.attachment_urls || [],
      notes: rfqData.notes,
      created_by: "Jane Smith",
      created_at: new Date().toISOString(),
    };
    mockRFQs.push(newRFQ);
    return newRFQ;
  },

  cancelRFQ: async (id: string, reason: string): Promise<RFQ> => {
    await sleep(DELAY_MS);
    const rfq = mockRFQs.find((r) => r.id === id);
    if (!rfq) throw new Error("RFQ not found");
    rfq.status = "cancelled";
    rfq.cancel_reason = reason;
    return rfq;
  },

  // 5. Quotations
  getQuotationsForRFQ: async (rfqId: string): Promise<Quotation[]> => {
    await sleep(DELAY_MS);
    return mockQuotations.filter((q) => q.rfq_id === rfqId);
  },

  submitQuotation: async (rfqId: string, quoteData: Partial<Quotation>): Promise<Quotation> => {
    await sleep(DELAY_MS);
    const rfq = mockRFQs.find((r) => r.id === rfqId);
    if (!rfq) throw new Error("RFQ not found");
    
    const newQuote: Quotation = {
      id: `quote-${rfqId}-${mockQuotations.length + 1}`,
      quotation_number: `QT-2026-000${mockQuotations.length + 1}`,
      rfq_id: rfqId,
      vendor_id: "vendor-uuid",
      vendor_name: "Steel Suppliers Ltd",
      vendor_rating: 4.5,
      items: (quoteData.items || []).map((it, idx) => ({ ...it, id: `qi-${mockQuotations.length + 1}-${idx}` })),
      total_amount: quoteData.total_amount || 0,
      currency: quoteData.currency || "INR",
      delivery_timeline_days: quoteData.delivery_timeline_days || 7,
      delivery_terms: quoteData.delivery_terms || "Ex-Works",
      payment_terms: quoteData.payment_terms || "Net 30",
      validity_days: quoteData.validity_days || 30,
      notes: quoteData.notes,
      attachment_urls: quoteData.attachment_urls || [],
      pdf_url: `https://cdn/generated/QT-2026-000${mockQuotations.length + 1}.pdf`,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };
    mockQuotations.push(newQuote);
    return newQuote;
  },

  shortlistQuotation: async (rfqId: string, quoteId: string, reason: string): Promise<Approval> => {
    await sleep(DELAY_MS);
    const rfq = mockRFQs.find((r) => r.id === rfqId);
    const quote = mockQuotations.find((q) => q.id === quoteId);
    if (!rfq || !quote) throw new Error("RFQ or Quotation not found");

    quote.status = "shortlisted";
    rfq.status = "closed";

    const newApproval: Approval = {
      approval_id: `approval-${mockApprovals.length + 1}`,
      rfq_id: rfqId,
      rfq_number: rfq.rfq_number,
      rfq_title: rfq.title,
      selected_vendor: quote.vendor_name,
      quotation_id: quoteId,
      quotation_amount: quote.total_amount,
      requested_by: "Jane Smith",
      requested_at: new Date().toISOString(),
      status: "pending",
      remarks: reason,
    };
    mockApprovals.push(newApproval);
    return newApproval;
  },

  // 6. Approvals
  getApprovals: async (): Promise<Approval[]> => {
    await sleep(DELAY_MS);
    return mockApprovals;
  },

  approveApproval: async (id: string, remarks: string, action: "approved" | "rejected"): Promise<Approval> => {
    await sleep(DELAY_MS);
    const approval = mockApprovals.find((a) => a.approval_id === id);
    if (!approval) throw new Error("Approval request not found");

    approval.status = action;
    approval.remarks = remarks;

    const rfq = mockRFQs.find((r) => r.id === approval.rfq_id);
    const quote = mockQuotations.find((q) => q.id === approval.quotation_id);

    if (rfq && quote) {
      if (action === "approved") {
        rfq.status = "awarded";
        quote.status = "accepted";
        
        // Auto-generate PO in mock data
        const newPO: PurchaseOrder = {
          id: `po-${mockPOs.length + 1}`,
          po_number: `PO-2026-000${mockPOs.length + 1}`,
          rfq_id: rfq.id,
          quotation_id: quote.id,
          vendor_id: quote.vendor_id,
          vendor_name: quote.vendor_name,
          total_amount: quote.total_amount,
          currency: quote.currency,
          delivery_address: rfq.delivery_location || "Acme Warehouse",
          expected_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          payment_terms: quote.payment_terms,
          status: "generated",
          pdf_url: `https://cdn/generated/PO-2026-000${mockPOs.length + 1}.pdf`,
          created_at: new Date().toISOString(),
        };
        mockPOs.push(newPO);
      } else {
        quote.status = "rejected";
        rfq.status = "sent"; // reopen RFQ
      }
    }
    return approval;
  },

  // 7. Purchase Orders
  getPOs: async (): Promise<PurchaseOrder[]> => {
    await sleep(DELAY_MS);
    return mockPOs;
  },

  getPODetail: async (id: string): Promise<PurchaseOrder> => {
    await sleep(DELAY_MS);
    const po = mockPOs.find((p) => p.id === id);
    if (!po) throw new Error("Purchase Order not found");
    return po;
  },

  updatePOStatus: async (id: string, status: PurchaseOrder["status"], remarks?: string): Promise<PurchaseOrder> => {
    await sleep(DELAY_MS);
    const po = mockPOs.find((p) => p.id === id);
    if (!po) throw new Error("Purchase Order not found");
    po.status = status;
    if (remarks) po.remarks = remarks;

    // Auto-generate invoice when delivered
    if (status === "delivered") {
      const newInvoice: Invoice = {
        id: `inv-${mockInvoices.length + 1}`,
        invoice_number: `INV-2026-000${mockInvoices.length + 1}`,
        invoice_number_vendor: `INV-VEND-${po.po_number}`,
        po_id: po.id,
        po_number: po.po_number,
        vendor_id: po.vendor_id,
        vendor_name: po.vendor_name,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        items: [
          {
            product_name: "Delivery Item",
            quantity: 1,
            unit_price: po.total_amount / 1.18,
            subtotal: po.total_amount / 1.18,
            tax_percent: 18,
            tax_amount: po.total_amount - po.total_amount / 1.18,
            total: po.total_amount,
          },
        ],
        subtotal: po.total_amount / 1.18,
        tax_total: po.total_amount - po.total_amount / 1.18,
        grand_total: po.total_amount,
        bank_name: "HDFC Bank",
        bank_account: "12345678901234",
        bank_ifsc: "HDFC0001234",
        status: "pending",
        pdf_url: `https://cdn/generated/INV-2026-000${mockInvoices.length + 1}.pdf`,
      };
      mockInvoices.push(newInvoice);
    }
    return po;
  },

  // 8. Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    await sleep(DELAY_MS);
    return mockInvoices;
  },

  getInvoiceDetail: async (id: string): Promise<Invoice> => {
    await sleep(DELAY_MS);
    const invoice = mockInvoices.find((i) => i.id === id);
    if (!invoice) throw new Error("Invoice not found");
    return invoice;
  },

  markInvoicePaid: async (id: string, reference: string, remarks?: string): Promise<Invoice> => {
    await sleep(DELAY_MS);
    const invoice = mockInvoices.find((i) => i.id === id);
    if (!invoice) throw new Error("Invoice not found");
    invoice.status = "paid";
    invoice.payment_reference = reference;
    invoice.payment_date = new Date().toISOString().split("T")[0];
    if (remarks) invoice.remarks = remarks;
    return invoice;
  },

  // 9. Notifications & Logs
  getNotifications: async (): Promise<NotificationItem[]> => {
    await sleep(DELAY_MS);
    return mockNotifications;
  },

  getActivityLogs: async () => {
    await sleep(DELAY_MS);
    return mockActivityLogs;
  },

  // 10. Reports
  getReportsSpendTrend: async () => {
    await sleep(DELAY_MS);
    return mockReports.spendTrend;
  },

  getReportsVendorPerformance: async () => {
    await sleep(DELAY_MS);
    return mockReports.vendorPerformance;
  },

  // Groq / AI Recommendation Proxy Mock
  getAiRecommendation: async (rfqId: string): Promise<{ recommendation: string }> => {
    await sleep(DELAY_MS * 2);
    return {
      recommendation: `AI Vendor Analysis Report (Generated using Groq API):
      
      Based on the 2 submitted quotes for ${mockRFQs[0].title} (FeFeFe 10mm rods):
      
      1. Steel Suppliers Ltd (QT-2026-0001):
         - Total cost: ₹50,445 (including 18% GST).
         - Delivery time: 14 days.
         - Supplier rating: 4.5 stars.
      
      2. Iron Works Co (QT-2026-0002):
         - Total cost: ₹54,280 (including 18% GST).
         - Delivery time: 10 days.
         - Supplier rating: 3.8 stars.
      
      AI Recommendation: Shortlist STEEL SUPPLIERS LTD.
      Reasoning: Steel Suppliers Ltd offers a 7% lower price than Iron Works Co, representing a savings of ₹3,835. Furthermore, their historical quality rating is significantly higher (4.5 vs 3.8), signaling lower operational risk. While Iron Works Co delivers 4 days faster, the urgency check does not indicate that a 4-day lag justifies a 7% premium and a lower quality rating.`,
    };
  },
};
