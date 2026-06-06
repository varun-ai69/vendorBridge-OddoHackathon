import { api } from "./api";
import { mockService } from "./mocks/mockService";
import { RFQ, Quotation } from "./mocks/mockData";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

export const rfqService = {
  getRFQs: async (): Promise<RFQ[]> => {
    if (USE_MOCKS) return mockService.getRFQs();
    const res = await api.get("/rfqs");
    return res.data.rfqs ?? res.data;
  },

  getRFQDetail: async (id: string): Promise<RFQ> => {
    if (USE_MOCKS) return mockService.getRFQDetail(id);
    const res = await api.get(`/rfqs/${id}`);
    return res.data.rfq ?? res.data;
  },

  createRFQ: async (data: Partial<RFQ>): Promise<RFQ> => {
    if (USE_MOCKS) return mockService.createRFQ(data);
    const res = await api.post("/rfqs", data);
    return res.data.rfq ?? res.data;
  },

  getQuotationsForRFQ: async (rfqId: string): Promise<Quotation[]> => {
    if (USE_MOCKS) return mockService.getQuotationsForRFQ(rfqId);
    const res = await api.get(`/rfqs/${rfqId}/quotations`);
    return res.data.quotations ?? res.data;
  },

  shortlistQuotation: async (rfqId: string, quotationId: string): Promise<void> => {
    if (USE_MOCKS) {
      await mockService.shortlistQuotation(rfqId, quotationId, "");
      return;
    }
    await api.post(`/rfqs/${rfqId}/shortlist`, { quotation_id: quotationId });
  },
};
