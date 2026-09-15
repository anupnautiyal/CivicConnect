import Link from "next/link";
import { ComplaintPhoto } from "./complaint-photo";
import { requireProfile } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";

export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}) {
 const {profile}=await requireProfile("CITIZEN");
 const query=await searchParams;
 const page=Math.min(10000,Math.max(1,Number.parseInt(query.page||"1",10)||1));
 const supabase=await createClient();
 const {data,error,count}=await supabase.from("issues").select("id,reference_no,title,status,address,created_at",{count:"exact"})
 .order("created_at",{ascending:false}).order("id").range((page-1)*10,page*10-1);
 return <>
 <main id="main"><div className="heading"><div><p className="eyebrow">YOUR COMMUNITY WORKSPACE</p><h1>My complaints</h1><p>Welcome, {profile.display_name}. Follow your reports here.</p></div><Link className="button-link" href="/citizen/report">Report an issue</Link></div>
 {error?<section className="panel"><h2>Reports are temporarily unavailable</h2><p>Try refreshing in a moment. If reporting was just enabled, the database migration may still be pending.</p></section>:!data?.length?<section className="panel"><h2>{page===1?"No reports yet":"No reports on this page"}</h2><p>{page===1?"Report a local issue with a photograph and location to begin tracking it here.":"Return to an earlier page to view your reports."}</p></section>:<div className="complaint-list">{data.map(issue=><article className="panel complaint-card" key={issue.id}><ComplaintPhoto id={issue.id} title={issue.title}/><div className="complaint-card-body"><span className="status">{issue.status.replaceAll("_"," ")}</span><p className="eyebrow">CC-{String(issue.reference_no).padStart(6,"0")}</p><h2><Link href={"/citizen/complaints/"+issue.id}>{issue.title}</Link></h2><p>{issue.address}</p><small>Submitted {new Date(issue.created_at).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</small><p><Link href={"/citizen/complaints/"+issue.id}>View report and timeline →</Link></p></div></article>)}</div>}
 <nav className="auth-links" aria-label="Complaint pages">{page>1&&<Link href={"/citizen?page="+(page-1)}>Previous page</Link>}{count!==null&&count!==undefined&&page*10<count&&<Link href={"/citizen?page="+(page+1)}>Next page</Link>}<Link href="/citizen/notifications">Notifications</Link><Link href="/update-password">Change password</Link></nav></main></>;
}
