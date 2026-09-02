import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";
import { ReportSummary } from "../../components/reports/ReportSummary";
import { ErrorBox, Loading } from "../../components/common/States";
import { useAuth } from "../../contexts/AuthContext";
import type { Report } from "../../types";
import { formatTimestamp } from "../../utils/dates";
export function ReportDetail({ reviewMode = false }: { reviewMode?: boolean }) {
  const { id } = useParams(),
    { user } = useAuth();
  const [r, setR] = useState<Report>(),
    [err, setErr] = useState(""),
    [comment, setComment] = useState(""),
    [selected, setSelected] = useState<any>(),
    [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    api
      .get(`/reports/${id}`)
      .then((response) => setR(response.data))
      .catch((error) => setErr(errorMessage(error)));
  }, [id]);
  async function action(kind: "approve" | "request-changes") {
    if (reviewing) return;
    setReviewing(true);
    try {
      const x = await api.post(`/reports/${id}/${kind}`, { comment });
      setR(x.data);
      toast.success(
        kind === "approve" ? "Report approved" : "Changes requested",
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setReviewing(false);
    }
  }
  if (err) return <ErrorBox message={err} />;
  if (!r) return <Loading />;
  const editable =
    user?.role === "TEAM_MEMBER" &&
    ["DRAFT", "NEEDS_CORRECTION"].includes(r.status);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="page-title">Weekly report</h1>
          <p className="text-slate-500">
            Current content, review history, and submitted versions.
          </p>
        </div>
        {editable && (
          <Link to={`/reports/${r.id}/edit`} className="btn-primary">
            Edit report
          </Link>
        )}
      </div>
      {r.status === "NEEDS_CORRECTION" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <b>Manager feedback:</b> {r.reviews[0]?.comment}
        </div>
      )}
      {selected && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Viewing immutable submitted version {selected.versionNumber} from{" "}
          {formatTimestamp(selected.submittedAt)}.
        </div>
      )}
      <ReportSummary report={r} version={selected} />
      {reviewMode && r.status === "SUBMITTED" && (
        <div className="card">
          <h2 className="section-title">Manager review</h2>
          <textarea
            className="mt-3"
            rows={3}
            placeholder="Required when requesting changes"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="mt-3 flex gap-3">
            <button
              className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              disabled={reviewing}
              onClick={() => action("approve")}
            >
              Approve
            </button>
            <button
              className="btn-primary bg-amber-600 hover:bg-amber-700"
              disabled={reviewing || !comment.trim()}
              onClick={() => action("request-changes")}
            >
              Request changes
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h2 className="section-title mb-4">Version history</h2>
          <button
            onClick={() => setSelected(undefined)}
            className="mb-2 block text-sm font-medium text-blue-600"
          >
            Current content
          </button>
          {!r.versions.length && (
            <p className="text-sm text-slate-400">No submitted versions yet.</p>
          )}
          {r.versions.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className={`mb-2 block w-full rounded-lg p-3 text-left text-sm ${selected?.id === v.id ? "bg-blue-100 ring-2 ring-blue-300" : "bg-slate-50 hover:bg-blue-50"}`}
            >
              <b>Version {v.versionNumber}</b>
              <span className="float-right text-slate-500">
                {formatTimestamp(v.submittedAt)}
              </span>
            </button>
          ))}
        </div>
        <div className="card">
          <h2 className="section-title mb-4">Review timeline</h2>
          {!r.reviews.length ? (
            <p className="text-sm text-slate-400">No reviews yet.</p>
          ) : (
            r.reviews.map((x) => (
              <div
                key={x.id}
                className="mb-3 border-l-2 border-blue-300 pl-3 text-sm"
              >
                <div className="font-semibold">
                  {x.reviewer.name} · {x.action.replace("_", " ")}
                </div>
                <p>{x.comment || "No comment"}</p>
                <p className="text-xs text-slate-400">
                  Version {x.version.versionNumber} ·{" "}
                  {formatTimestamp(x.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
