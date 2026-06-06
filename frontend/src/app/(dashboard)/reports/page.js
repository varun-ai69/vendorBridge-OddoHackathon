"use client";

import { useEffect, useState } from "react";
import { IoBarChart, IoDownload } from "react-icons/io5";
import { getProcurementSummary, getSpendTrend, getVendorPerformance } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { SpendChart } from "@/components/dashboard/DashboardCharts";
import { formatCurrency } from "@/lib/format";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [vendors, setVendors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProcurementSummary({ date_from: "2026-01-01", date_to: "2026-12-31" }).catch(() => null),
      getSpendTrend({ year: 2026 }).catch(() => null),
      getVendorPerformance().catch(() => null),
    ]).then(([s, t, v]) => {
      setSummary(s);
      setTrend(t);
      setVendors(v);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted mt-1">Procurement insights and performance metrics</p>
        </div>
        <Button variant="secondary" icon={IoDownload}>Export</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "RFQs Created", value: summary.total_rfqs_created },
            { label: "Quotations", value: summary.total_quotations_received },
            { label: "POs Generated", value: summary.total_pos_generated },
            { label: "Total Spend", value: formatCurrency(summary.total_spend) },
          ].map((stat) => (
            <Card key={stat.label} className="!p-4">
              <p className="text-xs text-muted uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold mt-1">{stat.value ?? "—"}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Monthly Spend Trend</h3>
          {trend?.monthly_trend?.length ? (
            <SpendChart data={trend.monthly_trend} />
          ) : (
            <div className="flex flex-col items-center py-12 text-muted">
              <IoBarChart className="text-4xl mb-2 opacity-40" />
              <p className="text-sm">No trend data available</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Top Vendors</h3>
          {(vendors?.vendors || summary?.top_vendors || []).length > 0 ? (
            <div className="space-y-3">
              {(vendors?.vendors || summary?.top_vendors || []).slice(0, 5).map((v, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                  <div>
                    <p className="font-medium text-sm">{v.vendor_name}</p>
                    <p className="text-xs text-muted">{v.total_orders || v.total_rfqs_received} orders</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(v.total_value || v.total_value_awarded)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-12">No vendor data yet</p>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
