import Link from "next/link";
import {ClosureForms} from "./closure-forms";
import { ComplaintPhoto } from "../../complaint-photo";
import { notFound } from "next/navigation";
import { requireProfile } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{submitted?:string}>}) {
 await requireProfile("CITIZEN");
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))notFound();
 const supabase=await createClient();
 const {data:issue,error}=await supabase.from("issues").select("*").eq("id",id).maybeSingle();
 if(error)throw new Error("Report could not be loaded");
 if(!issue)notFound();
 const [{data:history,error:historyError},{data:category},{data:comments,error:commentsError}]=await Promise.all([
 supabase.from("status_history").select("id,to_status,note,actor_name,created_at").eq("issue_id",id).order("created_at"),
 supabase.from("categories").select("name").eq("id",issue.category_id).maybeSingle(),
 supabase.from("comments").select("id,author_name,body,created_at").eq("issue_id",id).eq("visibility","CITIZEN").order("created_at")
 ]);
 const {data:feedback}=await supabase.from("feedback").select("rating").eq("issue_id",id).maybeSingle();
 const submitted=(await searchParams).submitted==="1";
 return <main id="main"><Link href="/citizen">← My complaints</Link>{submitted&&<p className="success" role="status">Your report has been saved. Reference CC-{String(issue.reference_no).padStart(6,"0")}.</p>}
 <p className="eyebrow">CC-{String(issue.reference_no).padStart(6,"0")}</p><h1>{issue.title}</h1><span className="status">{issue.status.replaceAll("_"," ")}</span>
 <div className="workspace report-detail"><section className="panel"><h2>Report details</h2><p className="preserve-lines">{issue.description}</p>
 <ComplaintPhoto id={id} title={issue.title}/>
 { ["RESOLVED","CLOSED","REOPENED"].includes(issue.status)&&<><h3>Resolution evidence</h3><ComplaintPhoto id={id} title="Resolution evidence" purpose="RESOLUTION"/></> }
 <dl><dt>Category</dt><dd>{category?.name||"Category unavailable"}</dd><dt>Location</dt><dd>{issue.address}</dd><dt>Coordinates</dt><dd>{issue.lat}, {issue.lng}</dd><dt>Ward</dt><dd>{issue.ward_id?"Assigned":"Pending geographic routing"}</dd></dl><h2>Staff updates</h2>{commentsError?<p>Updates could not be loaded.</p>:!comments?.length?<p>No staff updates yet.</p>:comments.map(c=><article className="issue" key={c.id}><strong>{c.author_name}</strong><p className="preserve-lines">{c.body}</p><small>{new Date(c.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small></article>)}</section>
 <aside className="summary"><ClosureForms id={id} status={issue.status} rating={feedback?.rating??null}/><h2>Timeline</h2>{historyError?<p>Timeline could not be loaded. Please refresh.</p>:<ol className="timeline">{history?.map(event=><li key={event.id}><strong>{event.to_status.replaceAll("_"," ")}</strong><p>{event.note}</p><small>{event.actor_name} · {new Date(event.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small></li>)}</ol>}</aside></div></main>;
}
