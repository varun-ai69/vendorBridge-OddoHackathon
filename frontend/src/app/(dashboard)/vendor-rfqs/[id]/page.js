"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { getVendorRfq, submitQuotation } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatDateTime } from "@/lib/format";

export default function VendorRfqDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    total_amount: "", delivery_timeline_days: "", delivery_terms: "Ex-Works",
    payment_terms: "Net 30", validity_days: "30", notes: "",
    items: [],
  });

  useEffect(() => {
    getVendorRfq(id).then((data) => {
      setRfq(data);
      setForm((f) => ({
        ...f,
        items: (data.items || []).map((item) => ({
          rfq_item_id: item.id || item.rfq_item_id,
          product_name: item.product_name,
          unit_price: "",
          quantity: item.quantity,
          unit: item.unit,
          tax_percent: 18,
          subtotal: 0,
        })),
      }));
    }).catch(() => router.push("/vendor-rfqs")).finally(() => setLoading(false));
  }, [id]);

  const updateItemPrice = (i, price) => {
    const items = [...form.items];
    const qty = items[i].quantity;
    const subtotal = Number(price) * qty;
    items[i] = { ...items[i], unit_price: price, subtotal };
    const total = items.reduce((s, it) => s + (it.subtotal || 0), 0);
    const tax = total * 0.18;
    setForm({ ...form, items, total_amount: Math.round(total + tax) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitQuotation(id, { ...form, total_amount: Number(form.total_amount), delivery_timeline_days: Number(form.delivery_timeline_days), validity_days: Number(form.validity_days) });
      router.push("/vendor-quotations");
    } catch { /* */ }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!rfq) return null;

  return (
    <PageTransition>
      <Link href="/vendor-rfqs" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4">
        <IoArrowBack /> Back to RFQs
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{rfq.title}</h1>
          <p className="font-mono text-sm text-accent mt-1">{rfq.rfq_number}</p>
        </div>
        {!rfq.has_quotation && !showForm && (
          <Button onClick={() => setShowForm(true)}>Submit Quotation</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Items Requested</h3>
          {(rfq.items || []).map((item, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] p-4 mb-3">
              <p className="font-medium">{item.product_name}</p>
              <p className="text-sm text-muted">{item.description}</p>
              <p className="text-sm mt-1">Qty: {item.quantity} {item.unit}</p>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">RFQ Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Deadline</dt><dd>{formatDateTime(rfq.deadline)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{rfq.delivery_location || "—"}</dd></div>
          </dl>
        </Card>
      </div>

      {showForm && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Submit Quotation</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 items-end">
                <div><p className="text-sm font-medium">{item.product_name}</p><p className="text-xs text-muted">Qty: {item.quantity}</p></div>
                <Input label="Unit Price (₹)" type="number" value={item.unit_price} onChange={(e) => updateItemPrice(i, e.target.value)} required />
                <p className="text-sm font-medium pb-2">Subtotal: ₹{item.subtotal?.toLocaleString("en-IN") || 0}</p>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Delivery Timeline (days)" type="number" value={form.delivery_timeline_days} onChange={(e) => setForm({ ...form, delivery_timeline_days: e.target.value })} required />
              <Input label="Total Amount (₹)" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
              <Input label="Payment Terms" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} />
              <Input label="Validity (days)" type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} />
            </div>
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" loading={submitting} size="lg">Submit Quotation</Button>
          </form>
        </Card>
      )}
    </PageTransition>
  );
}
