import { api } from "./api";
import { mockService } from "./mocks/mockService";
import { Approval } from "./mocks/mockData";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

export const approvalService = {
  getApprovals: async (): Promise<Approval[]> => {
    if (USE_MOCKS) return mockService.getApprovals();
    const res = await api.get("/approvals");
    return res.data.approvals ?? res.data;
  },

  approveOrReject: async (
    approvalId: string,
    action: "approved" | "rejected",
    remarks: string
  ): Promise<Approval> => {
    if (USE_MOCKS) return mockService.approveApproval(approvalId, remarks, action);
    const res = await api.post(`/approvals/${approvalId}/${action}`, { remarks });
    return res.data.approval ?? res.data;
  },
};
