"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { getRfq } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { RFQ_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

export default function RfqDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRfq(id).then(setRfq).catch(() => router.push("/rfq")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!rfq) return null;

  const status = RFQ_STATUSES[rfq.status] || { label: rfq.status, color: "slate" };

  return (
    <PageTransition>
      <Link href="/rfq" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4">
        <IoArrowBack /> Back to RFQs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{rfq.title}</h1>
            <Badge color={status.color}>{status.label}</Badge>
          </div>
          <p className="font-mono text-sm text-accent mt-1">{rfq.rfq_number}</p>
        </div>
        <div className="flex gap-2">
          {user?.role === "procurement_officer" && (
            <Link href={`/rfq/${id}/compare`}><Button variant="secondary">Compare Quotations</Button></Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Description</h3>
          <p className="text-sm text-muted leading-relaxed">{rfq.description || "No description"}</p>

          <h3 className="font-semibold mt-6 mb-3">Line Items</h3>
          <div className="space-y-3">
            {(rfq.items || []).map((item, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted mt-1">{item.description}</p>
                <p className="text-sm mt-2">Qty: <span className="font-medium">{item.quantity} {item.unit}</span></p>
                {item.specifications && <p className="text-xs text-muted mt-1">Spec: {item.specifications}</p>}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Deadline</dt><dd className="font-medium">{formatDateTime(rfq.deadline)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{rfq.delivery_location || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Created</dt><dd>{formatDate(rfq.created_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Vendors</dt><dd>{rfq.vendor_count || rfq.vendors?.length || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Quotations</dt><dd>{rfq.quotation_count || "—"}</dd></div>
            </dl>
          </Card>

          {rfq.vendors?.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-3">Invited Vendors</h3>
              <ul className="space-y-2">
                {rfq.vendors.map((v) => (
                  <li key={v.id || v.vendor_id} className="text-sm">{v.company_name || v.vendor_name}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
