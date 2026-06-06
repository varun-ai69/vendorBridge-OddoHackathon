# Test Users — VendorBridge

All demo accounts use the same password: **`Test@123`**

| Role | Email | Mobile |
|------|-------|--------|
| **Administrator** | admin@acme.com | +91-9876543210 |
| **Procurement Officer** | procurement@acme.com | +91-9876543211 |
| **Manager** | manager@acme.com | +91-9876543212 |
| **Vendor** | vendor@steelsuppliers.com | +91-9111111111 |

## Quick Login

1. Go to `/login`
2. Select the user type (role)
3. Click **Use Demo Credentials** to auto-fill
4. Sign in

## Seed Database (Backend)

```bash
# 1. Run schema
psql -U postgres -d oddoHackathon -f backend/model/schema.sql

# 2. Seed test users
cd backend
node scripts/seedTestUsers.js
```
