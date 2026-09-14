import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { requireProfile } from "../../lib/auth";
import { logout } from "../auth/actions";
import { statuses, type Role } from "@civicconnect/domain";
export async function StaffQueue({role,query}:{role:Role;query:Record<string,string|undefined>}) {
 const {profile}=await requireProfile(role);
 const supabase=await createClient();
 const statusLabel=(status:string)=>role==="OFFICER"&&status==="SUBMITTED"?"RECEIVED":status.replaceAll("_"," ");
 const base=role==="OFFICER"?"/officer":"/admin";
 const page=Math.max(1,Math.min(10000,Number.parseInt(query.page||"1")||1));
 const [{data:categories},{data:wards}]=await Promise.all([
 supabase.from("categories").select("id,name").eq("active",true).order("name"),
 supabase.from("wards").select("id,name").eq("active",true).order("name")]);
 let request=supabase.from("issues").select("id,reference_no,title,status,priority,address,created_at",{count:"exact"});
 if(statuses.includes(query.status as typeof statuses[number]))request=request.eq("status",query.status);
 if(["LOW","NORMAL","HIGH"].includes(query.priority||""))request=request.eq("priority",query.priority);
 if(categories?.some(c=>c.id===query.category))request=request.eq("category_id",query.category);
 if(wards?.some(w=>w.id===query.ward))request=request.eq("ward_id",query.ward);
 if(query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from) && Number.isFinite(Date.parse(query.from)))request=request.gte("created_at",query.from+"T00:00:00Z");
 if(role==="OFFICER"&&query.scope==="assigned"){
  const {data:assigned,error:assignmentError}=await supabase.from("assignments").select("issue_id").eq("officer_id",profile.user_id).is("ended_at",null);
  if(assignmentError)throw new Error("Assignments could not be loaded");
  request=request.in("id",(assigned||[]).map(a=>a.issue_id));
 }
 const {data:issues,error,count}=await request.order("created_at",{ascending:false}).order("id").range((page-1)*20,page*20-1);
 function pageUrl(next:number){const params=new URLSearchParams();for(const [key,value] of Object.entries(query))if(value&&key!=="page")params.set(key,value);params.set("page",String(next));return base+"?"+params;}
 return <><header><Link className="brand" href={base}><span className="mark">C</span>CivicConnect</Link><span className="pill">{role==="OFFICER"?"Municipal officer":"Administrator"}</span><form action={logout}><button className="secondary">Sign out</button></form></header>
 <main id="main"><p className="eyebrow">MUNICIPAL OPERATIONS</p><h1>{role==="OFFICER"?"All citizen reports":"All reports & triage"}</h1><p>Welcome, {profile.display_name}. {role==="OFFICER"?"View every citizen report. Update progress and resolve the reports assigned to you.":"Review reports across all departments and assign the responsible officer."}</p>
 <form className="queue-filters" action={base}>{role==="OFFICER"&&<label>Show<select name="scope" defaultValue={query.scope||"all"}><option value="all">All reports</option><option value="assigned">Assigned to me</option></select></label>}<label>Status<select name="status" defaultValue={query.status||""}><option value="">All statuses</option>{statuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label><label>Category<select name="category" defaultValue={query.category||""}><option value="">All categories</option>{categories?.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Ward<select name="ward" defaultValue={query.ward||""}><option value="">All wards</option>{wards?.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></label><label>Priority<select name="priority" defaultValue={query.priority||""}><option value="">All priorities</option>{["LOW","NORMAL","HIGH"].map(p=><option key={p}>{p}</option>)}</select></label><label>From date (UTC)<input name="from" type="date" defaultValue={query.from||""}/></label><button>Apply filters</button><Link href={base}>Reset</Link></form>
 {error?<section className="panel compact"><h2>Queue could not be loaded</h2><p>Try again shortly. The municipal workflow migration must be applied to enable staff access.</p></section>:!issues?.length?<section className="panel compact"><h2>No reports in this queue</h2><p>New or assigned reports will appear here. Try clearing your filters.</p></section>:<div className="staff-queue">{issues.map(issue=><article className="panel compact" key={issue.id}><span className="status">{statusLabel(issue.status)}</span><p className="eyebrow">CC-{String(issue.reference_no).padStart(6,"0")} · {issue.priority} PRIORITY</p><h2><Link href={"/staff/issues/"+issue.id}>{issue.title}</Link></h2><p>{issue.address}</p><small>Received {new Date(issue.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small></article>)}</div>}
 <nav className="auth-links" aria-label="Queue pages">{page>1&&<Link href={pageUrl(page-1)}>Previous</Link>}{count!=null&&page*20<count&&<Link href={pageUrl(page+1)}>Next</Link>}<Link href="/update-password">Change password</Link></nav></main></>;
}
