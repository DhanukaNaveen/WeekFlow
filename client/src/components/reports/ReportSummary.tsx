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
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {report.user?.name} · {report.project?.name}
            </p>
            <h2 className="text-xl font-bold">
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
            className="mr-3 mt-2 inline-block text-sm text-blue-600"
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
          <h3 className="section-title mb-3">{title}</h3>
          {!items?.length ? (
            <p className="text-sm text-slate-400">None reported</p>
          ) : (
            <div className="space-y-2">
              {items.map((x: any, i: number) => (
                <div key={x.id || i} className="rounded-lg bg-slate-50 p-3">
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
