"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { IoMenu, IoMoon, IoNotifications, IoSunny } from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import { getUnreadCount, isMockMode } from "@/utils/api";

export default function Header({ onMenuToggle, sidebarCollapsed }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setMounted(true);
    getUnreadCount()
      .then((res) => setUnread(res.unread_count || 0))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] glass px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-accent-muted hover:text-foreground lg:hidden"
        >
          <IoMenu className="text-xl" />
        </button>
        <div>
          <h1 className="text-sm font-semibold">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-xs text-muted">{user?.org_name || "VendorBridge ERP"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isMockMode() && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Demo Mode
          </span>
        )}
        {mounted && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-accent-muted hover:text-foreground"
          >
            {theme === "dark" ? <IoSunny className="text-lg" /> : <IoMoon className="text-lg" />}
          </motion.button>
        )}

        <Link href="/notifications">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative rounded-lg p-2 text-muted transition-colors hover:bg-accent-muted hover:text-foreground"
          >
            <IoNotifications className="text-lg" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </motion.div>
        </Link>

        <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
