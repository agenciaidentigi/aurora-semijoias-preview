import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", userData.user.id)
    .single();

  return (data as Profile | null) ?? null;
}

export async function requireAdmin(allowedRoles: Role[] = ["admin", "editor", "analyst"]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || !allowedRoles.includes(profile.role)) {
    redirect("/login?next=/admin");
  }
  return profile;
}

export function canWrite(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}