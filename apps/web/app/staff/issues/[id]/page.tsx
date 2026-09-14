import Link from "next/link";
import { notFound } from "next/navigation";
import { roleHome } from "@civicconnect/domain";
import { requireStaff } from "../../../../lib/staff-auth";
import { createClient } from "../../../../lib/supabase/server";
import { ComplaintPhoto } from "../../../citizen/complaint-photo";
import { WorkflowForm } from "./workflow-form";
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {profile}=await requireStaff();const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))notFound();
 const supabase=await createClient();
 const {data:issue,error}=await supabase.from("issues").select("*").eq("id",id).maybeSingle();
 if(error)throw new Error("Report could not be loaded");if(!issue)notFound();
 const admin=profile.role==="DEPARTMENT_ADMIN"||profile.role==="SYSTEM_ADMIN";
 const [{data:history,error:historyError},{data:comments,error:commentsError},{data:assignment},{data:officers,error:officersError}]=await Promise.all([
 supabase.from("status_history").select("id,to_status,note,actor_name,created_at").eq("issue_id",id).order("created_at"),
 supabase.from("comments").select("*").eq("issue_id",id).order("created_at"),
 supabase.from("assignments").select("officer_id").eq("issue_id",id).is("ended_at",null).maybeSingle(),
 admin?supabase.rpc("assignable_officers",{p_issue:id}):Promise.resolve({data:[],error:null})]);
 const officerList=(officers||[]) as {user_id:string;display_name:string;department_name:string}[];
 const assignedName=assignment?(assignment.officer_id===profile.user_id?profile.display_name:officerList.find(o=>o.user_id===assignment.officer_id)?.display_name||"Assigned officer"):"Not assigned";
 const status=issue.status;
 const canManage=admin||(assignment?.officer_id===profile.user_id&&profile.department_id===issue.department_id);
 return <main id="main"><Link href={roleHome[profile.role]}>← Back to queue</Link><p className="eyebrow">CC-{String(issue.reference_no).padStart(6,"0")}</p><h1>{issue.title}</h1><span className="status">{status.replaceAll("_"," ")}</span>
 <div className="staff-detail"><section className="panel compact"><h2>Report details</h2><p className="preserve-lines">{issue.description}</p><ComplaintPhoto id={id} title={issue.title}/><dl><dt>Location</dt><dd>{issue.address}</dd><dt>Coordinates</dt><dd>{issue.lat}, {issue.lng}</dd><dt>Assigned to</dt><dd>{assignedName}</dd><dt>Department routing</dt><dd>{issue.department_id?"Department assigned":"Unrouted · administrator triage"}</dd></dl>
 {["RESOLVED","CLOSED","REOPENED"].includes(status)&&<><h3>Resolution evidence</h3><ComplaintPhoto id={id} title="Resolution evidence" purpose="RESOLUTION"/></>}
 <h2>Timeline</h2>{historyError?<p>Timeline is unavailable. Please refresh.</p>:<ol className="timeline">{history?.map(h=><li key={h.id}><strong>{h.to_status.replaceAll("_"," ")}</strong><p>{h.note}</p><small>{h.actor_name} · {new Date(h.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small></li>)}</ol>}
 <h2>Updates</h2>{commentsError?<p>Updates could not be loaded.</p>:!comments?.length?<p>No updates yet.</p>:comments.map(c=><article className="issue" key={c.id}><strong>{c.author_name} · {c.visibility==="STAFF"?"Internal note":"Citizen-visible update"}</strong><p className="preserve-lines">{c.body}</p><small>{new Date(c.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small></article>)}</section>
 <aside className="panel compact" key={status}><h2>Actions</h2>{!canManage&&<p>You can view this report. Updates and resolution are handled by its assigned officer or an administrator.</p>}
 {admin&&status==="SUBMITTED"&&<WorkflowForm issue={id} status={status} operation="VERIFY" label="Verify report"/>}
 {admin&&["SUBMITTED","VERIFIED"].includes(status)&&<WorkflowForm issue={id} status={status} operation="REJECT" label="Reject report"/>}
 {admin&&status==="VERIFIED"&&(officersError?<p>Officer list unavailable. Refresh to try again.</p>:<WorkflowForm issue={id} status={status} operation="ASSIGN" label="Assign officer" officers={officerList}/>)}
 {admin&&status==="ASSIGNED"&&<WorkflowForm issue={id} status={status} operation="UNASSIGN" label="Return for reassignment"/>}
 {canManage&&["ASSIGNED","REOPENED"].includes(status)&&<WorkflowForm issue={id} status={status} operation="START" label="Start work"/>}
 {canManage&&["IN_PROGRESS","REOPENED"].includes(status)&&<WorkflowForm issue={id} status={status} operation="RESOLVE" label="Resolve report"/>}
 {canManage&&!["CLOSED","REJECTED"].includes(status)&&<WorkflowForm issue={id} status={status} operation="NOTE" label="Add update"/>}
 {["CLOSED","REJECTED"].includes(status)&&<p>No further staff actions are available for this report.</p>}</aside></div></main>;
}
