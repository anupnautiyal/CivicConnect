"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";
export type AuthState = { error?: string; message?: string };
const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.");
function callback(next = "/account") {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("APP_ORIGIN is not configured.");
  return new URL("/auth/callback?next=" + encodeURIComponent(next), origin).toString();
}
export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(form.get("email"));
  const password = z.string().min(1).max(128).safeParse(form.get("password"));
  if (!email.success || !password.success) return { error: "Enter a valid email and password." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
    if (error) return { error: "Sign-in failed. Check your details and confirm your email before trying again." };
  } catch { return { error: "Sign-in is temporarily unavailable. Please try again." }; }
  redirect("/account");
}
export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const input = z.object({ email: emailSchema, password: passwordSchema, name: z.string().trim().min(1).max(120) })
    .safeParse({ email: form.get("email"), password: form.get("password"), name: form.get("name") });
  if (!input.success) return { error: input.error.issues[0].message };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: input.data.email, password: input.data.password,
      options: { data: { display_name: input.data.name }, emailRedirectTo: callback() }
    });
    if (error) return { error: "Registration could not be completed. Try again later or sign in if you already have an account." };
    return { message: "Check your email for a confirmation link. Open it in this browser, then sign in. If you already have an account, use sign in or password recovery." };
  } catch { return { error: "Registration is temporarily unavailable. Please try again." }; }
}
export async function recover(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: callback("/update-password") });
    if (error) return { error: "A recovery request could not be processed. Please try again later." };
    return { message: "If this address has an account, a recovery link will arrive shortly. Open it in this browser." };
  } catch { return { error: "Password recovery is temporarily unavailable." }; }
}
export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  if (password.data !== form.get("confirmPassword")) return { error: "Passwords do not match." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: "Your session has expired. Request a new recovery link." };
    const { error } = await supabase.auth.updateUser({ password: password.data });
    if (error) return { error: "The password could not be updated. Try a different password or request a fresh recovery link." };
    return { message: "Password updated. You can return to your account." };
  } catch { return { error: "Password update is temporarily unavailable." }; }
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/login?error=logout");
  redirect("/login");
}

