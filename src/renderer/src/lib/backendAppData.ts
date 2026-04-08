import { createInitialUserData, type SessionUser, type UserAppData } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

type ProfileRecord = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
};

type UserAppDataRow = {
  user_id: string;
  data: UserAppData;
  updated_at?: string;
};

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("id, email, display_name, created_at").eq("id", userId).maybeSingle<ProfileRecord>();
  if (error) {
    throw error;
  }

  return data ?? null;
}

export function applyProfileToSessionUser(user: SessionUser, profile: ProfileRecord | null): SessionUser {
  return {
    ...user,
    name: profile?.display_name?.trim() || user.name,
    email: profile?.email?.trim() || user.email,
  };
}

export async function fetchUserAppData(userId: string) {
  const { data, error } = await supabase.from("user_app_data").select("user_id, data, updated_at").eq("user_id", userId).maybeSingle<UserAppDataRow>();
  if (error) {
    throw error;
  }

  return data?.data ?? createInitialUserData();
}

export async function saveUserAppData(userId: string, nextData: UserAppData) {
  const payload: UserAppDataRow = {
    user_id: userId,
    data: nextData,
  };

  const { error } = await supabase.from("user_app_data").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    throw error;
  }
}
