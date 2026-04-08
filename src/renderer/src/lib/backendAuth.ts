import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import type { SessionUser } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase() ?? "";

function displayNameFromUser(user: User) {
  const metadataName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";
  if (metadataName.trim()) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Vitalyx User";
}

export function mapAuthUser(user: User): SessionUser {
  const normalizedEmail = user.email?.trim().toLowerCase() ?? "";
  const isAdmin = Boolean(adminEmail) && normalizedEmail === adminEmail;

  return {
    id: user.id,
    name: displayNameFromUser(user),
    email: user.email ?? "",
    role: isAdmin ? "admin" : "user",
    subscriptionTier: isAdmin ? "premium" : "free",
  };
}

export async function signUpWithPassword(input: { email: string; password: string; displayName: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithPassword(input: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    throw error;
  }
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });

  if (error) {
    throw error;
  }
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
}

export async function getRestoredSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session?.user ? mapAuthUser(data.session.user) : null;
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, user: SessionUser | null) => void,
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user ? mapAuthUser(session.user) : null);
  });
}
