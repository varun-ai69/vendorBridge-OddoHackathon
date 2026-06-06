"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

export default function Card({
  children,
  className,
  hover = false,
  glass = false,
  delay = 0,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "rounded-xl p-5",
        glass ? "glass-card" : "bg-surface border border-[var(--border)] shadow-[var(--shadow-sm)]",
        hover && "depth-hover cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, delay = 0 }) {
  return (
    <Card delay={delay} hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-medium">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
          {trend && (
            <p className={clsx("mt-2 text-xs font-medium", trend.positive ? "text-success" : "text-danger")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icon className="text-xl" />
          </div>
        )}
      </div>
    </Card>
  );
}
