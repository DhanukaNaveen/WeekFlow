import type { Status } from "../../types";
const styles: Record<Status, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  NEEDS_CORRECTION: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NOT_STARTED: "border-rose-200 bg-rose-50 text-rose-700",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`status-pill ${styles[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
