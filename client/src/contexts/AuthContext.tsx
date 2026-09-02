import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import type { User } from "../types";
type Auth = {
  user: User | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<User>;
  register: (n: string, e: string, p: string) => Promise<void>;
  logout: () => void;
};
const C = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("weekflow_user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem("weekflow_token")) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        localStorage.setItem("weekflow_user", JSON.stringify(data));
        setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("weekflow_token", data.token);
    localStorage.setItem("weekflow_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };
  const register = async (name: string, email: string, password: string) => {
    await api.post("/auth/register", { name, email, password });
    await login(email, password);
  };
  const logout = () => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("weekflow_token");
    localStorage.removeItem("weekflow_user");
    setUser(null);
  };
  return (
    <C.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </C.Provider>
  );
}
export const useAuth = () => {
  const c = useContext(C);
  if (!c) throw Error("AuthProvider missing");
  return c;
};
