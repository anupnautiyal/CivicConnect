import Link from "next/link";
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
 const [{data:history,error:historyError},{data:category}]=await Promise.all([
 supabase.from("status_history").select("id,to_status,note,created_at").eq("issue_id",id).order("created_at"),
 supabase.from("categories").select("name").eq("id",issue.category_id).maybeSingle()
 ]);
 const submitted=(await searchParams).submitted==="1";
 return <main id="main"><Link href="/citizen">← My complaints</Link>{submitted&&<p className="success" role="status">Your report has been saved. Reference CC-{String(issue.reference_no).padStart(6,"0")}.</p>}
 <p className="eyebrow">CC-{String(issue.reference_no).padStart(6,"0")}</p><h1>{issue.title}</h1><span className="status">{issue.status.replaceAll("_"," ")}</span>
 <div className="workspace report-detail"><section className="panel"><h2>Report details</h2><p className="preserve-lines">{issue.description}</p>
 <ComplaintPhoto id={id} title={issue.title}/>
 <dl><dt>Category</dt><dd>{category?.name||"Category unavailable"}</dd><dt>Location</dt><dd>{issue.address}</dd><dt>Coordinates</dt><dd>{issue.lat}, {issue.lng}</dd><dt>Ward</dt><dd>{issue.ward_id?"Assigned":"Pending geographic routing"}</dd></dl></section>
 <aside className="summary"><h2>Timeline</h2>{historyError?<p>Timeline could not be loaded. Please refresh.</p>:<ol className="timeline">{history?.map(event=><li key={event.id}><strong>{event.to_status.replaceAll("_"," ")}</strong><p>{event.note}</p><small>{new Date(event.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small></li>)}</ol>}</aside></div></main>;
}

