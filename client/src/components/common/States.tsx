import { LoaderCircle, Inbox } from "lucide-react";
export const Loading = () => (
  <div className="flex justify-center p-12 text-slate-500">
    <LoaderCircle className="animate-spin" />
  </div>
);
export const Empty = ({
  message = "Nothing to show yet.",
}: {
  message?: string;
}) => (
  <div className="card flex flex-col items-center gap-2 py-12 text-slate-500">
    <Inbox />
    <p>{message}</p>
  </div>
);
export const ErrorBox = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
    {message}
  </div>
);
