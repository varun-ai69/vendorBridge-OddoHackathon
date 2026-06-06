import { api } from "./api";
import { mockService } from "./mocks/mockService";
import { UserRole } from "../store/authStore";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

export const dashboardService = {
  getDashboard: async (role: UserRole) => {
    if (USE_MOCKS) return mockService.getDashboard(role);
    const res = await api.get("/dashboard");
    return res.data;
  },
};
