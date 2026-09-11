"use client";
import { useState } from "react";
import { canTransition, demoIssue, categories, type IssueStatus } from "@civicconnect/domain";

const steps = ["Report", "Review", "Resolve", "Confirm"];
export function DemoWorkspace() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<IssueStatus>("SUBMITTED");
  const [title, setTitle] = useState<string>(demoIssue.title);
  const [description, setDescription] = useState<string>(demoIssue.description);
  const [category, setCategory] = useState<string>("Sanitation");
  const [history, setHistory] = useState<string[]>([]);
  const [rating, setRating] = useState("5");
  function advance(next: IssueStatus) {
    if (canTransition(status, next)) { setStatus(next); setHistory(items => [...items, next.replaceAll("_", " ")]); }
  }
  function reset() { setStep(0); setStatus("SUBMITTED"); setHistory([]); }
  return <>
    <header><a className="brand" href="/"> <span className="mark">C</span>CivicConnect</a><span className="header-note">Community services</span><span className="pill">Sprint 0 prototype</span></header>
    <div className="notice">Interactive demonstration · Sample data only. No account, photograph, or report is saved.</div>
    <main id="main">
      <div className="heading"><div><p className="eyebrow">YOUR NEIGHBOURHOOD, CONNECTED</p><h1>Better streets start here.</h1><p>Follow a local issue from a citizen’s report to a confirmed resolution.</p></div><button className="secondary" onClick={reset}>Restart demo</button></div>
      <nav aria-label="Demonstration steps" className="steps">{steps.map((label, index) => <button key={label} aria-current={index === step ? "step" : undefined} onClick={() => setStep(index)}><span>{index + 1}</span>{label}<small>{["Citizen", "Department admin", "Officer", "Citizen"][index]}</small></button>)}</nav>
      <div className="workspace"><section className="panel">
        {step === 0 && <><p className="eyebrow">01 / CITIZEN</p><h2>Report a local issue</h2><p className="muted">Try the reporting flow with our sample sanitation issue.</p><form onSubmit={event => { event.preventDefault(); setStatus("SUBMITTED"); setHistory(["SUBMITTED"]); setStep(1); }}>
          <label>Issue title<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item.code}>{item.name}</option>)}</select></label>
          <label>Description<textarea required minLength={15} maxLength={2000} rows={4} value={description} onChange={e => setDescription(e.target.value)} /></label>
          <div className="location"><strong>Sample location</strong><p>{demoIssue.address}</p><small>{demoIssue.ward} · Photo and map capture arrive in Sprint 2</small></div>
          <button type="submit">Preview submission <span aria-hidden="true">→</span></button>
        </form></>}
        {step === 1 && <><p className="eyebrow">02 / DEPARTMENT ADMIN</p><h2>Review incoming report</h2><p className="muted">Check the category and verify the issue before assigning work.</p><Issue title={title} description={description} category={category}/><div className="actions"><button disabled={status !== "SUBMITTED"} onClick={() => advance("VERIFIED")}>Verify report</button><button disabled={status !== "VERIFIED"} onClick={() => { advance("ASSIGNED"); setStep(2); }}>Assign demo officer</button></div><p className="hint">The demo follows the status rules in the project plan.</p></>}
        {step === 2 && <><p className="eyebrow">03 / MUNICIPAL OFFICER</p><h2>Take action, share progress</h2><Issue title={title} description={description} category={category}/><div className="location"><strong>Sample resolution evidence</strong><p>“The bin has been emptied and the surrounding footpath cleaned.”</p><small>Prototype only. A real resolution will require an uploaded photograph.</small></div><div className="actions"><button disabled={status !== "ASSIGNED"} onClick={() => advance("IN_PROGRESS")}>Start work</button><button disabled={status !== "IN_PROGRESS"} onClick={() => { advance("RESOLVED"); setStep(3); }}>Preview resolution</button></div></>}
        {step === 3 && <><p className="eyebrow">04 / CITIZEN</p><h2>Has the issue been resolved?</h2><p>Review the officer’s update and confirm the outcome.</p><Issue title={title} description="The bin has been emptied and the surrounding footpath cleaned." category={category}/><label>Sample service rating<select value={rating} onChange={e => setRating(e.target.value)}>{[5,4,3,2,1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label><button disabled={status !== "RESOLVED"} onClick={() => advance("CLOSED")}>Confirm resolution</button>{status === "CLOSED" && <p className="success" role="status">Demo completed. Your sample rating: {rating}/5.</p>}<p className="hint">Reopening with a reason will be implemented in Sprint 4.</p></>}
      </section><aside><section className="summary"><p className="eyebrow">REPORT TRACKER</p><h2>{demoIssue.reference}</h2><span className="status" role="status">{history.length ? status.replaceAll("_", " ") : "DRAFT PREVIEW"}</span><dl><dt>Ward</dt><dd>{demoIssue.ward}</dd><dt>Category</dt><dd>{category}</dd><dt>Department</dt><dd>{({ Sanitation: "Sanitation", "Roads and footpaths": "Public Works", "Water and drainage": "Water Services", "Street lighting": "Street Lighting" } as Record<string, string>)[category]}</dd></dl><h3>Activity</h3>{history.length ? <ol className="timeline">{history.map((item,index) => <li key={index}>{item}</li>)}</ol> : <p className="muted">Preview a submission to begin the timeline.</p>}</section><p className="aside-note">A clear record at every step.<br/>Real access controls and immutable history will be enforced by the backend.</p></aside></div>
    </main><footer>CivicConnect <span>Discovery & foundation · September 2026</span></footer>
  </>;
}
function Issue({title, description, category}: {title: string; description: string; category: string}) {
  return <article className="issue"><span className="eyebrow">{category}</span><h3>{title}</h3><p>{description}</p><small>{demoIssue.address}</small></article>;
}
