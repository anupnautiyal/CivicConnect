"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, register, recover, updatePassword, type AuthState } from "./actions";
const variants = {
  login: { title: "Welcome back", description: "Sign in to follow your reports and access your workspace.", label: "Sign in", action: login },
  register: { title: "Join your community", description: "Create a citizen account to report and track local issues.", label: "Create account", action: register },
  recover: { title: "Reset your password", description: "We’ll send a recovery link to your email address.", label: "Send recovery link", action: recover },
  update: { title: "Choose a new password", description: "Use at least 12 characters for your new password.", label: "Update password", action: updatePassword }
};
export function AuthForm({ mode }: { mode: keyof typeof variants }) {
  const view = variants[mode];
  const [state, action, pending] = useActionState<AuthState, FormData>(view.action, {});
  return <main id="main" className="auth-main"><Link className="brand" href="/"><span className="mark">C</span>CivicConnect</Link>
    <section className="panel auth-panel"><p className="eyebrow">COMMUNITY SERVICES</p><h1>{view.title}</h1><p className="muted">{view.description}</p>
      <form action={action}>
        {mode === "register" && <label>Full name<input name="name" autoComplete="name" required maxLength={120}/></label>}
        {mode !== "update" && <label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254}/></label>}
        {mode !== "recover" && <label>Password<input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 12} maxLength={128}/></label>}
        {mode === "update" && <label>Confirm password<input type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={128}/></label>}
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        {state.message && <p className="success" role="status">{state.message}</p>}
        <button type="submit" disabled={pending}>{pending ? "Please wait…" : view.label}</button>
      </form>
      <nav className="auth-links" aria-label="Account options">
        {mode !== "login" && <Link href="/login">Sign in</Link>}
        {mode === "login" && <><Link href="/register">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></>}
        {mode === "update" && <Link href="/account">Return to account</Link>}
        <Link href="/demo">Explore the sample flow</Link>
      </nav>
    </section></main>;
}

