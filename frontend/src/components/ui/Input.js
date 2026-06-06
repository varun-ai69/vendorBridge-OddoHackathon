"use client";

import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className, containerClassName, ...props },
  ref
) {
  return (
    <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-foreground/80">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none" />
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full rounded-lg border border-[var(--border-strong)] bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
            Icon && "pl-10",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});

export default Input;
