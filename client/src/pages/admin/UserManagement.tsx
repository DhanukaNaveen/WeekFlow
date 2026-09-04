import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { useAuth } from "../../contexts/AuthContext";
import type { Role, User } from "../../types";
import { ShieldCheck } from "lucide-react";
import { Avatar, PageHeader } from "../../components/common/Ui";
export function UserManagement() {
  const { user } = useAuth(),
    [users, setUsers] = useState<User[]>(),
    [err, setErr] = useState("");
  const load = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
      setErr("");
    } catch (error) {
      setErr(errorMessage(error));
    }
  };
  useEffect(() => {
    void load();
  }, []);
  async function role(x: User, r: Role) {
    if (!window.confirm(`Change ${x.name}'s role to ${r.replace("_", " ")}?`)) return;
    try {
      await api.patch(`/users/${x.id}/role`, { role: r });
      await load();
      toast.success("Role updated");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function active(x: User) {
    if (!window.confirm(`${x.isActive ? "Deactivate" : "Activate"} ${x.name}?`)) return;
    try {
      await api.patch(`/users/${x.id}/status`, { isActive: !x.isActive });
      await load();
      toast.success(x.isActive ? "User deactivated" : "User activated");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  if (err) return <ErrorBox message={err} />;
  if (!users) return <Loading />;
  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="User management" description="Manage account access and role-based permissions." />
      {!users.length ? (
        <Empty message="No users have been registered yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div className="flex items-center gap-3"><Avatar name={x.name} size="sm" /><div><b className="text-slate-900">{x.name}</b><span className="block text-slate-500">{x.email}</span></div></div>
                  </td>
                  <td>
                    <select
                      disabled={x.id === user?.id}
                      className="max-w-44"
                      value={x.role}
                      onChange={(e) => role(x, e.target.value as Role)}
                    >
                      {["TEAM_MEMBER", "MANAGER", "ADMIN"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      disabled={x.id === user?.id}
                      onClick={() => active(x)}
                      className={
                        `status-pill ${x.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`
                      }
                    >
                      {x.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{new Date(x.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
