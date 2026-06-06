"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoDocumentText } from "react-icons/io5";
import { getVendorRfqs } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

const VENDOR_RFQ_STATUS = {
  pending: { label: "Pending", color: "amber" },
  quoted: { label: "Quoted", color: "blue" },
  closed: { label: "Closed", color: "slate" },
  awarded: { label: "Awarded", color: "emerald" },
};

export default function VendorRfqsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "vendor") { router.replace("/dashboard"); return; }
    getVendorRfqs({ limit: 50 }).then((res) => setRfqs(res.rfqs || res || [])).catch(() => setRfqs([])).finally(() => setLoading(false));
  }, [user]);

  const columns = [
    { key: "rfq_number", label: "RFQ #", render: (r) => <span className="font-mono font-medium text-accent">{r.rfq_number}</span> },
    { key: "title", label: "Title" },
    { key: "status", label: "Status", render: (r) => {
      const s = VENDOR_RFQ_STATUS[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "deadline", label: "Deadline", render: (r) => formatDate(r.deadline) },
    { key: "org_name", label: "Organization", render: (r) => r.org_name || "—" },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Received RFQs</h1>
        <p className="text-sm text-muted mt-1">RFQs sent to you for quotation</p>
      </div>
      <DataTable columns={columns} data={rfqs} loading={loading} emptyIcon={IoDocumentText} emptyTitle="No RFQs received" emptyDescription="You'll see RFQs here when organizations invite you." onRowClick={(r) => router.push(`/vendor-rfqs/${r.id || r.rfq_id}`)} keyField="rfq_id" />
    </PageTransition>
  );
}
