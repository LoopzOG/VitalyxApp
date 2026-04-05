import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";

type AuthScreenProps = {
  onSignIn: (input: { email: string; password: string }) => void;
  onAdminSignIn: (input: { email: string; password: string }) => void;
  onRegister: (input: { name: string; email: string; password: string }) => void;
  errorMessage: string | null;
};

export function AuthScreen({ onSignIn, onAdminSignIn, onRegister, errorMessage }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "register" | "admin">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const infoCards = [
    ["Private planner data", "Each user gets a separate saved planner and future dashboard state."],
    ["Built for every screen", "The same account carries across the web experience, desktop shell, and mobile app."],
    ["Ready to expand", "This structure can grow into real backend auth later without replacing the UI."],
  ];

  return (
    <div className="auth-scene relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="auth-stars" />
      <div className="auth-stars auth-stars-delay" />
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <div className="relative grid w-full max-w-7xl gap-8 xl:grid-cols-[1.08fr_520px]">
        <div className="hidden rounded-[36px] border border-white/10 bg-white/5 p-12 shadow-[0_24px_60px_rgba(0,0,0,0.28)] xl:flex xl:flex-col xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-8 flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-300/25 bg-emerald-400/12 shadow-[0_0_40px_rgba(52,211,153,0.14)]">
                <LogoMark className="h-11 w-11" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-emerald-300/80">MoreXApp</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Meals, grocery planning, recipes, and training in one workspace
                </p>
              </div>
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white">
              A single account for your whole performance and meal-prep system.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              Sign in to load your saved planner data, or create a new account to start with a clean MoreXApp workspace.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {infoCards.map(([title, copy]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                <p className="font-medium text-white">{title}</p>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="mb-8 flex rounded-2xl border border-white/10 bg-zinc-900/60 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                mode === "signin" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("admin")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                mode === "admin" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
              }`}
            >
              Admin Access
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                mode === "register" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                {mode === "signin"
                  ? "Welcome back"
                  : mode === "admin"
                    ? "Admin access"
                    : "Create your MoreXApp account"}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {mode === "signin"
                  ? "Sign in to load your saved workspace data."
                  : mode === "admin"
                    ? "Use the admin account to enter the site with elevated access."
                  : "Create a local account to start storing planner data per user."}
              </p>
            </div>

            {mode === "register" ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                  placeholder="John Doe"
                />
              </label>
            ) : null}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                placeholder={mode === "admin" ? "admin@morex.app" : "you@example.com"}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                placeholder="********"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            {mode === "admin" ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Admin demo credentials: <span className="font-semibold">admin@morex.app</span> / <span className="font-semibold">Admin@123</span>
              </div>
            ) : null}

            <button
              onClick={() =>
                mode === "signin"
                  ? onSignIn({ email, password })
                  : mode === "admin"
                    ? onAdminSignIn({ email, password })
                    : onRegister({ name, email, password })
              }
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              {mode === "signin" ? "Sign In" : mode === "admin" ? "Enter Admin" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
