import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { StatusBadge } from "../../components/common/StatusBadge";
import type { User } from "../../types";
export function TeamList() {
  const [u, setU] = useState<User[]>(),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/users")
      .then((r) => setU(r.data.filter((x: User) => x.role === "TEAM_MEMBER")))
      .catch((e) => setErr(errorMessage(e)));
  }, []);
  if (err) return <ErrorBox message={err} />;
  if (!u) return <Loading />;
  return (
    <div className="space-y-5">
      <h1 className="page-title">Team members</h1>
      {!u.length ? (
        <Empty />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {u.map((x) => (
            <Link
              to={`/team/${x.id}`}
              className="card hover:border-blue-300"
              key={x.id}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {x.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h2 className="mt-3 font-semibold">{x.name}</h2>
              <p className="text-sm text-slate-500">{x.email}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
export function TeamProfile() {
  const { id } = useParams(),
    [u, setU] = useState<User>(),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get(`/users/${id}`)
      .then((r) => setU(r.data))
      .catch((e) => setErr(errorMessage(e)));
  }, [id]);
  if (err) return <ErrorBox message={err} />;
  if (!u) return <Loading />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{u.name}</h1>
        <p className="text-slate-500">{u.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-5">
        {Object.entries(u.statistics || {}).map(([k, v]) => (
          <div className="card" key={k}>
            <p className="text-xs capitalize text-slate-500">
              {k.replace(/([A-Z])/g, " $1")}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {typeof v === "number" ? Math.round(v * 10) / 10 : v}
            </p>
          </div>
        ))}
      </div>
      {!u.reports?.length ? (
        <Empty message="This team member has no report history yet." />
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
              {u.reports?.map((r) => (
                <tr key={r.id}>
                  <td>{r.weekStartDate.slice(0, 10)}</td>
                  <td>{r.project.name}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <Link className="text-blue-600" to={`/reports/${r.id}`}>
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
