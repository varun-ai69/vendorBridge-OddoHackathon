export const ROLES = {
  ADMIN: "admin",
  PROCUREMENT: "procurement_officer",
  MANAGER: "manager",
  VENDOR: "vendor",
};

export const ROLE_LABELS = {
  admin: "Administrator",
  procurement_officer: "Procurement Officer",
  manager: "Manager",
  vendor: "Vendor",
};

export const RFQ_STATUSES = {
  draft: { label: "Draft", color: "slate" },
  sent: { label: "Sent", color: "blue" },
  closed: { label: "Closed", color: "amber" },
  awarded: { label: "Awarded", color: "emerald" },
  cancelled: { label: "Cancelled", color: "red" },
};

export const PO_STATUSES = {
  generated: { label: "Generated", color: "blue" },
  acknowledged: { label: "Acknowledged", color: "cyan" },
  in_transit: { label: "In Transit", color: "amber" },
  delivered: { label: "Delivered", color: "emerald" },
  cancelled: { label: "Cancelled", color: "red" },
};

export const INVOICE_STATUSES = {
  pending: { label: "Pending", color: "amber" },
  paid: { label: "Paid", color: "emerald" },
  overdue: { label: "Overdue", color: "red" },
  disputed: { label: "Disputed", color: "orange" },
};

export const APPROVAL_STATUSES = {
  pending: { label: "Pending", color: "amber" },
  approved: { label: "Approved", color: "emerald" },
  rejected: { label: "Rejected", color: "red" },
};

export const NAV_ITEMS = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/users", label: "Users", icon: "people" },
    { href: "/vendors", label: "Vendors", icon: "storefront" },
    { href: "/rfq", label: "RFQs", icon: "document" },
    { href: "/approvals", label: "Approvals", icon: "checkmark" },
    { href: "/po", label: "Purchase Orders", icon: "cube" },
    { href: "/invoices", label: "Invoices", icon: "receipt" },
    { href: "/reports", label: "Reports", icon: "bar-chart" },
    { href: "/activity-logs", label: "Activity Logs", icon: "time" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
  procurement_officer: [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/vendors", label: "Vendors", icon: "storefront" },
    { href: "/rfq", label: "RFQs", icon: "document" },
    { href: "/approvals", label: "Approvals", icon: "checkmark" },
    { href: "/po", label: "Purchase Orders", icon: "cube" },
    { href: "/invoices", label: "Invoices", icon: "receipt" },
    { href: "/reports", label: "Reports", icon: "bar-chart" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
  manager: [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/rfq", label: "RFQs", icon: "document" },
    { href: "/approvals", label: "Approvals", icon: "checkmark" },
    { href: "/po", label: "Purchase Orders", icon: "cube" },
    { href: "/invoices", label: "Invoices", icon: "receipt" },
    { href: "/reports", label: "Reports", icon: "bar-chart" },
    { href: "/activity-logs", label: "Activity Logs", icon: "time" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
  vendor: [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/vendor-rfqs", label: "RFQs", icon: "document" },
    { href: "/vendor-quotations", label: "Quotations", icon: "pricetag" },
    { href: "/vendor-po", label: "Purchase Orders", icon: "cube" },
    { href: "/vendor-invoices", label: "Invoices", icon: "receipt" },
    { href: "/profile", label: "Profile", icon: "person" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
};
