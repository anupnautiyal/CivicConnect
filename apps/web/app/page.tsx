import Link from "next/link";
export default function Home() {
  return <><header><Link className="brand" href="/"><span className="mark">C</span>CivicConnect</Link><Link className="pill" href="/login">Sign in</Link></header><main id="main"><p className="eyebrow">YOUR NEIGHBOURHOOD, CONNECTED</p><h1>Better streets start here.</h1><p>One place to report local problems and follow their resolution.</p><section className="panel"><h2>Start with your account</h2><p>Create a citizen account or sign in to your workspace. Photo reporting is coming in the next milestone.</p><nav className="auth-links"><Link className="button-link" href="/register">Create an account</Link><Link href="/login">Sign in</Link><Link href="/demo">Explore the demo</Link></nav></section></main></>;
}
