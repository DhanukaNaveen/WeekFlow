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
import {
  AlertTriangle,
  CalendarCheck2,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  Gauge,
  UsersRound,
} from "lucide-react";
import { api, errorMessage } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { StatusBadge } from "../../components/common/StatusBadge";
import { MetricCard, PageHeader } from "../../components/common/Ui";
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
      <PageHeader
        description="Stay on top of your weekly submission and manager feedback."
        icon={CalendarCheck2}
        title="My weekly overview"
      />
      <div className="card overflow-hidden border-blue-100 bg-gradient-to-br from-white to-blue-50/60">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-700">
              Current week report
            </p>
            <p className="mt-1 truncate text-xl font-bold text-slate-950">
              {d.current?.project.name ?? "No report started"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Complete and submit your report before the week closes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={d.current?.status ?? "NOT_STARTED"} />
            <Link
              to={currentAction.to}
              state={{ fromDashboard: true }}
              className="btn-primary w-full sm:w-auto"
            >
              {!d.current && <FilePlus2 size={17} />}
              {currentAction.label}
            </Link>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          help="Submitted reports waiting for manager review."
          icon={Clock3}
          label="Pending approval"
          value={d.summary.pendingApproval}
        />
        <MetricCard
          help="Reports requiring corrections before approval."
          icon={AlertTriangle}
          label="Needs attention"
          tone="amber"
          value={d.summary.needsAttention}
        />
      </div>
      {d.current?.status === "NEEDS_CORRECTION" && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p>
            <b>Manager feedback:</b> {d.current.reviews[0]?.comment}
          </p>
          <Link
            className="shrink-0 font-semibold text-amber-800 underline decoration-amber-400 underline-offset-4"
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
      icon: ClipboardCheck,
      tone: "blue" as const,
      help: "Submission date is within this Monday–Sunday.",
    },
    {
      label: "Current-week compliance",
      value: `${d.summary.complianceRate}%`,
      icon: Gauge,
      tone: "violet" as const,
      help: "Active members who submitted this week's report.",
    },
    {
      label: "Members pending",
      value: d.summary.pending,
      icon: UsersRound,
      tone: "rose" as const,
      help: "Active members yet to submit this week's report.",
    },
    {
      label: "Current-week approved",
      value: d.summary.approved,
      icon: CheckCircle2,
      tone: "emerald" as const,
      help: "This week's reports with Approved status.",
    },
    {
      label: "Current-week corrections",
      value: d.summary.needsCorrection,
      icon: AlertTriangle,
      tone: "amber" as const,
      help: "This week's reports that need correction.",
    },
    {
      label: "Current-week open blockers",
      value: d.summary.openBlockers,
      icon: AlertTriangle,
      tone: "rose" as const,
      help: "Open blocker entries in this week's reports.",
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        description="Current-week reporting health and all-time workload insights."
        icon={ChartNoAxesCombined}
        title="Team dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <MetricCard
            help={card.help}
            icon={card.icon}
            key={card.label}
            label={card.label}
            tone={card.tone}
            value={card.value}
          />
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
                className="flex items-start gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                <span className="min-w-0 flex-1 text-slate-700">
                  {a.description}
                </span>
                <time className="shrink-0 text-xs text-slate-500 sm:text-sm">
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
    <div className="card min-w-0 overflow-hidden">
      <div className="mb-5">
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
