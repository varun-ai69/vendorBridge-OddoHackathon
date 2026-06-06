import { mockRequest, IS_MOCK_MODE } from "@/lib/mockApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const isMockMode = () => IS_MOCK_MODE;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vb_token");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vb_refresh_token");
}

export function setTokens(token, refreshToken) {
  localStorage.setItem("vb_token", token);
  if (refreshToken) localStorage.setItem("vb_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("vb_token");
  localStorage.removeItem("vb_refresh_token");
  localStorage.removeItem("vb_user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("vb_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem("vb_user", JSON.stringify(user));
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("vb_token", data.token);
    return data.token;
  }
  return null;
}

async function request(endpoint, options = {}) {
  const { params, skipAuth, raw, ...fetchOptions } = options;

  if (IS_MOCK_MODE) {
    try {
      const data = await mockRequest(endpoint, {
        method: fetchOptions.method || "GET",
        body: fetchOptions.body,
        params,
      });
      if (raw) {
        return { ok: true, json: async () => data };
      }
      return data;
    } catch (err) {
      throw new ApiError(err.message || "Mock error", err.status || 400, {});
    }
  }

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, String(value));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { ...fetchOptions.headers };
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...fetchOptions, headers });
    }
  }

  if (raw) return res;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.message || "Something went wrong",
      res.status,
      data
    );
  }
  return data;
}

const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (endpoint, options) =>
    request(endpoint, { ...options, method: "DELETE" }),
};

// ─── Auth ───────────────────────────────────────────────────────────────────
export const registerOrg = (data) =>
  api.post("/auth/register-org", data, { skipAuth: true });

export const login = (data) =>
  api.post("/auth/login", data, { skipAuth: true });

export const logout = () => api.post("/auth/logout", {});

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }, { skipAuth: true });

export const resetPassword = (data) =>
  api.post("/auth/reset-password", data, { skipAuth: true });

export const changePassword = (data) =>
  api.put("/auth/change-password", data);

export const getMe = () => api.get("/auth/me");

export const updateProfile = (data) => api.put("/auth/me", data);

// ─── Organization ───────────────────────────────────────────────────────────
export const getOrg = () => api.get("/org/me");

export const updateOrg = (data) => api.put("/org/me", data);

// ─── Users (Admin) ──────────────────────────────────────────────────────────
export const inviteUser = (data) => api.post("/admin/users/invite", data);

export const getUsers = (params) => api.get("/admin/users", { params });

export const getUser = (userId) => api.get(`/admin/users/${userId}`);

export const updateUser = (userId, data) =>
  api.put(`/admin/users/${userId}`, data);

export const updateUserStatus = (userId, is_active) =>
  api.patch(`/admin/users/${userId}/status`, { is_active });

export const resetUserPassword = (userId, new_password) =>
  api.post(`/admin/users/${userId}/reset-password`, { new_password });

export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// ─── Vendors ────────────────────────────────────────────────────────────────
export const createVendor = (data) => api.post("/admin/vendors", data);

export const getVendors = (params) => api.get("/admin/vendors", { params });

export const getVendor = (vendorId) => api.get(`/admin/vendors/${vendorId}`);

export const updateVendor = (vendorId, data) =>
  api.put(`/admin/vendors/${vendorId}`, data);

export const updateVendorStatus = (vendorId, data) =>
  api.patch(`/admin/vendors/${vendorId}/status`, data);

export const deleteVendor = (vendorId) => api.delete(`/admin/vendors/${vendorId}`);

export const getVendorProfile = () => api.get("/vendor/profile");

export const updateVendorProfile = (data) => api.put("/vendor/profile", data);

// ─── RFQ ────────────────────────────────────────────────────────────────────
export const createRfq = (data) => api.post("/rfq", data);

export const getRfqs = (params) => api.get("/rfq", { params });

export const getRfq = (rfqId) => api.get(`/rfq/${rfqId}`);

export const updateRfq = (rfqId, data) => api.put(`/rfq/${rfqId}`, data);

export const cancelRfq = (rfqId, reason) =>
  api.patch(`/rfq/${rfqId}/cancel`, { reason });

export const addRfqVendors = (rfqId, vendor_ids) =>
  api.post(`/rfq/${rfqId}/vendors`, { vendor_ids });

export const getVendorRfqs = (params) => api.get("/vendor/rfqs", { params });

export const getVendorRfq = (rfqId) => api.get(`/vendor/rfqs/${rfqId}`);

// ─── Quotations ─────────────────────────────────────────────────────────────
export const submitQuotation = (rfqId, data) =>
  api.post(`/vendor/rfqs/${rfqId}/quotation`, data);

