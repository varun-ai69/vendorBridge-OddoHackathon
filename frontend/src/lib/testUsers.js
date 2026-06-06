import { ROLES } from "./constants";

export const TEST_USERS = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    name: "John Admin",
    email: "admin@acme.com",
    phone: "+91-9876543210",
    password: "Test@123",
    org_name: "Acme Corp",
  },
  [ROLES.PROCUREMENT]: {
    role: ROLES.PROCUREMENT,
    name: "Jane Procurement",
    email: "procurement@acme.com",
    phone: "+91-9876543211",
    password: "Test@123",
    org_name: "Acme Corp",
  },
  [ROLES.MANAGER]: {
    role: ROLES.MANAGER,
    name: "Mike Manager",
    email: "manager@acme.com",
    phone: "+91-9876543212",
    password: "Test@123",
    org_name: "Acme Corp",
  },
  [ROLES.VENDOR]: {
    role: ROLES.VENDOR,
    name: "Raj Kumar",
    email: "vendor@steelsuppliers.com",
    phone: "+91-9111111111",
    password: "Test@123",
    company_name: "Steel Suppliers Ltd",
  },
};

export const LOGIN_ROLES = [
  { value: ROLES.ADMIN, label: "Administrator", description: "Full system control" },
  { value: ROLES.PROCUREMENT, label: "Procurement Officer", description: "Create RFQs & POs" },
  { value: ROLES.MANAGER, label: "Manager", description: "Approve procurement" },
  { value: ROLES.VENDOR, label: "Vendor", description: "Submit quotations" },
];
