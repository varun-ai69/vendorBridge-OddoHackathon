"use client";

import { useEffect, useState } from "react";
import { IoNotifications } from "react-icons/io5";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/format";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    getNotifications({ limit: 50 })
      .then((res) => setNotifications(res.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  const markRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    load();
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted mt-1">Stay updated on procurement activities</p>
        </div>
        <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>
      </div>

      {!notifications.length ? (
        <EmptyState icon={IoNotifications} title="All caught up" description="No notifications at the moment." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <Card
              key={n.id}
              delay={i * 0.03}
              className={`!p-4 cursor-pointer ${!n.is_read ? "border-accent/30 bg-accent-muted/20" : ""}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                  <p className="text-sm text-muted mt-1">{n.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge color="blue">{n.type}</Badge>
                  <p className="text-xs text-muted mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
