import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { errorMessage } from "../../api/client";
function Shell({
  children,
  title,
  sub,
}: {
  children: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.24),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.18),_transparent_42%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
            W
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Week<span className="text-blue-600">Flow</span>
          </h1>
        </div>
        <div className="mt-8">
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <LockKeyhole size={19} />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
        </div>
        <p className="mb-6 mt-1 text-sm leading-6 text-slate-500">{sub}</p>
        {children}
      </div>
    </div>
  );
}
export function Login() {
  const { login } = useAuth(),
    nav = useNavigate();
  const [e, setE] = useState(""),
    [p, setP] = useState(""),
    [busy, setBusy] = useState(false);
  async function go(x: FormEvent) {
    x.preventDefault();
    setBusy(true);
    try {
      await login(e, p);
      nav("/");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell title="Welcome back" sub="Sign in to manage your weekly work.">
      <form onSubmit={go} className="space-y-4">
        <label>
          Email
          <input
            type="email"
            value={e}
            onChange={(x) => setE(x.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={p}
            onChange={(x) => setP(x.target.value)}
            required
          />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        New here?{" "}
        <Link
          className="font-semibold text-blue-600 hover:text-blue-700"
          to="/register"
        >
          Create account
        </Link>
      </p>
    </Shell>
  );
}
export function Register() {
  const { register } = useAuth(),
    nav = useNavigate();
  const [n, setN] = useState(""),
    [e, setE] = useState(""),
    [p, setP] = useState(""),
    [busy, setBusy] = useState(false);
  async function go(x: FormEvent) {
    x.preventDefault();
    setBusy(true);
    try {
      await register(n, e, p);
      nav("/");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Create your account"
      sub="Join your team’s weekly reporting workspace."
    >
      <form onSubmit={go} className="space-y-4">
        <label>
          Name
          <input value={n} onChange={(x) => setN(x.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={e}
            onChange={(x) => setE(x.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={8}
            value={p}
            onChange={(x) => setP(x.target.value)}
            required
          />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account…" : "Create account"}
          {!busy && <ArrowRight size={17} />}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link
          className="font-semibold text-blue-600 hover:text-blue-700"
          to="/login"
        >
          Back to sign in
        </Link>
      </p>
    </Shell>
  );
}
