"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoDocumentText, IoAdd } from "react-icons/io5";
import { getRfqs } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { RFQ_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default function RfqPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { loadRfqs(); }, [statusFilter]);

  const loadRfqs = () => {
    setLoading(true);
    getRfqs({ status: statusFilter || undefined, limit: 50 })
      .then((res) => setRfqs(res.rfqs || res || []))
      .catch(() => setRfqs([]))
      .finally(() => setLoading(false));
  };

  const columns = [
    { key: "rfq_number", label: "RFQ #", render: (r) => <span className="font-mono font-medium text-accent">{r.rfq_number}</span> },
    { key: "title", label: "Title" },
    { key: "status", label: "Status", render: (r) => {
      const s = RFQ_STATUSES[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "deadline", label: "Deadline", render: (r) => formatDate(r.deadline) },
    { key: "vendor_count", label: "Vendors", render: (r) => r.vendor_count || r.vendors_count || "—" },
    { key: "quotation_count", label: "Quotes", render: (r) => r.quotation_count || r.quotations_count || "—" },
    { key: "created_at", label: "Created", render: (r) => formatDate(r.created_at) },
    { key: "actions", label: "", render: (r) => (
      <div className="flex gap-2">
        <Link href={`/rfq/${r.id || r.rfq_id}`}><Button variant="ghost" size="sm">View</Button></Link>
        {(r.quotation_count > 0 || r.quotations_count > 0) && user?.role === "procurement_officer" && (
          <Link href={`/rfq/${r.id || r.rfq_id}/compare`}><Button variant="secondary" size="sm">Compare</Button></Link>
        )}
      </div>
    )},
  ];

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">RFQs</h1>
          <p className="text-sm text-muted mt-1">Request for Quotation management</p>
        </div>
        <div className="flex gap-3">
          <select className="rounded-lg border border-[var(--border-strong)] bg-surface px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.entries(RFQ_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {user?.role === "procurement_officer" && (
            <Link href="/rfq/create"><Button icon={IoAdd}>Create RFQ</Button></Link>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rfqs}
        loading={loading}
        emptyIcon={IoDocumentText}
        emptyTitle="No RFQs yet"
        emptyDescription="Create your first RFQ to start the procurement process."
        emptyAction={user?.role === "procurement_officer" && <Link href="/rfq/create"><Button icon={IoAdd}>Create RFQ</Button></Link>}
        onRowClick={(r) => router.push(`/rfq/${r.id || r.rfq_id}`)}
        keyField="rfq_id"
      />
    </PageTransition>
  );
}
