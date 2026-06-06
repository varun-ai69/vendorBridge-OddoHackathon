"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoAdd, IoTrash, IoArrowBack } from "react-icons/io5";
import Link from "next/link";
import { createRfq, getVendors } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const emptyItem = () => ({ product_name: "", description: "", quantity: "", unit: "pieces", specifications: "" });

export default function CreateRfqPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", deadline: "", delivery_location: "", notes: "",
    vendor_ids: [], items: [emptyItem()],
  });

  useEffect(() => {
    if (user?.role !== "procurement_officer") { router.replace("/rfq"); return; }
    getVendors({ is_approved: true, is_active: true, limit: 100 })
      .then((res) => setVendors(res.vendors || res || []))
      .catch(() => {});
  }, [user]);

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const toggleVendor = (id) => {
    const ids = form.vendor_ids.includes(id)
      ? form.vendor_ids.filter((v) => v !== id)
      : [...form.vendor_ids, id];
    setForm({ ...form, vendor_ids: ids });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        deadline: new Date(form.deadline).toISOString(),
        items: form.items.map((item) => ({ ...item, quantity: Number(item.quantity) })),
      };
      const res = await createRfq(payload);
      router.push(`/rfq/${res.rfq_id}`);
    } catch (err) {
      setError(err.message || "Failed to create RFQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Link href="/rfq" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4">
        <IoArrowBack /> Back to RFQs
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create RFQ</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="font-semibold mb-4">Basic Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required containerClassName="sm:col-span-2" />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} containerClassName="sm:col-span-2" />
            <Input label="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            <Input label="Delivery Location" value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} containerClassName="sm:col-span-2" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Line Items</h3>
            <Button type="button" variant="secondary" size="sm" icon={IoAdd} onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}>Add Item</Button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 pb-4 border-b border-[var(--border)] last:border-0">
              <Input label="Product" value={item.product_name} onChange={(e) => updateItem(i, "product_name", e.target.value)} required />
              <Input label="Quantity" type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} required />
              <Input label="Unit" value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} />
              <Input label="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} containerClassName="sm:col-span-2" />
              <Input label="Specifications" value={item.specifications} onChange={(e) => updateItem(i, "specifications", e.target.value)} />
              {form.items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" icon={IoTrash} onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}>Remove</Button>
              )}
            </div>
          ))}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Select Vendors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendors.map((v) => (
              <label key={v.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${form.vendor_ids.includes(v.id) ? "border-accent bg-accent-muted" : "border-[var(--border)]"}`}>
                <input type="checkbox" checked={form.vendor_ids.includes(v.id)} onChange={() => toggleVendor(v.id)} className="accent-accent" />
                <div>
                  <p className="text-sm font-medium">{v.company_name}</p>
                  <p className="text-xs text-muted">{v.email}</p>
                </div>
              </label>
            ))}
          </div>
          {!vendors.length && <p className="text-sm text-muted">No approved vendors available. Add vendors first.</p>}
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} size="lg">Send RFQ to Vendors</Button>
      </form>
    </PageTransition>
  );
}
