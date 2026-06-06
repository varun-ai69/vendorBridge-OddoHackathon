import { ROLES } from "./constants";

export const TEST_USERS = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    name: "Arjun Mehta",
    email: "admin@vendorbridge.com",
    phone: "+91-9800000001",
    password: "Demo@12345",
    org_name: "VendorBridge Demo Corp",
  },
  [ROLES.PROCUREMENT]: {
    role: ROLES.PROCUREMENT,
    name: "Jane Smith",
    email: "procurement@vendorbridge.com",
    phone: "+91-9800000002",
    password: "Demo@12345",
    org_name: "VendorBridge Demo Corp",
  },
  [ROLES.MANAGER]: {
    role: ROLES.MANAGER,
    name: "Ravi Sharma",
    email: "manager@vendorbridge.com",
    phone: "+91-9800000003",
    password: "Demo@12345",
    org_name: "VendorBridge Demo Corp",
  },
  [ROLES.VENDOR]: {
    role: ROLES.VENDOR,
    name: "Raj Kumar",
    email: "vendor1@steelsuppliers.com",
    phone: "+91-9111111111",
    password: "Demo@12345",
    company_name: "Steel Suppliers Ltd",
  },
};

export const LOGIN_ROLES = [
  { value: ROLES.ADMIN, label: "Administrator", description: "Full system control" },
  { value: ROLES.PROCUREMENT, label: "Procurement Officer", description: "Create RFQs & POs" },
  { value: ROLES.MANAGER, label: "Manager", description: "Approve procurement" },
  { value: ROLES.VENDOR, label: "Vendor", description: "Submit quotations" },
];
