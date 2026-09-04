import type { Report } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { formatWeekRange } from "../../utils/dates";
export function ReportSummary({
  report,
  version,
}: {
  report: Report;
  version?: any;
}) {
  const data: any = version?.snapshot || report;
  const sections = [
    [
      "Tasks completed",
      data.tasks,
      (x: any) =>
        `${x.name} · ${x.status.replaceAll("_", " ")} · ${x.actualPercentage}% · ${x.actualTime}h`,
    ],
    ["Next week", data.nextWeekTasks, (x: any) => `${x.name} · ${x.priority}`],
    [
      "Blockers",
      data.blockers,
      (x: any) => `${x.isKeyIssue ? "★ " : ""}${x.title} · ${x.status}`,
    ],
    [
      "Achievements",
      data.achievements,
      (x: any) => `${x.isKeyAchievement ? "★ " : ""}${x.title}`,
    ],
    ["Hours", data.workHours, (x: any) => `${x.workType}: ${x.hours}h`],
  ] as const;
  return (
    <div className="space-y-5">
      <div className="card border-blue-100 bg-gradient-to-br from-white to-blue-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {report.user?.name} · {data.project?.name ?? report.project?.name}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {formatWeekRange(data.weekStartDate, data.weekEndDate)}
            </h2>
          </div>
          <StatusBadge status={report.status} />
        </div>
        {data.notes && (
          <p className="mt-4 whitespace-pre-wrap text-sm">{data.notes}</p>
        )}
        {data.links?.map((x: string) => (
          <a
            className="mr-3 mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
            href={x}
            target="_blank"
            key={x}
          >
            Reference link ↗
          </a>
        ))}
      </div>
      {sections.map(([title, items, render]) => (
        <div className="card" key={title}>
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="section-title">{title}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{items?.length || 0}</span></div>
          {!items?.length ? (
            <p className="text-sm text-slate-400">None reported</p>
          ) : (
            <div className="space-y-2">
              {items.map((x: any, i: number) => (
                <div key={x.id || i} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-medium">{render(x)}</p>
                  {x.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {x.description}
                    </p>
                  )}
                  {x.deliverable && (
                    <p className="mt-1 text-sm text-slate-600">
                      Deliverable: {x.deliverable}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
