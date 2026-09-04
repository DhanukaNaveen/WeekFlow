import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { Login, Register } from "./pages/auth/AuthPages";
import { Dashboard } from "./pages/dashboard/Dashboards";
import { ReportList } from "./pages/reports/ReportList";
import { ReportForm } from "./pages/reports/ReportForm";
import { ReportDetail } from "./pages/reports/ReportDetail";
import { ProjectsPage } from "./pages/manager/ProjectsPage";
import { TeamList, TeamProfile } from "./pages/manager/TeamPages";
import { UserManagement } from "./pages/admin/UserManagement";
import { SectionView } from "./pages/manager/SectionView";
import { AiAssistantPage } from "./pages/manager/AiAssistantPage";
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(15,23,42,.12)" } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="reports" element={<ReportList />} />
              <Route path="reports/:id" element={<ReportDetail />} />
              <Route element={<ProtectedRoute roles={["TEAM_MEMBER"]} />}>
                <Route path="reports/new" element={<ReportForm />} />
                <Route path="reports/:id/edit" element={<ReportForm />} />
              </Route>
              <Route element={<ProtectedRoute roles={["MANAGER", "ADMIN"]} />}>
                <Route
                  path="reports/:id/review"
                  element={<ReportDetail reviewMode />}
                />
                <Route path="team" element={<TeamList />} />
                <Route path="team/:id" element={<TeamProfile />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="section-view" element={<SectionView />} />
                <Route path="ai-assistant" element={<AiAssistantPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                <Route path="admin/users" element={<UserManagement />} />
              </Route>
            </Route>
          </Route>
          <Route
            path="*"
            element={<main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="card max-w-md text-center"><p className="text-sm font-bold uppercase tracking-widest text-blue-600">404</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Page not found</h1><p className="mt-2 text-slate-500">The page you requested does not exist or is no longer available.</p><Link className="btn-primary mt-6" to="/">Return to dashboard</Link></div></main>}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
