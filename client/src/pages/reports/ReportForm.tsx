import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { api, errorMessage } from "../../api/client";
import { ErrorBox, Loading } from "../../components/common/States";
import type { Project } from "../../types";
import { addDateDays, currentWeekStart } from "../../utils/dates";
const weekStart = currentWeekStart();
const currentWeekEnd = addDateDays(weekStart, 6);
const blank = {
  projectId: "",
  weekStartDate: weekStart,
  weekEndDate: addDateDays(weekStart, 6),
  notes: "",
  links: [],
  tasks: [
    {
      name: "",
      priority: "MEDIUM",
      plannedPercentage: 100,
      actualPercentage: 0,
      status: "IN_PROGRESS",
      plannedTime: 0,
      actualTime: 0,
      deliverable: "",
    },
  ],
  nextWeekTasks: [],
  blockers: [],
  achievements: [],
  workHours: [],
};
export function ReportForm() {
  const { id } = useParams(),
    nav = useNavigate();
  const [data, setData] = useState<any>(blank),
    [projects, setProjects] = useState<Project[]>([]),
    [loading, setLoading] = useState(!!id),
    [saving, setSaving] = useState(false),
    [err, setErr] = useState(""),
    [validationErrors, setValidationErrors] = useState<string[]>([]);
  useEffect(() => {
    async function loadForm() {
      try {
        const [projectResponse, reportResponse] = await Promise.all([
          api.get("/projects"),
          id ? api.get(`/reports/${id}`) : Promise.resolve(null),
        ]);
        const availableProjects: Project[] = projectResponse.data;
        if (reportResponse) {
          const d = reportResponse.data;
          if (!["DRAFT", "NEEDS_CORRECTION"].includes(d.status)) {
            toast.error("This report is read-only in its current status.");
            nav(`/reports/${id}`, { replace: true });
            return;
          }
          setData({
            ...d,
            weekStartDate: d.weekStartDate.slice(0, 10),
            weekEndDate: d.weekEndDate.slice(0, 10),
            links: d.links,
          });
          if (!availableProjects.some((project) => project.id === d.project.id))
            availableProjects.push({
              ...d.project,
              name: `${d.project.name} (current report)`,
            });
        }
        setProjects(availableProjects);
      } catch (error) {
        setErr(errorMessage(error));
      } finally {
        setLoading(false);
      }
    }
    void loadForm();
  }, [id, nav]);
  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const selectWeekStart = (value: string) => {
    if (!value) {
      setData((current: any) => ({
        ...current,
        weekStartDate: "",
        weekEndDate: "",
      }));
      return;
    }
    const selectedDay = new Date(`${value}T00:00:00.000Z`).getUTCDay();
    if (selectedDay !== 1) {
      toast.error("Select a Monday as the week start.");
      return;
    }
    setData((current: any) => ({
      ...current,
      weekStartDate: value,
      weekEndDate: addDateDays(value, 6),
    }));
  };
  const row = (section: string, i: number, k: string, v: any) =>
    set(
      section,
      data[section].map((x: any, n: number) =>
        n === i ? { ...x, [k]: v } : x,
      ),
    );
  const add = (section: string, value: any) =>
    set(section, [...data[section], value]);
  const remove = (section: string, i: number) =>
    set(
      section,
      data[section].filter((_: any, n: number) => n !== i),
    );
  const payload = () => ({
    ...data,
    links: data.links.filter(Boolean),
    tasks: data.tasks.map((x: any) => ({
      ...x,
      plannedPercentage: +x.plannedPercentage,
      actualPercentage: +x.actualPercentage,
      plannedTime: +x.plannedTime,
      actualTime: +x.actualTime,
    })),
    workHours: data.workHours.map((x: any) => ({ ...x, hours: +x.hours })),
  });
  function validate(input: ReturnType<typeof payload>) {
    const errors: string[] = [];
    if (!input.projectId) errors.push("Select a project.");
    if (!input.weekStartDate || !input.weekEndDate)
      errors.push("Select both week dates.");
    else {
      const startDay = new Date(
        `${input.weekStartDate}T00:00:00.000Z`,
      ).getUTCDay();
      if (startDay !== 1)
        errors.push("Week start must be a Monday.");
      if (input.weekEndDate !== addDateDays(input.weekStartDate, 6))
        errors.push("Week end must be the Sunday after week start.");
    }
    if (input.weekStartDate > weekStart)
      errors.push("Reports cannot be created for a future week.");
    if (input.weekEndDate > currentWeekEnd)
      errors.push("The week end cannot be in a future week.");
    if (!input.tasks.length)
      errors.push("Add at least one completed-task entry.");
    input.tasks.forEach((task: any, index: number) => {
      if (!task.name.trim()) errors.push(`Task ${index + 1} needs a name.`);
      if (
        task.plannedPercentage < 0 ||
        task.plannedPercentage > 100 ||
        task.actualPercentage < 0 ||
        task.actualPercentage > 100
      )
        errors.push(`Task ${index + 1} percentages must be between 0 and 100.`);
      if (task.plannedTime < 0 || task.actualTime < 0)
        errors.push(`Task ${index + 1} hours cannot be negative.`);
    });
    input.nextWeekTasks.forEach((task: any, index: number) => {
      if (!task.name.trim())
        errors.push(`Next-week task ${index + 1} needs a name.`);
    });
    input.blockers.forEach((blocker: any, index: number) => {
      if (!blocker.title.trim())
        errors.push(`Blocker ${index + 1} needs a title.`);
    });
    if (input.blockers.filter((blocker: any) => blocker.isKeyIssue).length > 1)
      errors.push("Only one blocker can be marked as the key issue.");
    input.achievements.forEach((achievement: any, index: number) => {
      if (!achievement.title.trim())
        errors.push(`Achievement ${index + 1} needs a title.`);
    });
    if (
      input.achievements.filter(
        (achievement: any) => achievement.isKeyAchievement,
      ).length > 1
    )
      errors.push("Only one achievement can be marked as key.");
    input.workHours.forEach((entry: any, index: number) => {
      if (!entry.workType.trim() || entry.hours < 0 || entry.hours > 168)
        errors.push(
          `Hours entry ${index + 1} must be between 0 and 168 hours.`,
        );
    });
    input.links.forEach((link: string, index: number) => {
      try {
        new URL(link);
      } catch {
        errors.push(`Reference link ${index + 1} is not a valid URL.`);
      }
    });
    return errors;
  }
  async function save(submit = false) {
    const input = payload();
    const errors = validate(input);
    setValidationErrors(errors);
    if (errors.length) {
      toast.error("Please correct the highlighted form issues.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      let rid = id;
      if (id) await api.patch(`/reports/${id}`, input);
      else {
        const r = await api.post("/reports", input);
        rid = r.data.id;
      }
      if (submit) await api.post(`/reports/${rid}/submit`);
      toast.success(submit ? "Report submitted" : "Draft saved");
      nav(`/reports/${rid}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <Loading />;
  if (err) return <ErrorBox message={err} />;
  const feedback =
    data.status === "NEEDS_CORRECTION" && data.reviews?.[0]?.comment;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {id && (
        <Link
          to={`/reports/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to report
        </Link>
      )}
      <div>
        <h1 className="page-title">
          {id ? "Update weekly report" : "Create weekly report"}
        </h1>
        <p className="text-slate-500">
          All fields follow the team’s standard weekly format.
        </p>
      </div>
      {feedback && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <b>Changes requested:</b> {feedback}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {validationErrors.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <section className="card grid gap-4 md:grid-cols-2">
        <h2 className="section-title md:col-span-2">Weekly information</h2>
        <label>
          Project
          <select
            value={data.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            required
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {!id && !projects.length && (
            <span className="mt-1 block text-xs text-amber-700">
              No active projects are assigned to you.
            </span>
          )}
        </label>
        <span />
        <label>
          Week start
          <input
            type="date"
            min="1970-01-05"
            max={weekStart}
            step={7}
            value={data.weekStartDate}
            onChange={(e) => selectWeekStart(e.target.value)}
          />
        </label>
        <label>
          Week end
          <input
            type="date"
            value={data.weekEndDate}
            disabled
          />
        </label>
      </section>
      <Rows
        title="Tasks completed"
        items={data.tasks}
        add={() =>
          add("tasks", {
            name: "",
            priority: "MEDIUM",
            plannedPercentage: 100,
            actualPercentage: 0,
            status: "IN_PROGRESS",
            plannedTime: 0,
            actualTime: 0,
            deliverable: "",
          })
        }
        remove={(i) => remove("tasks", i)}
      >
        {(x: any, i: number) => (
          <>
            <Field
              label="Task name"
              value={x.name}
              onChange={(v) => row("tasks", i, "name", v)}
            />
            <Choice
              label="Priority"
              value={x.priority}
              options={["LOW", "MEDIUM", "HIGH"]}
              onChange={(v) => row("tasks", i, "priority", v)}
            />
            <Num
              label="Planned %"
              value={x.plannedPercentage}
              max={100}
              onChange={(v) => row("tasks", i, "plannedPercentage", v)}
            />
            <Num
              label="Actual %"
              value={x.actualPercentage}
              max={100}
              onChange={(v) => row("tasks", i, "actualPercentage", v)}
            />
            <Choice
              label="Status"
              value={x.status}
              options={["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]}
              onChange={(v) => row("tasks", i, "status", v)}
            />
            <Num
              label="Planned hours"
              value={x.plannedTime}
              onChange={(v) => row("tasks", i, "plannedTime", v)}
            />
            <Num
              label="Actual hours"
              value={x.actualTime}
              onChange={(v) => row("tasks", i, "actualTime", v)}
            />
            <Field
              label="Deliverable"
              value={x.deliverable}
              onChange={(v) => row("tasks", i, "deliverable", v)}
            />
          </>
        )}
      </Rows>
      <Rows
        title="Next week tasks"
        items={data.nextWeekTasks}
        add={() =>
          add("nextWeekTasks", {
            name: "",
            description: "",
            priority: "MEDIUM",
          })
        }
        remove={(i) => remove("nextWeekTasks", i)}
      >
        {(x: any, i: number) => (
          <>
            <Field
              label="Task name"
              value={x.name}
              onChange={(v) => row("nextWeekTasks", i, "name", v)}
            />
            <Field
              label="Description"
              value={x.description}
              onChange={(v) => row("nextWeekTasks", i, "description", v)}
            />
            <Choice
              label="Priority"
              value={x.priority}
              options={["LOW", "MEDIUM", "HIGH"]}
              onChange={(v) => row("nextWeekTasks", i, "priority", v)}
            />
          </>
        )}
      </Rows>
      <Rows
        title="Blockers / challenges"
        items={data.blockers}
        add={() =>
          add("blockers", {
            title: "",
            description: "",
            isKeyIssue: false,
            status: "OPEN",
          })
        }
        remove={(i) => remove("blockers", i)}
      >
        {(x: any, i: number) => (
          <>
            <Field
              label="Title"
              value={x.title}
              onChange={(v) => row("blockers", i, "title", v)}
            />
            <Field
              label="Description"
              value={x.description}
              onChange={(v) => row("blockers", i, "description", v)}
            />
            <Choice
              label="Status"
              value={x.status}
              options={["OPEN", "RESOLVED"]}
              onChange={(v) => row("blockers", i, "status", v)}
            />
            <Check
              label="Key issue"
              value={x.isKeyIssue}
              onChange={(v) => row("blockers", i, "isKeyIssue", v)}
            />
          </>
        )}
      </Rows>
      <Rows
        title="Achievements"
        items={data.achievements}
        add={() =>
          add("achievements", {
            title: "",
            description: "",
            isKeyAchievement: false,
          })
        }
        remove={(i) => remove("achievements", i)}
      >
        {(x: any, i: number) => (
          <>
            <Field
              label="Title"
              value={x.title}
              onChange={(v) => row("achievements", i, "title", v)}
            />
            <Field
              label="Description"
              value={x.description}
              onChange={(v) => row("achievements", i, "description", v)}
            />
            <Check
              label="Key achievement"
              value={x.isKeyAchievement}
              onChange={(v) => row("achievements", i, "isKeyAchievement", v)}
            />
          </>
        )}
      </Rows>
      <Rows
        title="Hours breakdown"
        items={data.workHours}
        add={() => add("workHours", { workType: "Development", hours: 0 })}
        remove={(i) => remove("workHours", i)}
      >
        {(x: any, i: number) => (
          <>
            <Choice
              label="Work type"
              value={x.workType}
              options={[
                "Development",
                "Testing",
                "Meetings",
                "Documentation",
                "Research",
                "Other",
              ]}
              onChange={(v) => row("workHours", i, "workType", v)}
            />
            <Num
              label="Hours"
              value={x.hours}
              max={168}
              onChange={(v) => row("workHours", i, "hours", v)}
            />
          </>
        )}
      </Rows>
      <section className="card space-y-4">
        <h2 className="section-title">Notes / links</h2>
        <label>
          Notes
          <textarea
            rows={4}
            value={data.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label>Reference URLs</label>
            <button
              className="btn-secondary"
              onClick={() => set("links", [...data.links, ""])}
            >
              + Add link
            </button>
          </div>
          <div className="space-y-2">
            {data.links.map((link: string, index: number) => (
              <div className="flex items-center gap-2" key={index}>
                <input
                  aria-label={`Reference URL ${index + 1}`}
                  type="url"
                  placeholder="https://example.com/deliverable"
                  value={link}
                  onChange={(e) =>
                    set(
                      "links",
                      data.links.map((item: string, itemIndex: number) =>
                        itemIndex === index ? e.target.value : item,
                      ),
                    )
                  }
                />
                <button
                  className="text-sm font-medium text-red-600"
                  onClick={() =>
                    set(
                      "links",
                      data.links.filter(
                        (_: string, itemIndex: number) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="flex justify-end gap-3">
        {data.status !== "NEEDS_CORRECTION" && (
          <button
            disabled={saving}
            className="btn-secondary"
            onClick={() => save(false)}
          >
            Save draft
          </button>
        )}
        <button
          disabled={saving}
          className="btn-primary"
          onClick={() => save(true)}
        >
          Submit report
        </button>
      </div>
    </div>
  );
}
function Rows({
  title,
  items,
  add,
  remove,
  children,
}: {
  title: string;
  items: any[];
  add: () => void;
  remove: (i: number) => void;
  children: (x: any, i: number) => React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="mb-4 flex justify-between">
        <h2 className="section-title">{title}</h2>
        <button className="btn-secondary" onClick={add}>
          + Add
        </button>
      </div>
      <div className="space-y-4">
        {items.map((x, i) => (
          <div
            key={i}
            className="relative grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {children(x, i)}
            <button
              className="absolute right-2 top-2 text-xs text-red-600"
              onClick={() => remove(i)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
}) => (
  <label>
    {label}
    <input value={value || ""} onChange={(e) => onChange(e.target.value)} />
  </label>
);
const Num = ({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: any;
  max?: number;
  onChange: (v: string) => void;
}) => (
  <label>
    {label}
    <input
      type="number"
      min="0"
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);
const Choice = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <label>
    {label}
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  </label>
);
const Check = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="mt-6 flex items-center gap-2">
    <input
      className="mt-0 h-4 w-4"
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);
