import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";
import { Empty, ErrorBox, Loading } from "../../components/common/States";
import { useAuth } from "../../contexts/AuthContext";
import type { Role, User } from "../../types";
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
    try {
      await api.patch(`/users/${x.id}/role`, { role: r });
      await load();
      toast.success("Role updated");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function active(x: User) {
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
    <div className="space-y-5">
      <h1 className="page-title">User management</h1>
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
                    <b>{x.name}</b>
                    <br />
                    <span className="text-slate-500">{x.email}</span>
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
                        x.isActive ? "text-emerald-600" : "text-red-600"
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
