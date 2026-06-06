import { api } from "./api";
import { mockService } from "./mocks/mockService";
import { Vendor } from "./mocks/mockData";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

export const vendorService = {
  getVendors: async (): Promise<Vendor[]> => {
    if (USE_MOCKS) return mockService.getVendors();
    const res = await api.get("/vendors");
    return res.data.vendors ?? res.data;
  },

  getVendorDetail: async (id: string): Promise<Vendor> => {
    if (USE_MOCKS) return mockService.getVendorDetail(id);
    const res = await api.get(`/vendors/${id}`);
    return res.data.vendor ?? res.data;
  },

  createVendor: async (data: Partial<Vendor>): Promise<Vendor> => {
    if (USE_MOCKS) return mockService.createVendor(data);
    const res = await api.post("/vendors/invite", data);
    return res.data.vendor ?? res.data;
  },

  updateVendorStatus: async (id: string, is_approved: boolean, is_active: boolean): Promise<Vendor> => {
    if (USE_MOCKS) return mockService.updateVendorStatus(id, is_approved, is_active);
    const res = await api.patch(`/vendors/${id}/status`, { is_approved, is_active });
    return res.data.vendor ?? res.data;
  },
};
