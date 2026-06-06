"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoStorefront, IoAdd, IoSearch } from "react-icons/io5";
import { getVendors, createVendor, updateVendorStatus } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export default function VendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "", contact_person: "", email: "", phone: "", address: "",
    gst_number: "", pan_number: "", category: "", bank_name: "", bank_account: "",
    bank_ifsc: "", generated_password: "", notes: "",
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!["admin", "procurement_officer"].includes(user?.role)) {
      router.replace("/dashboard");
      return;
    }
    loadVendors();
  }, [user, search]);

  const loadVendors = () => {
    setLoading(true);
    getVendors({ search, limit: 50 })
      .then((res) => setVendors(res.vendors || res || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, category: form.category ? form.category.split(",").map((c) => c.trim()) : [] };
      await createVendor(payload);
      setModalOpen(false);
      loadVendors();
    } catch { /* */ }
    finally { setSaving(false); }
  };

  const approveVendor = async (id) => {
    await updateVendorStatus(id, { is_approved: true, is_active: true });
    loadVendors();
  };

  const columns = [
    { key: "company_name", label: "Company", render: (r) => <span className="font-medium">{r.company_name}</span> },
    { key: "contact_person", label: "Contact" },
    { key: "email", label: "Email" },
    { key: "gst_number", label: "GST" },
    { key: "rating", label: "Rating", render: (r) => r.rating ? `★ ${r.rating}` : "—" },
    { key: "is_approved", label: "Status", render: (r) => (
      <Badge color={r.is_approved ? "emerald" : "amber"}>{r.is_approved ? "Approved" : "Pending"}</Badge>
    )},
    { key: "created_at", label: "Added", render: (r) => formatDate(r.created_at) },
    ...(isAdmin ? [{ key: "actions", label: "", render: (r) => !r.is_approved && (
      <Button variant="ghost" size="sm" onClick={() => approveVendor(r.id)}>Approve</Button>
    )}] : []),
  ];

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-sm text-muted mt-1">Manage supplier relationships</p>
        </div>
        <div className="flex gap-3">
          <Input icon={IoSearch} placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} containerClassName="!gap-0" className="!py-2" />
          {isAdmin && <Button icon={IoAdd} onClick={() => setModalOpen(true)}>Add Vendor</Button>}
        </div>
      </div>

      <DataTable columns={columns} data={vendors} loading={loading} emptyIcon={IoStorefront} emptyTitle="No vendors found" emptyDescription="Add vendors to start sending RFQs." emptyAction={isAdmin && <Button icon={IoAdd} onClick={() => setModalOpen(true)}>Add Vendor</Button>} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Vendor" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <Input label="Company Name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="GST Number" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
          <Input label="PAN Number" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} />
          <Input label="Categories (comma-separated)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} containerClassName="sm:col-span-2" />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} containerClassName="sm:col-span-2" />
          <Input label="Bank Name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
          <Input label="Bank Account" value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} />
          <Input label="IFSC" value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} />
          <Input label="Login Password" value={form.generated_password} onChange={(e) => setForm({ ...form, generated_password: e.target.value })} required />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} className="w-full">Create Vendor</Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}
