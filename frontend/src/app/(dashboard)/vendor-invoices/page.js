"use client";

import { useEffect, useState } from "react";
import { IoReceipt } from "react-icons/io5";
import { getVendorInvoices } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { INVOICE_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVendorInvoices({ limit: 50 }).then((res) => setInvoices(res.invoices || res || [])).catch(() => setInvoices([])).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "invoice_number", label: "Invoice #", render: (r) => <span className="font-mono font-medium text-accent">{r.invoice_number}</span> },
    { key: "po_number", label: "PO" },
    { key: "grand_total", label: "Amount", render: (r) => formatCurrency(r.grand_total) },
    { key: "status", label: "Status", render: (r) => {
      const s = INVOICE_STATUSES[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "due_date", label: "Due", render: (r) => formatDate(r.due_date) },
    { key: "created_at", label: "Created", render: (r) => formatDate(r.created_at) },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Invoices</h1>
        <p className="text-sm text-muted mt-1">Track invoices and payment status</p>
      </div>
      <DataTable columns={columns} data={invoices} loading={loading} emptyIcon={IoReceipt} emptyTitle="No invoices" emptyDescription="Generate invoices after PO delivery." keyField="invoice_id" />
    </PageTransition>
  );
}
