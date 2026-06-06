"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoTime } from "react-icons/io5";
import { getActivityLogs } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!["admin", "manager"].includes(user?.role)) { router.replace("/dashboard"); return; }
    getActivityLogs({ limit: 50 })
      .then((res) => setLogs(res.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-sm text-muted mt-1">Audit trail of all system actions</p>
      </div>

      {!logs.length ? (
        <EmptyState icon={IoTime} title="No activity yet" description="System actions will be logged here for auditing." />
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border)]" />
          <div className="space-y-4">
            {logs.map((log, i) => (
              <Card key={log.log_id || i} delay={i * 0.03} className="!p-4 ml-10 relative">
                <div className="absolute -left-[30px] top-5 h-3 w-3 rounded-full bg-accent border-2 border-background" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{log.description}</p>
                    <p className="text-xs text-muted mt-1">
                      {log.performed_by} · {log.entity_ref}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge color="slate">{log.entity_type}</Badge>
                    <p className="text-xs text-muted mt-1">{formatDateTime(log.timestamp)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
