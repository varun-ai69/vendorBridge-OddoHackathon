"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface border border-[var(--border-strong)] text-foreground hover:bg-accent-muted",
  ghost: "text-muted hover:text-foreground hover:bg-accent-muted",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  icon: Icon,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon className="text-lg" />
      ) : null}
      {children}
    </motion.button>
  );
}
