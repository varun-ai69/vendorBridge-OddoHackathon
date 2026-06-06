"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardShell({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center page-gradient">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen page-gradient">
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden",
          mobileOpen ? "block" : "hidden"
        )}
        onClick={() => setMobileOpen(false)}
      />
      <div className={clsx("lg:block", mobileOpen ? "block" : "hidden lg:block")}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <div
        className={clsx(
          "transition-all duration-300",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[var(--sidebar-width)]"
        )}
      >
        <Header
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          sidebarCollapsed={collapsed}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
