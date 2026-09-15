import Link from "next/link";
import {revalidatePath} from "next/cache";
import {requireProfile} from "../../../lib/auth";
import {createClient} from "../../../lib/supabase/server";
async function markRead(form:FormData){
 "use server";
 await requireProfile("CITIZEN");const client=await createClient();
 const {error}=await client.rpc("mark_notification_read",{p_id:String(form.get("id")||"")});
 if(error)throw new Error("Could not mark notification as read");revalidatePath("/citizen/notifications");
}
export default async function Page(){
 await requireProfile("CITIZEN");const client=await createClient();
 const {data,error}=await client.from("notifications").select("id,issue_id,event_type,created_at,read_at").order("created_at",{ascending:false}).limit(100);
 const issueIds=[...new Set((data??[]).map(n=>n.issue_id))];
 const {data:issues,error:issueError}=issueIds.length?await client.from("issues").select("id,reference_no").in("id",issueIds):{data:[],error:null};
 const references=new Map((issues??[]).map(issue=>[issue.id,`CC-${String(issue.reference_no).padStart(6,"0")}`]));
 const messages:Record<string,string>={SUBMITTED:"has been submitted",VERIFIED:"has been verified",ASSIGNED:"has been assigned to an officer",IN_PROGRESS:"is now in progress",RESOLVED:"has been resolved",REOPENED:"has been reopened",CLOSED:"has been closed",REJECTED:"has been rejected"};
 return <main id="main"><Link href="/citizen">← My complaints</Link><h1>Notifications</h1><p>Your latest 100 complaint updates.</p>{error||issueError?<p>Notifications are temporarily unavailable. Please try again later.</p>:!data?.length?<p>No updates yet. New complaint status changes will appear here.</p>:data.map(n=><article className="panel compact" key={n.id}><h2>Complaint {references.get(n.issue_id)??"(reference unavailable)"} {messages[n.event_type]??"has an update"}</h2><p>{new Date(n.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p><Link href={"/citizen/complaints/"+n.issue_id}>View complaint</Link>{!n.read_at&&<form action={markRead}><input type="hidden" name="id" value={n.id}/><button>Mark as read</button></form>}</article>)}</main>;
}
