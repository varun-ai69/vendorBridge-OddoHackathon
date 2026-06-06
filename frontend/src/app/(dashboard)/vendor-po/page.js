"use client";

import { useEffect, useState } from "react";
import { IoCube } from "react-icons/io5";
import { getVendorPos, updatePoStatus } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { PO_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

const NEXT_STATUS = {
  generated: "acknowledged",
  acknowledged: "in_transit",
  in_transit: "delivered",
};

export default function VendorPoPage() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    getVendorPos({ limit: 50 }).then((res) => setPos(res.purchase_orders || res.pos || res || [])).catch(() => setPos([])).finally(() => setLoading(false));
  };

  const advanceStatus = async (poId, currentStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    await updatePoStatus(poId, { status: next });
    load();
  };

  const columns = [
    { key: "po_number", label: "PO #", render: (r) => <span className="font-mono font-medium text-accent">{r.po_number}</span> },
    { key: "org_name", label: "Organization" },
    { key: "total_amount", label: "Amount", render: (r) => formatCurrency(r.total_amount || r.grand_total) },
    { key: "status", label: "Status", render: (r) => {
      const s = PO_STATUSES[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "expected_delivery_date", label: "Delivery", render: (r) => formatDate(r.expected_delivery_date) },
    { key: "actions", label: "", render: (r) => NEXT_STATUS[r.status] && (
      <Button size="sm" variant="secondary" onClick={() => advanceStatus(r.id || r.po_id, r.status)}>
        Mark {PO_STATUSES[NEXT_STATUS[r.status]]?.label}
      </Button>
    )},
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <p className="text-sm text-muted mt-1">Manage received purchase orders</p>
      </div>
      <DataTable columns={columns} data={pos} loading={loading} emptyIcon={IoCube} emptyTitle="No purchase orders" emptyDescription="POs appear after your quotation is approved." keyField="po_id" />
    </PageTransition>
  );
}
