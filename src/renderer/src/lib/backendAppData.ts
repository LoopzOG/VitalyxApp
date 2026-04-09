import { createInitialUserData, type SessionUser, type UserAppData } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

type ProfileRecord = {
  id: string;
  email: string;
  display_name: string;
  role: SessionUser["role"];
  subscription_tier: SessionUser["subscriptionTier"];
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  subscription_status?: string | null;
  created_at: string;
};

type UserAppDataRow = {
  user_id: string;
  data: UserAppData;
  updated_at?: string;
};

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, subscription_tier, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRecord>();
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
    role: profile?.role ?? user.role,
    subscriptionTier: profile?.subscription_tier ?? user.subscriptionTier,
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

export async function updateUserAccessProfile(
  userId: string,
  updates: Partial<Pick<ProfileRecord, "role" | "subscription_tier" | "display_name" | "email">>,
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, email, display_name, role, subscription_tier, created_at")
    .single<ProfileRecord>();

  if (error) {
    throw error;
  }

  return data;
}
