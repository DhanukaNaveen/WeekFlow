import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import type { Project, User } from "../../types";
export function ProjectsPage() {
  const [p, setP] = useState<Project[]>(),
    [members, setMembers] = useState<User[]>([]),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [editingId, setEditingId] = useState<string | null>(null),
    [editName, setEditName] = useState(""),
    [editDescription, setEditDescription] = useState(""),
    [assigningProject, setAssigningProject] = useState<Project | null>(null),
    [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]),
    [savingId, setSavingId] = useState<string | null>(null),
    [err, setErr] = useState("");
  const load = async () => {
    try {
      const [projectResponse, userResponse] = await Promise.all([
        api.get("/projects"),
        api.get("/users"),
      ]);
      setP(projectResponse.data);
      setMembers(
        userResponse.data.filter((user: User) => user.role === "TEAM_MEMBER"),
      );
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
  function beginAssign(project: Project) {
    setAssigningProject(project);
    setSelectedMemberIds(
      project.assignedMembers?.map((member) => member.id) ?? [],
    );
  }
  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }
  async function saveAssignments() {
    if (!assigningProject) return;
    try {
      setSavingId(assigningProject.id);
      await api.put(`/projects/${assigningProject.id}/members`, {
        memberIds: selectedMemberIds,
      });
      await load();
      setAssigningProject(null);
      toast.success("Project members updated");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingId(null);
    }
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
                <th>Assigned members</th>
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
                    {x.assignedMembers?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {x.assignedMembers.map((member) => (
                          <span
                            className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                            key={member.id}
                          >
                            {member.name}
                            {!member.isActive ? " (Inactive)" : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
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
                          onClick={() => beginAssign(x)}
                        >
                          Assign members
                        </button>
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
      {assigningProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div
            aria-labelledby="assign-members-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
          >
            <h2 className="text-lg font-semibold" id="assign-members-title">
              Assign members to {assigningProject.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Selected members can use this project for new reports.
            </p>
            <div className="mt-5 max-h-80 space-y-2 overflow-y-auto">
              {!members.length ? (
                <Empty message="No team members are available." />
              ) : (
                members.map((member) => (
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3"
                    key={member.id}
                  >
                    <input
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-medium">{member.name}</span>
                      <span className="block text-xs text-slate-500">
                        {member.email}
                        {!member.isActive ? " · Inactive" : ""}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary"
                disabled={savingId === assigningProject.id}
                onClick={() => setAssigningProject(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={savingId === assigningProject.id}
                onClick={() => void saveAssignments()}
              >
                Save assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
