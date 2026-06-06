"use client";

import { useEffect, useState } from "react";
import { IoPeople, IoAdd } from "react-icons/io5";
import { getUsers, inviteUser, updateUserStatus } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "procurement_officer", phone: "", department: "", company_name: "", generated_password: "" });

  useEffect(() => {
    if (user?.role !== "admin") { router.replace("/dashboard"); return; }
    loadUsers();
  }, [user]);

  const loadUsers = () => {
    setLoading(true);
    getUsers({ limit: 50 })
      .then((res) => setUsers(res.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await inviteUser(form);
      setModalOpen(false);
      setForm({ name: "", email: "", role: "procurement_officer", phone: "", department: "", company_name: "", generated_password: "" });
      loadUsers();
    } catch { /* handled by UI */ }
    finally { setInviteLoading(false); }
  };

  const toggleStatus = async (userId, is_active) => {
    await updateUserStatus(userId, !is_active);
    loadUsers();
  };

  const columns = [
    { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <Badge color="blue">{ROLE_LABELS[r.role] || r.role}</Badge> },
    { key: "is_active", label: "Status", render: (r) => <Badge color={r.is_active ? "emerald" : "red"}>{r.is_active ? "Active" : "Inactive"}</Badge> },
    { key: "created_at", label: "Joined", render: (r) => formatDate(r.created_at) },
    { key: "actions", label: "", render: (r) => (
      <Button variant="ghost" size="sm" onClick={() => toggleStatus(r.id, r.is_active)}>
        {r.is_active ? "Deactivate" : "Activate"}
      </Button>
    )},
  ];

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User & Vendor Credentials Console</h1>
          <p className="text-sm text-muted mt-1">Manage login credentials and directory profiles for your team and vendors.</p>
        </div>
        <Button icon={IoAdd} onClick={() => setModalOpen(true)}>Register User / Vendor</Button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyIcon={IoPeople} emptyTitle="No users yet" emptyDescription="Register your first user or vendor account." emptyAction={<Button icon={IoAdd} onClick={() => setModalOpen(true)}>Register User / Vendor</Button>} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register New Account" size="md">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label="Full Name / Contact Person" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-foreground/80">Role</label>
            <select className="mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-surface px-3 py-2.5 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="procurement_officer">Procurement Officer</option>
              <option value="manager">Manager</option>
              <option value="vendor">Vendor Partner</option>
            </select>
          </div>
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          
          {form.role === "vendor" ? (
            <Input label="Company Name" placeholder="e.g. Delta Castings Ltd" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
          ) : (
            <Input label="Department" placeholder="e.g. Procurement" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          )}

          <Input label="Temporary Password" value={form.generated_password} onChange={(e) => setForm({ ...form, generated_password: e.target.value })} required />
          <Button type="submit" loading={inviteLoading} className="w-full">Register & Create Account</Button>
        </form>
      </Modal>
    </PageTransition>
  );
}
