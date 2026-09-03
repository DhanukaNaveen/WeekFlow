import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { StatusBadge } from "../../components/common/StatusBadge";
import type { Project, Report, User } from "../../types";
import { formatTimestamp } from "../../utils/dates";
export function ReportList() {
  const { user } = useAuth(),
    manager = user?.role !== "TEAM_MEMBER";
  const [items, setItems] = useState<Report[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [users, setUsers] = useState<User[]>([]),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState(""),
    [page, setPage] = useState(1),
    [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    }),
    [filters, setFilters] = useState({
      status: "",
      projectId: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== ""),
    );
    api
      .get(manager ? "/reports" : "/reports/my", {
        params: { ...activeFilters, page, limit: 10 },
      })
      .then((r) => {
        setItems(r.data.items);
        setPagination(r.data.pagination);
      })
      .catch((e) => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [filters, manager, page]);
  function changeFilter(name: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }
  useEffect(() => {
    api
      .get("/projects")
      .then((r) => setProjects(r.data))
      .catch((error) => setErr(errorMessage(error)));
    if (manager)
      api
        .get("/users")
        .then((r) => setUsers(r.data))
        .catch((error) => setErr(errorMessage(error)));
  }, [manager]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title">
            {manager ? "Team reports" : "My reports"}
          </h1>
          <p className="text-slate-500">
            Filter and review weekly submissions.
          </p>
        </div>
        {!manager && (
          <Link to="/reports/new" className="btn-primary">
            New report
          </Link>
        )}
      </div>
      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={filters.status}
          onChange={(e) => changeFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {[
            "DRAFT",
            "SUBMITTED",
            "NEEDS_CORRECTION",
            "APPROVED",
            ...(manager ? ["NOT_STARTED"] : []),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          value={filters.projectId}
          onChange={(e) => changeFilter("projectId", e.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {manager && (
          <select
            value={filters.userId}
            onChange={(e) => changeFilter("userId", e.target.value)}
          >
            <option value="">All members</option>
            {users
              .filter((u) => u.role === "TEAM_MEMBER")
              .map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        )}
        <input
          aria-label="From"
          type="date"
          value={filters.startDate}
          onChange={(e) => changeFilter("startDate", e.target.value)}
        />
        <input
          aria-label="To"
          type="date"
          value={filters.endDate}
          onChange={(e) => changeFilter("endDate", e.target.value)}
        />
      </div>
      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : !items.length ? (
        <Empty message="No reports match these filters." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {manager && <th>Member</th>}
                  <th>Week</th>
                  <th>Project</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    {manager && <td>{r.user.name}</td>}
                    <td>
                      {r.weekStartDate.slice(0, 10)} –{" "}
                      {r.weekEndDate.slice(0, 10)}
                    </td>
                    <td>{r.project.name}</td>
                    <td>
                      {r.submittedAt ? formatTimestamp(r.submittedAt) : "—"}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      {r.status !== "NOT_STARTED" && (
                        <Link
                          className="font-medium text-blue-600"
                          to={
                            manager && r.status === "SUBMITTED"
                              ? `/reports/${r.id}/review`
                              : `/reports/${r.id}`
                          }
                        >
                          {manager && r.status === "SUBMITTED"
                            ? "Review"
                            : "View"}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} reports
            </p>
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn-secondary"
                disabled={loading || page >= pagination.pages}
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
