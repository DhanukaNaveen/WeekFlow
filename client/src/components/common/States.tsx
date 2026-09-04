import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
export const Loading = () => (
  <div
    aria-live="polite"
    className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500"
  >
    <LoaderCircle className="animate-spin text-blue-600" />
    <p className="text-sm font-medium">Loading…</p>
  </div>
);
export const Empty = ({
  message = "Nothing to show yet.",
}: {
  message?: string;
}) => (
  <div className="card flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center text-slate-500">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <Inbox />
    </span>
    <p className="max-w-md text-sm leading-6">{message}</p>
  </div>
);
export const ErrorBox = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
  >
    <AlertCircle className="mt-0.5 shrink-0" size={18} />
    <span>{message}</span>
  </div>
);
