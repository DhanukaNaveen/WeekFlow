import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { api, errorMessage } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { StatusBadge } from "../../components/common/StatusBadge";
export function Dashboard() {
  const { user } = useAuth();
  return user?.role === "TEAM_MEMBER" ? (
    <MemberDashboard />
  ) : (
    <ManagerDashboard />
  );
}
function MemberDashboard() {
  const [d, setD] = useState<any>(),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/dashboard/member")
      .then((r) => setD(r.data))
      .catch((e) => setErr(errorMessage(e)));
  }, []);
  if (err) return <ErrorBox message={err} />;
  if (!d) return <Loading />;
  const currentEditable = ["DRAFT", "NEEDS_CORRECTION"].includes(
    d.current?.status,
  );
  const currentAction = d.current
    ? {
        label: currentEditable ? "Continue report" : "View report",
        to: currentEditable
          ? `/reports/${d.current.id}/edit`
          : `/reports/${d.current.id}`,
      }
    : { label: "Create report", to: "/reports/new" };
  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="page-title">My weekly overview</h1>
          <p className="text-slate-500">
            Stay on top of submissions and feedback.
          </p>
        </div>
      </div>
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Current week report</p>
          <p className="mt-1 font-semibold">
            {d.current?.project.name ?? "No report started"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {d.current ? (
            <StatusBadge status={d.current.status} />
          ) : (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
              NOT STARTED
            </span>
          )}
          <Link
            to={currentAction.to}
            state={{ fromDashboard: true }}
            className="btn-primary"
          >
            {currentAction.label}
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Pending approval", d.summary.pendingApproval],
          ["Needs attention", d.summary.needsAttention],
        ].map((x) => (
          <div className="card" key={x[0]}>
            <p className="text-sm text-slate-500">{x[0]}</p>
            <p className="mt-2 text-3xl font-bold">{x[1]}</p>
          </div>
        ))}
      </div>
      {d.current?.status === "NEEDS_CORRECTION" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <b>Manager feedback:</b> {d.current.reviews[0]?.comment}
          <Link
            className="ml-3 text-blue-700 underline"
            to={`/reports/${d.current.id}/edit`}
          >
            Update report
          </Link>
        </div>
      )}
      <h2 className="section-title">Recent reports</h2>
      {!d.recent.length ? (
        <Empty />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Project</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {d.recent.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.weekStartDate.slice(0, 10)}</td>
                  <td>{r.project.name}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <Link
                      className="text-blue-600"
                      to={`/reports/${r.id}`}
                      state={{ fromDashboard: true }}
                    >
                      View
                    </Link>
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
const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];
function ManagerDashboard() {
  const [d, setD] = useState<any>(),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/dashboard/manager")
      .then((r) => setD(r.data))
      .catch((e) => setErr(errorMessage(e)));
  }, []);
  if (err) return <ErrorBox message={err} />;
  if (!d) return <Loading />;
  const cards = [
    {
      label: "Reports submitted this week",
      value: d.summary.submittedThisWeek,
      help: "Submission date is within this Monday–Sunday.",
    },
    {
      label: "Current-week compliance",
      value: `${d.summary.complianceRate}%`,
      help: "Active members who submitted this week's report.",
    },
    {
      label: "Members pending",
      value: d.summary.pending,
      help: "Active members yet to submit this week's report.",
    },
    {
      label: "Current-week approved",
      value: d.summary.approved,
      help: "This week's reports with Approved status.",
    },
    {
      label: "Current-week corrections",
      value: d.summary.needsCorrection,
      help: "This week's reports that need correction.",
    },
    {
      label: "Current-week open blockers",
      value: d.summary.openBlockers,
      help: "Open blocker entries in this week's reports.",
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Team dashboard</h1>
        <p className="text-slate-500">
          Current-week reporting health and workload insights.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <div className="card" key={card.label}>
            <p className="text-xs font-medium text-slate-600">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {card.help}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Chart
          title="Completed tasks trend (all time)"
          description="Completed task entries grouped by report week."
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d.taskTrend}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Report status by member (all time)"
          description="Non-draft reports grouped by member and current status."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.statusByMember}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#10b981" />
              <Bar dataKey="submitted" fill="#2563eb" />
              <Bar dataKey="correction" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Task distribution by project (all time)"
          description="All task entries in non-draft reports, grouped by project."
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={d.workloadByProject}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {d.workloadByProject.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Time by work type (all time)"
          description="Total reported hours grouped by work type."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={d.timeByWorkType}
              layout="vertical"
              margin={{ left: 15 }}
            >
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={125}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Submission / compliance overview (current week)"
          description="Active members with or without a submitted current-week report."
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={d.submissionOverview}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {d.submissionOverview.map((_: any, i: number) => (
                  <Cell key={i} fill={["#2563eb", "#e11d48"][i % 2]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Chart>
      </div>
      <div className="card">
        <h2 className="section-title mb-4">Recent activity</h2>
        {!d.recentActivity.length ? (
          <p className="text-sm text-slate-400">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {d.recentActivity.map((a: any) => (
              <div
                key={a.id}
                className="flex justify-between border-b pb-3 text-sm last:border-0"
              >
                <span>{a.description}</span>
                <time className="text-slate-400">
                  {new Date(a.createdAt).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function Chart({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-5">
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