export const updateQuotation = (rfqId, quotationId, data) =>
  api.put(`/vendor/rfqs/${rfqId}/quotation/${quotationId}`, data);

export const getVendorQuotations = (params) =>
  api.get("/vendor/quotations", { params });

export const getVendorQuotation = (quotationId) =>
  api.get(`/vendor/quotations/${quotationId}`);

export const getRfqQuotations = (rfqId) =>
  api.get(`/rfq/${rfqId}/quotations`);

export const compareQuotations = (rfqId) =>
  api.get(`/rfq/${rfqId}/quotations/compare`);

export const selectQuotation = (rfqId, quotationId, selection_reason) =>
  api.patch(`/rfq/${rfqId}/quotations/${quotationId}/select`, {
    selection_reason,
  });

export const getRfqApprovalStatus = (rfqId) =>
  api.get(`/rfq/${rfqId}/approval-status`);

// ─── Approvals ──────────────────────────────────────────────────────────────
export const getApprovals = (params) => api.get("/approvals", { params });

export const getApproval = (approvalId) => api.get(`/approvals/${approvalId}`);

export const approvalAction = (approvalId, action, remarks) =>
  api.patch(`/approvals/${approvalId}/action`, { action, remarks });

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const createPo = (data) => api.post("/po", data);

export const getPos = (params) => api.get("/po", { params });

export const getPo = (poId) => api.get(`/po/${poId}`);

export const downloadPo = (poId) =>
  api.get(`/po/${poId}/download`, { raw: true });

export const sendPoEmail = (poId, data) =>
  api.post(`/po/${poId}/send-email`, data);

export const updatePoStatus = (poId, data) =>
  api.patch(`/po/${poId}/status`, data);

export const getVendorPos = (params) => api.get("/vendor/po", { params });

// ─── Invoices ───────────────────────────────────────────────────────────────
export const createInvoice = (poId, data) =>
  api.post(`/vendor/po/${poId}/invoice`, data);

export const getInvoices = (params) => api.get("/invoices", { params });

export const getInvoice = (invoiceId) => api.get(`/invoices/${invoiceId}`);

export const downloadInvoice = (invoiceId) =>
  api.get(`/invoices/${invoiceId}/download`, { raw: true });

export const sendInvoiceEmail = (invoiceId, data) =>
  api.post(`/invoices/${invoiceId}/send-email`, data);

export const updateInvoiceStatus = (invoiceId, data) =>
  api.patch(`/invoices/${invoiceId}/status`, data);

export const getVendorInvoices = (params) =>
  api.get("/vendor/invoices", { params });

export const getVendorInvoice = (invoiceId) =>
  api.get(`/vendor/invoices/${invoiceId}`);

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = (params) =>
  api.get("/notifications", { params });

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`, {});

export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all", {});

export const getUnreadCount = () => api.get("/notifications/unread-count");

// ─── Activity Logs ──────────────────────────────────────────────────────────
export const getActivityLogs = (params) =>
  api.get("/activity-logs", { params });

// ─── Dashboard ──────────────────────────────────────────────────────────────
export const fetchAdminDashboard = () => api.get("/dashboard/admin");

export const fetchProcurementDashboard = () =>
  api.get("/dashboard/procurement");

export const fetchManagerDashboard = () => api.get("/dashboard/manager");

export const fetchVendorDashboard = () => api.get("/dashboard/vendor");

export const fetchAnalytics = (role) => {
  const map = {
    admin: fetchAdminDashboard,
    procurement_officer: fetchProcurementDashboard,
    manager: fetchManagerDashboard,
    vendor: fetchVendorDashboard,
  };
  return (map[role] || fetchAdminDashboard)();
};

// ─── Reports ────────────────────────────────────────────────────────────────
export const getProcurementSummary = (params) =>
  api.get("/reports/procurement-summary", { params });

export const getSpendTrend = (params) =>
  api.get("/reports/spend-trend", { params });

export const getVendorPerformance = (params) =>
  api.get("/reports/vendor-performance", { params });

export const getApprovalAnalytics = (params) =>
  api.get("/reports/approval-analytics", { params });

export const getSpendByCategory = (params) =>
  api.get("/reports/spend-by-category", { params });

export const exportReport = (data) => api.post("/reports/export", data);

export const getVendorPerformanceReport = () =>
  api.get("/vendor/reports/performance");

// ─── Uploads ────────────────────────────────────────────────────────────────
export const uploadFile = (file, entity_type) => {
  const form = new FormData();
  form.append("file", file);
  form.append("entity_type", entity_type);
  return api.post("/upload", form);
};

export { ApiError, API_BASE };
