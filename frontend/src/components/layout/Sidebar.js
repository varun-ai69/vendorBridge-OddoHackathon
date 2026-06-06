"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { IoLogOut } from "react-icons/io5";
import Logo from "@/components/ui/Logo";
import NavIcon from "@/components/ui/NavIcon";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = NAV_ITEMS[user?.role] || [];

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border)] glass transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <Logo className="text-lg" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold tracking-tight">VendorBridge</p>
            <p className="text-[10px] text-muted">{ROLE_LABELS[user?.role]}</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative overflow-hidden",
                      active
                        ? "bg-accent text-white shadow-[0_4px_12px_-2px_rgba(180,83,9,0.25)]"
                        : "text-muted hover:bg-accent-muted hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r bg-white"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    <NavIcon name={item.icon} className={clsx("text-lg shrink-0", active && "pl-1")} />
                    {!collapsed && <span>{item.label}</span>}
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-danger dark:hover:bg-red-900/20"
        >
          <IoLogOut className="text-lg shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
