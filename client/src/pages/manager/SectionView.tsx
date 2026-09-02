import { useEffect, useState } from "react";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
export function SectionView() {
  const [section, setSection] = useState("BLOCKERS"),
    [week, setWeek] = useState(""),
    [rows, setRows] = useState<any[]>(),
    [err, setErr] = useState("");
  useEffect(() => {
    setRows(undefined);
    setErr("");
    api
      .get("/dashboard/section-view", {
        params: { section, week: week || undefined },
      })
      .then((r) => setRows(r.data))
      .catch((e) => setErr(errorMessage(e)));
  }, [section, week]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Cross-team section view</h1>
        <p className="text-slate-500">
          Compare blockers or achievements side by side.
        </p>
      </div>
      <div className="card flex flex-wrap gap-4">
        <label>
          Section
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            <option>BLOCKERS</option>
            <option>ACHIEVEMENTS</option>
          </select>
        </label>
        <label>
          Week start
          <input
            type="date"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team member</th>
                <th>Project</th>
                <th>Key item</th>
                <th>Other items</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const items =
                  section === "BLOCKERS" ? r.blockers : r.achievements;
                const key = items.find(
                  (x: any) => x.isKeyIssue || x.isKeyAchievement,
                );
                return (
                  <tr key={r.id}>
                    <td>{r.user.name}</td>
                    <td>{r.project.name}</td>
                    <td>{key?.title || "—"}</td>
                    <td>
                      {items
                        .filter((x: any) => x !== key)
                        .map((x: any) => x.title)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
