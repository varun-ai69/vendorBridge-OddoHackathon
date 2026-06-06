/**
 * Seed test users for all roles.
 * Run: node scripts/seedTestUsers.js
 *
 * All passwords: Test@123
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const bcrypt = require("bcrypt");
const { pool } = require("../db/db");

const PASSWORD = "Test@123";

const TEST_DATA = {
  org: {
    name: "Acme Corp",
    address: "123 Main St, Pune, Maharashtra",
    gst: "29ABCDE1234F1Z5",
    industry: "Manufacturing",
    website: "https://acme.com",
  },
  users: [
    {
      name: "John Admin",
      email: "admin@acme.com",
      phone: "+91-9876543210",
      role: "admin",
      department: "Administration",
    },
    {
      name: "Jane Procurement",
      email: "procurement@acme.com",
      phone: "+91-9876543211",
      role: "procurement_officer",
      department: "Procurement",
    },
    {
      name: "Mike Manager",
      email: "manager@acme.com",
      phone: "+91-9876543212",
      role: "manager",
      department: "Finance",
    },
    {
      name: "Raj Kumar",
      email: "vendor@steelsuppliers.com",
      phone: "+91-9111111111",
      role: "vendor",
      department: null,
    },
  ],
  vendor: {
    company_name: "Steel Suppliers Ltd",
    contact_person: "Raj Kumar",
    email: "vendor@steelsuppliers.com",
    phone: "+91-9111111111",
    address: "Plot 12, MIDC, Pune",
    gst_number: "27AAAPL1234C1Z5",
    pan_number: "AAAPL1234C",
    category: ["Raw Materials", "Steel"],
    bank_name: "HDFC Bank",
    bank_account: "12345678901234",
    bank_ifsc: "HDFC0001234",
  },
};

async function seed() {
  const client = await pool.connect();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  try {
    await client.query("BEGIN");

    // Clear existing test data
    await client.query("DELETE FROM vendors WHERE email = $1", [TEST_DATA.vendor.email]);
    await client.query(
      "DELETE FROM users WHERE email = ANY($1)",
      [TEST_DATA.users.map((u) => u.email)]
    );
    await client.query("DELETE FROM organizations WHERE name = $1", [TEST_DATA.org.name]);

    const orgResult = await client.query(
      `INSERT INTO organizations (name, address, gst, industry, website)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [TEST_DATA.org.name, TEST_DATA.org.address, TEST_DATA.org.gst, TEST_DATA.org.industry, TEST_DATA.org.website]
    );
    const orgId = orgResult.rows[0].id;

    const userIds = {};
    for (const u of TEST_DATA.users) {
      const result = await client.query(
        `INSERT INTO users (org_id, name, email, phone, password_hash, role, department)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role`,
        [orgId, u.name, u.email, u.phone, passwordHash, u.role, u.department]
      );
      userIds[u.role] = result.rows[0].id;
      console.log(`  ✓ ${u.role.padEnd(22)} ${u.email}`);
    }

    const v = TEST_DATA.vendor;
    await client.query(
      `INSERT INTO vendors (org_id, user_id, company_name, contact_person, email, phone, address, gst_number, pan_number, category, bank_name, bank_account, bank_ifsc, is_active, is_approved, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, true, 4.5)`,
      [orgId, userIds.vendor, v.company_name, v.contact_person, v.email, v.phone, v.address, v.gst_number, v.pan_number, v.category, v.bank_name, v.bank_account, v.bank_ifsc]
    );

    await client.query("COMMIT");

    console.log("\n✅ Test users seeded successfully!");
    console.log(`   Organization: ${TEST_DATA.org.name}`);
    console.log(`   Password (all): ${PASSWORD}\n`);
    console.log("   ┌─────────────────────────┬──────────────────────────────┐");
    console.log("   │ Role                    │ Email                        │");
    console.log("   ├─────────────────────────┼──────────────────────────────┤");
    for (const u of TEST_DATA.users) {
      console.log(`   │ ${u.role.padEnd(23)} │ ${u.email.padEnd(28)} │`);
    }
    console.log("   └─────────────────────────┴──────────────────────────────┘\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
