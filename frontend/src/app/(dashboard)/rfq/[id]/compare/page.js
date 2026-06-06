"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoTrophy } from "react-icons/io5";
import { compareQuotations, selectQuotation } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/format";

export default function ComparePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectModal, setSelectModal] = useState(null);
  const [reason, setReason] = useState("");
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    compareQuotations(id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async () => {
    if (!selectModal) return;
    setSelecting(true);
    try {
      await selectQuotation(id, selectModal.quotation_id, reason);
      setSelectModal(null);
      router.push("/approvals");
    } catch { /* */ }
    finally { setSelecting(false); }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  if (!data?.items_comparison?.length) {
    return (
      <PageTransition>
        <EmptyState icon={IoTrophy} title="No quotations to compare" description="Wait for vendors to submit their quotations." action={<Link href={`/rfq/${id}`}><Button>Back to RFQ</Button></Link>} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Link href={`/rfq/${id}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4">
        <IoArrowBack /> Back to RFQ
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quotation Comparison</h1>
        <p className="text-sm text-muted mt-1">{data.rfq_number} — Side-by-side vendor analysis</p>
      </div>

      {data.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="!p-4 border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-muted uppercase tracking-wider">Lowest Price</p>
            <p className="font-semibold mt-1">{data.summary.lowest_price_vendor_name || "—"}</p>
          </Card>
          <Card className="!p-4 border-blue-200 dark:border-blue-800">
            <p className="text-xs text-muted uppercase tracking-wider">Fastest Delivery</p>
            <p className="font-semibold mt-1">{data.summary.fastest_delivery_vendor_name || "—"}</p>
          </Card>
        </div>
      )}

      {data.items_comparison.map((item, idx) => (
        <Card key={idx} className="mb-6" delay={idx * 0.05}>
          <h3 className="font-semibold mb-1">{item.product_name}</h3>
          <p className="text-sm text-muted mb-4">Quantity: {item.quantity}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs text-muted uppercase">Vendor</th>
                  <th className="text-left py-2 px-3 text-xs text-muted uppercase">Unit Price</th>
                  <th className="text-left py-2 px-3 text-xs text-muted uppercase">Total</th>
                  <th className="text-left py-2 px-3 text-xs text-muted uppercase">Delivery</th>
                  <th className="text-left py-2 px-3 text-xs text-muted uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {(item.vendors || []).map((v, vi) => (
                  <tr key={vi} className={`border-b border-[var(--border)] ${v.is_lowest_price ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}>
                    <td className="py-3 px-3 font-medium">
                      {v.vendor_name}
                      {v.is_lowest_price && <Badge color="emerald" className="ml-2">Lowest</Badge>}
                    </td>
                    <td className="py-3 px-3">{formatCurrency(v.unit_price)}</td>
                    <td className="py-3 px-3 font-semibold">{formatCurrency(v.total)}</td>
                    <td className="py-3 px-3">{v.delivery_days ? `${v.delivery_days} days` : "—"}</td>
                    <td className="py-3 px-3">
                      {user?.role === "procurement_officer" && (
                        <Button size="sm" onClick={() => setSelectModal({ quotation_id: v.quotation_id, vendor_name: v.vendor_name })}>Shortlist</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Modal open={!!selectModal} onClose={() => setSelectModal(null)} title="Shortlist Vendor">
        <p className="text-sm text-muted mb-4">Shortlist <strong>{selectModal?.vendor_name}</strong> for manager approval?</p>
        <Input label="Selection Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        <Button loading={selecting} className="w-full mt-4" onClick={handleSelect}>Confirm Shortlist</Button>
      </Modal>
    </PageTransition>
  );
}
