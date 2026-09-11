import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { roleHome, type Role } from "@civicconnect/domain";
export async function requireProfile(allowed?: Role) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile, error } = await supabase.from("profiles")
    .select("user_id,display_name,role,department_id,active").eq("user_id", user.id).single();
  if (error || !profile) redirect("/account/unavailable");
  if (!profile.active) redirect("/account/unavailable");
  if (!(profile.role in roleHome)) redirect("/account/unavailable");
  const role = profile.role as Role;
  if (allowed && role !== allowed) redirect(roleHome[role]);
  return { user, profile: { ...profile, role } };
}

