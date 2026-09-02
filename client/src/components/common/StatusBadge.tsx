import type { Status } from "../../types";
const styles: Record<Status, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  NEEDS_CORRECTION: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-700",
  NOT_STARTED: "bg-rose-100 text-rose-700",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
