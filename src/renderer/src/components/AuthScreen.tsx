import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";

type AuthScreenProps = {
  onSignIn: (input: { email: string; password: string }) => void;
  onRegister: (input: { name: string; email: string; password: string }) => void;
  errorMessage: string | null;
};

export function AuthScreen({ onSignIn, onRegister, errorMessage }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="auth-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      <div className="auth-stars" />
      <div className="auth-stars auth-stars-delay" />
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <div className="auth-phone-frame relative w-full max-w-[28rem] rounded-[36px] border border-white/10 bg-[rgba(9,10,14,0.78)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5">
        <div className="auth-phone-inner rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-7">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <div className="relative flex items-center justify-center rounded-[28px] border border-emerald-300/20 bg-black/35 px-5 py-4 shadow-[0_0_40px_rgba(52,211,153,0.14)]">
              <LogoMark className="h-auto w-44 sm:w-48" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]">
              Health and performance in one place
            </h1>
            <p className="mt-3 max-w-[20rem] text-sm leading-7 text-zinc-400">
              Sign in to continue or create an account to start with a clean Vitalyx workspace.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-sm rounded-[28px] border border-white/10 bg-[rgba(8,10,14,0.72)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="mb-6 flex rounded-2xl border border-white/10 bg-zinc-900/60 p-1">
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                  mode === "signin" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                  mode === "register" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
                }`}
              >
                Register
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {mode === "signin" ? "Welcome back" : "Create your Vitalyx account"}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {mode === "signin"
                  ? "Sign in to load your saved workspace data."
                  : "Create a local account to start storing planner data per user."}
              </p>
            </div>

            <div className="mt-5 space-y-5">
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
                  placeholder="you@example.com"
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

              <button
                onClick={() => (mode === "signin" ? onSignIn({ email, password }) : onRegister({ name, email, password }))}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
