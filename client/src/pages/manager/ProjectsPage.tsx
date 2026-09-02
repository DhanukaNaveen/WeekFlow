import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";
import { Loading } from "../../components/common/States";
import type { Project } from "../../types";
export function ProjectsPage() {
  const [p, setP] = useState<Project[]>(),
    [name, setName] = useState(""),
    [description, setDescription] = useState("");
  const load = () => api.get("/projects").then((r) => setP(r.data));
  useEffect(() => { void load(); }, []);
  async function add() {
    try {
      await api.post("/projects", { name, description });
      setName("");
      setDescription("");
      load();
      toast.success("Project created");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function toggle(x: Project) {
    await api.patch(`/projects/${x.id}`, { isActive: !x.isActive });
    load();
  }
  async function remove(x: Project) {
    if (!confirm(`Delete or deactivate ${x.name}?`)) return;
    await api.delete(`/projects/${x.id}`);
    load();
  }
  if (!p) return <Loading />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Projects</h1>
        <p className="text-slate-500">Manage reporting categories safely.</p>
      </div>
      <div className="card grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button disabled={!name.trim()} className="btn-primary" onClick={add}>
          Add project
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {p.map((x) => (
              <tr key={x.id}>
                <td className="font-medium">{x.name}</td>
                <td>{x.description}</td>
                <td>{x.isActive ? "Active" : "Inactive"}</td>
                <td className="space-x-3">
                  <button className="text-blue-600" onClick={() => toggle(x)}>
                    {x.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="text-red-600" onClick={() => remove(x)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
