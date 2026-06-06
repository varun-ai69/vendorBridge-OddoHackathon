"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import {
  IoShield, IoCart, IoCheckmarkCircle, IoStorefront,
} from "react-icons/io5";
import { LOGIN_ROLES } from "@/lib/testUsers";

const ROLE_ICONS = {
  admin: IoShield,
  procurement_officer: IoCart,
  manager: IoCheckmarkCircle,
  vendor: IoStorefront,
};

export default function RoleSelector({ value, onChange, layout = "grid" }) {
  return (
    <div className={clsx(
      layout === "grid"
        ? "grid grid-cols-2 gap-2"
        : "flex flex-col gap-2"
    )}>
      {LOGIN_ROLES.map((role) => {
        const Icon = ROLE_ICONS[role.value];
        const selected = value === role.value;
        return (
          <motion.button
            key={role.value}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(role.value)}
            className={clsx(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
              selected
                ? "border-accent bg-accent-muted shadow-sm"
                : "border-[var(--border)] hover:border-accent/40 hover:bg-accent-muted/50"
            )}
          >
            <div className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              selected ? "bg-accent text-white" : "bg-accent-muted text-accent"
            )}>
              <Icon className="text-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{role.label}</p>
              <p className="text-[11px] text-muted mt-0.5 leading-snug">{role.description}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
