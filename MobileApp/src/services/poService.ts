import { api } from "./api";
import { mockService } from "./mocks/mockService";
import { PurchaseOrder, Invoice } from "./mocks/mockData";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

export const poService = {
  getPOs: async (): Promise<PurchaseOrder[]> => {
    if (USE_MOCKS) return mockService.getPOs();
    const res = await api.get("/purchase-orders");
    return res.data.purchase_orders ?? res.data;
  },

  getPODetail: async (id: string): Promise<PurchaseOrder> => {
    if (USE_MOCKS) return mockService.getPODetail(id);
    const res = await api.get(`/purchase-orders/${id}`);
    return res.data.purchase_order ?? res.data;
  },

  updateStatus: async (id: string, status: PurchaseOrder["status"], remarks?: string): Promise<PurchaseOrder> => {
    if (USE_MOCKS) return mockService.updatePOStatus(id, status, remarks);
    const res = await api.patch(`/purchase-orders/${id}/status`, { status, remarks });
    return res.data.purchase_order ?? res.data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    if (USE_MOCKS) return mockService.getInvoices();
    const res = await api.get("/invoices");
    return res.data.invoices ?? res.data;
  },

  getInvoiceDetail: async (id: string): Promise<Invoice> => {
    if (USE_MOCKS) return mockService.getInvoiceDetail(id);
    const res = await api.get(`/invoices/${id}`);
    return res.data.invoice ?? res.data;
  },

  markInvoicePaid: async (id: string, reference: string, remarks?: string): Promise<Invoice> => {
    if (USE_MOCKS) return mockService.markInvoicePaid(id, reference, remarks);
    const res = await api.patch(`/invoices/${id}/mark-paid`, { payment_reference: reference, remarks });
    return res.data.invoice ?? res.data;
  },
};
