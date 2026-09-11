"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main"><section className="panel"><h1>We couldn’t load this page</h1><p>The connection may be temporarily unavailable. Please try again.</p><button onClick={reset}>Try again</button></section></main>;
}

