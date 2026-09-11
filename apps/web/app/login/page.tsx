import { AuthForm } from "../auth/auth-form";
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <>{error && <p className="notice" role="alert">{error === "logout" ? "Sign-out could not be completed. Please try again from your account." : "That confirmation link could not be verified. It may have expired or been opened in another browser. Try signing in or request a new recovery link."}</p>}<AuthForm mode="login"/></>;
}

