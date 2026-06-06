"use client";

import { useEffect, useState } from "react";
import { IoPricetag } from "react-icons/io5";
import { getVendorQuotations } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

const QUOTE_STATUS = {
  submitted: { label: "Submitted", color: "blue" },
  under_review: { label: "Under Review", color: "amber" },
  shortlisted: { label: "Shortlisted", color: "cyan" },
  rejected: { label: "Rejected", color: "red" },
  accepted: { label: "Accepted", color: "emerald" },
};

export default function VendorQuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVendorQuotations({ limit: 50 }).then((res) => setQuotations(res.quotations || res || [])).catch(() => setQuotations([])).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "quotation_number", label: "Quote #", render: (r) => <span className="font-mono font-medium text-accent">{r.quotation_number}</span> },
    { key: "rfq_number", label: "RFQ" },
    { key: "total_amount", label: "Amount", render: (r) => formatCurrency(r.total_amount) },
    { key: "status", label: "Status", render: (r) => {
      const s = QUOTE_STATUS[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "created_at", label: "Submitted", render: (r) => formatDate(r.created_at) },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Quotations</h1>
        <p className="text-sm text-muted mt-1">Track your submitted quotations</p>
      </div>
      <DataTable columns={columns} data={quotations} loading={loading} emptyIcon={IoPricetag} emptyTitle="No quotations" emptyDescription="Submit quotations on received RFQs." keyField="quotation_id" />
    </PageTransition>
  );
}
