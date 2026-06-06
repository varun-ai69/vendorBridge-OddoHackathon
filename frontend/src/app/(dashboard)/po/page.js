"use client";

import { useEffect, useState } from "react";
import { IoCube } from "react-icons/io5";
import { getPos } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { PO_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export default function PoPage() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPos({ limit: 50 }).then((res) => setPos(res.purchase_orders || res.pos || res || [])).catch(() => setPos([])).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "po_number", label: "PO #", render: (r) => <span className="font-mono font-medium text-accent">{r.po_number}</span> },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", render: (r) => formatCurrency(r.total_amount || r.grand_total) },
    { key: "status", label: "Status", render: (r) => {
      const s = PO_STATUSES[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "expected_delivery_date", label: "Delivery", render: (r) => formatDate(r.expected_delivery_date) },
    { key: "created_at", label: "Created", render: (r) => formatDate(r.created_at) },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <p className="text-sm text-muted mt-1">Track all generated purchase orders</p>
      </div>
      <DataTable columns={columns} data={pos} loading={loading} emptyIcon={IoCube} emptyTitle="No purchase orders" emptyDescription="POs are generated after manager approval." keyField="po_id" />
    </PageTransition>
  );
}
