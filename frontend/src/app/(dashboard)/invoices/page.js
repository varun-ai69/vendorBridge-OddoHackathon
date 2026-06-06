"use client";

import { useEffect, useState } from "react";
import { IoReceipt } from "react-icons/io5";
import { getInvoices, updateInvoiceStatus } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { INVOICE_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    getInvoices({ limit: 50 }).then((res) => setInvoices(res.invoices || res || [])).catch(() => setInvoices([])).finally(() => setLoading(false));
  };

  const markPaid = async (id) => {
    await updateInvoiceStatus(id, { status: "paid", payment_date: new Date().toISOString().split("T")[0] });
    load();
  };

  const canMarkPaid = ["admin", "procurement_officer"].includes(user?.role);

  const columns = [
    { key: "invoice_number", label: "Invoice #", render: (r) => <span className="font-mono font-medium text-accent">{r.invoice_number}</span> },
    { key: "vendor_name", label: "Vendor" },
    { key: "grand_total", label: "Amount", render: (r) => formatCurrency(r.grand_total || r.total_amount) },
    { key: "status", label: "Status", render: (r) => {
      const s = INVOICE_STATUSES[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "due_date", label: "Due", render: (r) => formatDate(r.due_date) },
    { key: "created_at", label: "Created", render: (r) => formatDate(r.created_at) },
    { key: "actions", label: "", render: (r) => canMarkPaid && r.status === "pending" && (
      <Button size="sm" variant="secondary" onClick={() => markPaid(r.id || r.invoice_id)}>Mark Paid</Button>
    )},
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-sm text-muted mt-1">Manage vendor invoices and payments</p>
      </div>
      <DataTable columns={columns} data={invoices} loading={loading} emptyIcon={IoReceipt} emptyTitle="No invoices" emptyDescription="Invoices appear after vendors deliver POs." keyField="invoice_id" />
    </PageTransition>
  );
}
