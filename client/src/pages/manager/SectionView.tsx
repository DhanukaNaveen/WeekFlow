import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Star } from "lucide-react";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { formatWeekRange } from "../../utils/dates";

export function SectionView() {
  const restored = useLocation().state?.sectionView;
  const [section, setSection] = useState<"BLOCKERS" | "ACHIEVEMENTS">(
      restored?.section ?? "BLOCKERS",
    ),
    [week, setWeek] = useState<string>(restored?.week ?? ""),
    [rows, setRows] = useState<any[]>(),
    [page, setPage] = useState<number>(restored?.page ?? 1),
    [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    }),
    [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    setRows(undefined);
    setErr("");
    api
      .get("/dashboard/section-view", {
        params: { section, week: week || undefined, page, limit: 10 },
      })
      .then((response) => {
        if (!active) return;
        setRows(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        if (active) setErr(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [section, week, page]);

  function changeSection(value: "BLOCKERS" | "ACHIEVEMENTS") {
    setPage(1);
    setSection(value);
  }

  function changeWeek(value: string) {
    setPage(1);
    setWeek(value);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Cross-team section view</h1>
        <p className="text-slate-500">
          Review complete blocker and achievement details across the team.
        </p>
      </div>
      <div className="card flex flex-wrap gap-4">
        <label>
          Section
          <select
            value={section}
            onChange={(event) =>
              changeSection(
                event.target.value as "BLOCKERS" | "ACHIEVEMENTS",
              )
            }
          >
            <option>BLOCKERS</option>
            <option>ACHIEVEMENTS</option>
          </select>
        </label>
        <label>
          Week start
          <input
            type="date"
            value={week}
            onChange={(event) => changeWeek(event.target.value)}
          />
        </label>
      </div>
      {err ? (
        <ErrorBox message={err} />
      ) : !rows ? (
        <Loading />
      ) : !rows.length ? (
        <Empty
          message={`No ${section.toLowerCase()} were reported for this selection.`}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Project</th>
                  <th>Report week</th>
                  <th>Title</th>
                  <th>Description</th>
                  {section === "BLOCKERS" && <th>Status</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.flatMap((report) =>
                  report.entries.map((item: any, index: number) => (
                    <tr key={item.id}>
                      {index === 0 && (
                        <>
                          <td rowSpan={report.entries.length} className="align-top">
                            {report.user.name}
                          </td>
                          <td rowSpan={report.entries.length} className="align-top">
                            {report.project.name}
                          </td>
                          <td rowSpan={report.entries.length} className="align-top">
                            {formatWeekRange(
                              report.weekStartDate,
                              report.weekEndDate,
                            )}
                          </td>
                        </>
                      )}
                      <td className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          {item.title}
                          {item.isKey && (
                            <Star
                              aria-label="Key item"
                              className="fill-amber-400 text-amber-500"
                              size={17}
                            />
                          )}
                        </span>
                      </td>
                      <td className="max-w-sm whitespace-pre-wrap">
                        {item.description || "—"}
                      </td>
                      {section === "BLOCKERS" && (
                        <td>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "OPEN" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      )}
                      {index === 0 && (
                        <td rowSpan={report.entries.length} className="align-top">
                          <Link
                            className="font-medium text-blue-600"
                            to={`/reports/${report.id}`}
                            state={{
                              fromSectionView: {
                                section,
                                week,
                                page,
                              },
                            }}
                          >
                            View report
                          </Link>
                        </td>
                      )}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )}{" "}
              of {pagination.total} reports
            </p>
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
