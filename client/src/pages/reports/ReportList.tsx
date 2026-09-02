import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { StatusBadge } from "../../components/common/StatusBadge";
import type { Project, Report, User } from "../../types";
export function ReportList() {
  const { user } = useAuth(),
    manager = user?.role !== "TEAM_MEMBER";
  const [items, setItems] = useState<Report[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [users, setUsers] = useState<User[]>([]),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState(""),
    [filters, setFilters] = useState({
      status: "",
      projectId: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
  const load = () => {
    setLoading(true);
    api
      .get(manager ? "/reports" : "/reports/my", { params: filters })
      .then((r) => setItems(r.data.items))
      .catch((e) => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data));
    if (manager) api.get("/users").then((r) => setUsers(r.data));
  }, [manager]);
  useEffect(load, [
    filters.status,
    filters.projectId,
    filters.userId,
    filters.startDate,
    filters.endDate,
  ]);
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
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {["DRAFT", "SUBMITTED", "NEEDS_CORRECTION", "APPROVED", ...(manager ? ["NOT_STARTED"] : [])].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          value={filters.projectId}
          onChange={(e) =>
            setFilters({ ...filters, projectId: e.target.value })
          }
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
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
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
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
        />
        <input
          aria-label="To"
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>
      {err ? (
        <ErrorBox message={err} />
      ) : loading ? (
        <Loading />
      ) : !items.length ? (
        <Empty message="No reports match these filters." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {manager && <th>Member</th>}
                <th>Week</th>
                <th>Project</th>
                <th>Updated</th>
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
                  <td>{new Date(r.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.status !== "NOT_STARTED" && <Link
                      className="font-medium text-blue-600"
                      to={
                        manager && r.status === "SUBMITTED"
                          ? `/reports/${r.id}/review`
                          : `/reports/${r.id}`
                      }
                    >
                      {manager && r.status === "SUBMITTED" ? "Review" : "View"}
                    </Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
