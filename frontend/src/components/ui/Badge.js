import clsx from "clsx";

const colors = {
  slate: "bg-stone-100 text-stone-700 border border-stone-200/50 dark:bg-stone-900/30 dark:text-stone-300 dark:border-stone-800/40",
  blue: "bg-amber-50 text-amber-800 border border-amber-200/40 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/40 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30",
  amber: "bg-amber-50 text-amber-700 border border-amber-200/40 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
  red: "bg-red-50 text-red-700 border border-red-200/40 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
  cyan: "bg-orange-50/70 text-orange-700 border border-orange-200/40 dark:bg-orange-950/15 dark:text-orange-300 dark:border-orange-900/25",
  orange: "bg-orange-50 text-orange-700 border border-orange-200/40 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30",
};

export default function Badge({ children, color = "slate", className, showDot = true }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide border transition-all duration-200",
        colors[color],
        className
      )}
    >
      {showDot && (
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full shrink-0",
            color === "slate" && "bg-stone-400 dark:bg-stone-500",
            color === "blue" && "bg-amber-500 dark:bg-amber-400",
            color === "emerald" && "bg-emerald-500 dark:bg-emerald-400",
            color === "amber" && "bg-amber-500 dark:bg-amber-400",
            color === "red" && "bg-red-500 dark:bg-red-400",
            color === "cyan" && "bg-orange-500 dark:bg-orange-400",
            color === "orange" && "bg-orange-500 dark:bg-orange-400"
          )}
        />
      )}
      {children}
    </span>
  );
}
