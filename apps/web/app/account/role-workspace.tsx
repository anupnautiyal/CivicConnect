import Link from "next/link";
import { requireProfile } from "../../lib/auth";
import { logout } from "../auth/actions";
import type { Role } from "@civicconnect/domain";
const content = {
  CITIZEN: { title: "Your community workspace", label: "Citizen", text: "Your account is ready. Reporting with a photograph and location arrives in the next milestone." },
  OFFICER: { title: "Your assigned work", label: "Municipal officer", text: "Your staff access is active. Assignment queues and resolution tools arrive in Sprint 3." },
  DEPARTMENT_ADMIN: { title: "Department workspace", label: "Department administrator", text: "Your department access is active. Triage and officer assignment arrive in Sprint 3." },
  SYSTEM_ADMIN: { title: "Platform administration", label: "System administrator", text: "Your administrator access is active. Configuration management will be added in the next implementation slice." }
};
export async function RoleWorkspace({ role }: { role: Role }) {
  const { profile } = await requireProfile(role);
  const view = content[role];
  return <><header><Link className="brand" href="/account"><span className="mark">C</span>CivicConnect</Link><span className="pill">{view.label}</span><form action={logout}><button className="secondary">Sign out</button></form></header>
    <main id="main"><p className="eyebrow">{view.label.toUpperCase()}</p><h1>{view.title}</h1><p>Welcome, {profile.display_name}.</p><section className="panel"><h2>Account connected</h2><p>{view.text}</p><nav className="auth-links"><Link href="/update-password">Change password</Link><Link href="/demo">Explore the sample reporting flow</Link></nav></section></main></>;
}

