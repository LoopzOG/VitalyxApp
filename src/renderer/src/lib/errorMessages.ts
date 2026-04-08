export function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const maybeMessage = "message" in error ? error.message : null;
    const maybeCode = "code" in error ? error.code : null;

    const message = typeof maybeMessage === "string" ? maybeMessage : "";
    const code = typeof maybeCode === "string" ? maybeCode : "";

    if (
      code === "PGRST205" ||
      message.includes("relation") ||
      message.includes("profiles") ||
      message.includes("user_app_data")
    ) {
      return "Supabase database setup is incomplete. Run the SQL from supabase/schema.sql, then try signing in again.";
    }

    if (message.includes("Email not confirmed")) {
      return "This account still needs email confirmation. Open your Supabase confirmation email, then try signing in again.";
    }

    if (message.trim()) {
      return message;
    }
  }

  return fallback;
}
