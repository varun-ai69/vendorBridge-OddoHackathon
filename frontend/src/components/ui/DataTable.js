"use client";

import clsx from "clsx";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  data,
  loading,
  emptyIcon,
  emptyTitle = "No data found",
  emptyDescription = "There are no items to display yet.",
  emptyAction,
  onRowClick,
  keyField = "id",
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-accent-muted/50">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row[keyField] || i}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                "border-b border-[var(--border)] transition-colors last:border-0",
                onRowClick && "cursor-pointer hover:bg-accent-muted/30"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
