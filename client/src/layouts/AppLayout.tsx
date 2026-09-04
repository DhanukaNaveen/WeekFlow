import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Columns3,
  FilePlus2,
  Files,
  FolderKanban,
  LogOut,
  Menu,
  Sparkles,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/common/Ui";

const pageTitles: Array<[string, string]> = [
  ["/reports/new", "Create report"],
  ["/section-view", "Section view"],
  ["/ai-assistant", "AI Assistant"],
  ["/admin/users", "User management"],
  ["/projects", "Projects"],
  ["/team", "Team members"],
  ["/reports", "Reports"],
  ["/", "Dashboard"],
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const member = [
    ["Dashboard", "/", BarChart3],
    ["Create report", "/reports/new", FilePlus2],
    ["My reports", "/reports", Files],
  ] as const;
  const manager = [
    ["Dashboard", "/", BarChart3],
    ["Reports", "/reports", Files],
    ["Section view", "/section-view", Columns3],
    ["AI Assistant", "/ai-assistant", Sparkles],
    ["Team members", "/team", Users],
    ["Projects", "/projects", FolderKanban],
  ] as const;
  const links =
    user?.role === "TEAM_MEMBER"
      ? member
      : [
          ...manager,
          ...(user?.role === "ADMIN"
            ? [["User management", "/admin/users", UserCog] as const]
            : []),
        ];
  const currentTitle =
    pageTitles.find(([path]) =>
      path === "/" ? pathname === "/" : pathname.startsWith(path),
    )?.[1] ?? "WeekFlow";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-lg shadow-blue-950/30">
              W
            </span>
            <span className="text-xl font-bold tracking-tight">
              Week<span className="text-blue-400">Flow</span>
            </span>
          </div>
          <button
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {user?.role === "TEAM_MEMBER" ? "My workspace" : "Management"}
          </p>
          <div className="space-y-1">
            {links.map(([label, to, Icon]) => (
              <NavLink
                className={({ isActive }) =>
                  `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`
                }
                end={to === "/" || to === "/reports"}
                key={to}
                to={to}
              >
                <Icon aria-hidden="true" size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <Avatar name={user?.name ?? "User"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs capitalize text-slate-400">
                {user?.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
            <button
              aria-label="Log out"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={logout}
              title="Log out"
              type="button"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex h-16 shrink-0 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            aria-label="Open navigation"
            className="icon-btn mr-3 lg:hidden"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Menu size={21} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {currentTitle}
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Weekly reporting workspace
            </p>
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user?.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
            <Avatar name={user?.name ?? "User"} size="sm" />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
