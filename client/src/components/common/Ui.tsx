import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Icon size={20} aria-hidden="true" />
            </span>
          )}
          <h1 className="page-title">{title}</h1>
        </div>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const metricTones = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

export function MetricCard({
  label,
  value,
  help,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  help?: string;
  icon?: LucideIcon;
  tone?: keyof typeof metricTones;
}) {
  return (
    <div className="card min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-5 text-slate-600">{label}</p>
        {Icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${metricTones[tone]}`}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      {help && <p className="mt-2 text-sm leading-5 text-slate-500">{help}</p>}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  };
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-sm ${sizes[size]}`}
    >
      {initials || "?"}
    </span>
  );
}

export function Pagination({
  page,
  limit,
  total,
  pages,
  onPageChange,
  disabled = false,
  itemLabel = "items",
}: {
  page: number;
  limit: number;
  total: number;
  pages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
}) {
  if (!total) return null;
  const safePages = Math.max(1, pages);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
        {total} {itemLabel}
      </p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <button
          className="btn-secondary"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <span className="whitespace-nowrap text-sm font-medium text-slate-600">
          Page {page} of {safePages}
        </span>
        <button
          className="btn-secondary"
          disabled={disabled || page >= safePages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950" id="dialog-title">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            aria-label="Close dialog"
            className="icon-btn -mr-1 -mt-1"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
