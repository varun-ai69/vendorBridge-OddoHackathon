"use client";

import { useEffect, useState } from "react";
import { IoCheckmarkCircle } from "react-icons/io5";
import { getApprovals, approvalAction } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { APPROVAL_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionModal, setActionModal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => { load(); }, [filter]);

  const load = () => {
    setLoading(true);
    getApprovals({ status: filter || undefined, limit: 50 })
      .then((res) => setApprovals(res.approvals || []))
      .catch(() => setApprovals([]))
      .finally(() => setLoading(false));
  };

  const handleAction = async (action) => {
    if (!actionModal) return;
    setActing(true);
    try {
      await approvalAction(actionModal.approval_id, action, remarks);
      setActionModal(null);
      setRemarks("");
      load();
    } catch { /* */ }
    finally { setActing(false); }
  };

  const columns = [
    { key: "rfq_number", label: "RFQ", render: (r) => <span className="font-mono text-accent">{r.rfq_number}</span> },
    { key: "rfq_title", label: "Title" },
    { key: "selected_vendor", label: "Vendor" },
    { key: "quotation_amount", label: "Amount", render: (r) => formatCurrency(r.quotation_amount) },
    { key: "requested_by", label: "Requested By" },
    { key: "status", label: "Status", render: (r) => {
      const s = APPROVAL_STATUSES[r.status] || { label: r.status, color: "slate" };
      return <Badge color={s.color}>{s.label}</Badge>;
    }},
    { key: "requested_at", label: "Date", render: (r) => formatDateTime(r.requested_at) },
    { key: "actions", label: "", render: (r) => r.status === "pending" && user?.role === "manager" && (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setActionModal({ ...r, action: "approved" })}>Approve</Button>
        <Button size="sm" variant="danger" onClick={() => setActionModal({ ...r, action: "rejected" })}>Reject</Button>
      </div>
    )},
  ];

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-sm text-muted mt-1">Review and approve procurement requests</p>
        </div>
        <select className="rounded-lg border border-[var(--border-strong)] bg-surface px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          {Object.entries(APPROVAL_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={approvals} loading={loading} emptyIcon={IoCheckmarkCircle} emptyTitle="No approvals" emptyDescription="Approval requests will appear here when quotations are shortlisted." />

      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={actionModal?.action === "approved" ? "Approve Request" : "Reject Request"}>
        <p className="text-sm text-muted mb-4">
          {actionModal?.rfq_number} — {actionModal?.selected_vendor} ({formatCurrency(actionModal?.quotation_amount)})
        </p>
        <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        <Button
          loading={acting}
          variant={actionModal?.action === "rejected" ? "danger" : "primary"}
          className="w-full mt-4"
          onClick={() => handleAction(actionModal?.action)}
        >
          Confirm {actionModal?.action === "approved" ? "Approval" : "Rejection"}
        </Button>
      </Modal>
    </PageTransition>
  );
}
