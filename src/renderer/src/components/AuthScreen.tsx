import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { validateDisplayName, validateEmail, validatePassword } from "@/lib/authValidation";

type AuthMode = "signin" | "register" | "forgot-password" | "reset-password";

type AuthScreenProps = {
  onSignIn: (input: { email: string; password: string }) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
  onForgotPassword: (input: { email: string }) => Promise<void>;
  onResetPassword: (input: { password: string; confirmPassword: string }) => Promise<void>;
  errorMessage: string | null;
  infoMessage?: string | null;
  loading: boolean;
  initialMode?: AuthMode;
};

export function AuthScreen({
  onSignIn,
  onRegister,
  onForgotPassword,
  onResetPassword,
  errorMessage,
  infoMessage,
  loading,
  initialMode = "signin",
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const effectiveError = clientError ?? errorMessage;
  const title = useMemo(() => {
    if (mode === "register") return "Create your Vitalyx account";
    if (mode === "forgot-password") return "Reset your password";
    if (mode === "reset-password") return "Choose a new password";
    return "Welcome back";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "register") return "Sign up with your email and password. Your account and profile will be created in Supabase.";
    if (mode === "forgot-password") return "Enter your email and we'll send you a password reset link.";
    if (mode === "reset-password") return "Your recovery session is active. Set a new password to finish recovering the account.";
    return "Sign in to restore your secure session and load your dashboard data.";
  }, [mode]);

  async function handleSubmit() {
    setClientError(null);

    try {
      if (mode === "signin") {
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        if (emailError || passwordError) {
          setClientError(emailError ?? passwordError);
          return;
        }
        await onSignIn({ email, password });
        return;
      }

      if (mode === "register") {
        const nameError = validateDisplayName(name);
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        if (password !== confirmPassword) {
          setClientError("Passwords do not match.");
          return;
        }
        if (nameError || emailError || passwordError) {
          setClientError(nameError ?? emailError ?? passwordError);
          return;
        }
        await onRegister({ name, email, password });
        return;
      }

      if (mode === "forgot-password") {
        const emailError = validateEmail(email);
        if (emailError) {
          setClientError(emailError);
          return;
        }
        await onForgotPassword({ email });
        return;
      }

      const passwordError = validatePassword(password);
      if (password !== confirmPassword) {
        setClientError("Passwords do not match.");
        return;
      }
      if (passwordError) {
        setClientError(passwordError);
        return;
      }
      await onResetPassword({ password, confirmPassword });
    } catch {
      // server-side errors are passed in through props
    }
  }

  return (
    <div className="auth-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      <div className="auth-stars" />
      <div className="auth-stars auth-stars-delay" />
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <div className="auth-phone-frame relative w-full max-w-[30rem] rounded-[36px] border border-white/10 bg-[rgba(9,10,14,0.78)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5">
        <div className="auth-phone-inner rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-7">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <div className="relative flex items-center justify-center overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(132,204,22,0.18),rgba(18,20,24,0.96)_58%)] px-4 py-4 shadow-[0_18px_55px_rgba(0,0,0,0.34)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.16),transparent_58%)]" />
              <LogoMark className="relative h-auto w-48 sm:w-52" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]">
              Secure access for Vitalyx
            </h1>
            <p className="mt-3 max-w-[22rem] text-sm leading-7 text-zinc-400">
              {subtitle}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-sm rounded-[28px] border border-white/10 bg-[rgba(8,10,14,0.72)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-6">
            {mode !== "reset-password" ? (
              <div className="mb-6 flex rounded-2xl border border-white/10 bg-zinc-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                    mode === "signin" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${
                    mode === "register" ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
                  }`}
                >
                  Register
                </button>
              </div>
            ) : null}

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
            </div>

            <div className="mt-5 space-y-5">
              {mode === "register" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Display name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                    placeholder="John Doe"
                  />
                </label>
              ) : null}

              {mode !== "reset-password" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                    placeholder="you@example.com"
                  />
                </label>
              ) : null}

              {mode !== "forgot-password" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                    placeholder="Minimum 8 characters"
                  />
                </label>
              ) : null}

              {mode === "register" || mode === "reset-password" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white outline-none"
                    placeholder="Repeat your password"
                  />
                </label>
              ) : null}

              {infoMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {infoMessage}
                </div>
              ) : null}

              {effectiveError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {effectiveError}
                </div>
              ) : null}

              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSubmit()}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? "Working..."
                  : mode === "signin"
                    ? "Sign In"
                    : mode === "register"
                      ? "Create Account"
                      : mode === "forgot-password"
                        ? "Send Reset Email"
                        : "Update Password"}
              </button>

              {mode === "signin" ? (
                <button type="button" onClick={() => setMode("forgot-password")} className="w-full text-sm text-emerald-300">
                  Forgot your password?
                </button>
              ) : null}

              {mode === "forgot-password" ? (
                <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-zinc-400">
                  Back to sign in
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
