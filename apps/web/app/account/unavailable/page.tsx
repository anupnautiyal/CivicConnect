import Link from "next/link";
import { logout } from "../../auth/actions";
export default function Page() {
  return <main id="main" className="auth-main"><section className="panel"><h1>Account access unavailable</h1><p>Your profile may not be ready or your account may be inactive. Please contact the project administrator.</p><Link href="/account">Try again</Link><form action={logout}><button>Sign out</button></form></section></main>;
}

