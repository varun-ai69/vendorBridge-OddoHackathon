"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IoStorefront, IoDocumentText, IoCheckmarkCircle, IoCube, IoReceipt,
  IoPricetag, IoTrendingUp,
} from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAnalytics } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import { StatCard } from "@/components/ui/Card";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { SpendChart, CategoryChart, ApprovalTrendChart } from "@/components/dashboard/DashboardCharts";
import { formatCurrency, formatDate } from "@/lib/format";
import Badge from "@/components/ui/Badge";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) return;
    fetchAnalytics(user.role)
      .then(setData)
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  const role = user?.role;

  const adminStats = role === "admin" && [
    { title: "Total Vendors", value: data?.total_vendors ?? "—", icon: IoStorefront },
    { title: "Active RFQs", value: data?.active_rfqs ?? "—", icon: IoDocumentText },
    { title: "Pending Approvals", value: data?.pending_approvals ?? "—", icon: IoCheckmarkCircle },
    { title: "POs This Month", value: data?.total_pos_this_month ?? "—", icon: IoCube },
    { title: "Monthly Spend", value: formatCurrency(data?.total_spend_this_month), icon: IoTrendingUp },
    { title: "Pending Invoices", value: data?.total_invoices_pending ?? "—", icon: IoReceipt },
  ];

  const procurementStats = role === "procurement_officer" && [
    { title: "My Active RFQs", value: data?.my_active_rfqs ?? "—", icon: IoDocumentText },
    { title: "Pending Approvals", value: data?.my_pending_approvals ?? "—", icon: IoCheckmarkCircle },
    { title: "POs This Month", value: data?.my_pos_this_month ?? "—", icon: IoCube },
    { title: "Quotes Today", value: data?.quotations_received_today ?? "—", icon: IoPricetag },
  ];

  const managerStats = role === "manager" && [
    { title: "Pending Approvals", value: data?.pending_approvals ?? "—", icon: IoCheckmarkCircle },
    { title: "Approved This Month", value: data?.approved_this_month ?? "—", icon: IoTrendingUp },
    { title: "Rejected This Month", value: data?.rejected_this_month ?? "—", icon: IoDocumentText },
    { title: "Total Spend Approved", value: formatCurrency(data?.total_spend_approved), icon: IoReceipt },
  ];

  const vendorStats = role === "vendor" && [
    { title: "Active RFQs", value: data?.active_rfqs_received ?? "—", icon: IoDocumentText },
    { title: "Quotations Submitted", value: data?.quotations_submitted ?? "—", icon: IoPricetag },
    { title: "Quotations Accepted", value: data?.quotations_accepted ?? "—", icon: IoCheckmarkCircle },
    { title: "Active POs", value: data?.active_pos ?? "—", icon: IoCube },
    { title: "Pending Invoices", value: data?.pending_invoices ?? "—", icon: IoReceipt },
    { title: "Revenue This Month", value: formatCurrency(data?.total_revenue_this_month), icon: IoTrendingUp },
  ];

  const stats = adminStats || procurementStats || managerStats || vendorStats || [];

  const recentItems = data?.recent_rfqs || data?.recent_pos || [];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Overview of your procurement activities</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(data?.spend_by_category?.length > 0 || role === "admin") && (
          <Card delay={0.2}>
            <h3 className="font-semibold mb-4">Spend by Category</h3>
            <CategoryChart data={data?.spend_by_category || []} />
            {!data?.spend_by_category?.length && (
              <p className="text-center text-sm text-muted py-8">No spending data yet</p>
            )}
          </Card>
        )}

        {data?.approval_trend?.length > 0 && (
          <Card delay={0.25}>
            <h3 className="font-semibold mb-4">Approval Trend</h3>
            <ApprovalTrendChart data={data.approval_trend} />
          </Card>
        )}

        {data?.monthly_revenue?.length > 0 && (
          <Card delay={0.2}>
            <h3 className="font-semibold mb-4">Monthly Revenue</h3>
            <SpendChart data={data.monthly_revenue.map((m) => ({ month: m.month, total_spend: m.revenue }))} />
          </Card>
        )}
      </div>

      {recentItems.length > 0 && (
        <Card className="mt-6" delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Link href="/rfq" className="text-sm text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentItems.slice(0, 5).map((item) => (
              <div key={item.id || item.rfq_id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                <div>
                  <p className="font-medium text-sm">{item.title || item.rfq_number || item.po_number}</p>
                  <p className="text-xs text-muted">{formatDate(item.created_at)}</p>
                </div>
                {item.status && <Badge color="blue">{item.status}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageTransition>
  );
}
