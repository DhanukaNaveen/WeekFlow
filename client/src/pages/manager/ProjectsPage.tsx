import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import type { Project } from "../../types";
export function ProjectsPage() {
  const [p, setP] = useState<Project[]>(),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [editingId, setEditingId] = useState<string | null>(null),
    [editName, setEditName] = useState(""),
    [editDescription, setEditDescription] = useState(""),
    [savingId, setSavingId] = useState<string | null>(null),
    [err, setErr] = useState("");
  const load = async () => {
    try {
      const response = await api.get("/projects");
      setP(response.data);
      setErr("");
    } catch (error) {
      setErr(errorMessage(error));
    }
  };
  useEffect(() => {
    void load();
  }, []);
  async function add() {
    try {
      await api.post("/projects", { name, description });
      setName("");
      setDescription("");
      await load();
      toast.success("Project created");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function toggle(x: Project) {
    try {
      setSavingId(x.id);
      await api.patch(`/projects/${x.id}`, { isActive: !x.isActive });
      await load();
      toast.success(x.isActive ? "Project deactivated" : "Project activated");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  }
  function beginEdit(x: Project) {
    setEditingId(x.id);
    setEditName(x.name);
    setEditDescription(x.description ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }
  async function saveEdit(x: Project) {
    if (!editName.trim()) return;
    try {
      setSavingId(x.id);
      await api.patch(`/projects/${x.id}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      await load();
      cancelEdit();
      toast.success("Project updated");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  }
  async function remove(x: Project) {
    if (!confirm(`Delete or deactivate ${x.name}?`)) return;
    try {
      setSavingId(x.id);
      await api.delete(`/projects/${x.id}`);
      await load();
      toast.success("Project removed");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingId(null);
    }
  }
  if (err) return <ErrorBox message={err} />;
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
        <button
          disabled={name.trim().length < 2}
          className="btn-primary"
          onClick={add}
        >
          Add project
        </button>
      </div>
      {!p.length ? (
        <Empty message="No projects have been created yet." />
      ) : (
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
                  <td className="font-medium">
                    {editingId === x.id ? (
                      <input
                        aria-label="Project name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      x.name
                    )}
                  </td>
                  <td>
                    {editingId === x.id ? (
                      <input
                        aria-label="Project description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    ) : (
                      x.description || "—"
                    )}
                  </td>
                  <td>{x.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    {editingId === x.id ? (
                      <div className="flex gap-3">
                        <button
                          className="font-medium text-blue-600"
                          disabled={!editName.trim() || savingId === x.id}
                          onClick={() => saveEdit(x)}
                        >
                          Save
                        </button>
                        <button
                          className="text-slate-500"
                          disabled={savingId === x.id}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="font-medium text-blue-600"
                          onClick={() => beginEdit(x)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-blue-600"
                          disabled={savingId === x.id}
                          onClick={() => toggle(x)}
                        >
                          {x.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => remove(x)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
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
