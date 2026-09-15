import Link from "next/link";
import {requireProfile} from "../../lib/auth";
import {createClient} from "../../lib/supabase/server";
import {roleHome} from "@civicconnect/domain";
import {ProfileMenu} from "../components/profile-menu";
export default async function Page(){
 const {profile,user}=await requireProfile();const client=await createClient();
 const {data:request,error}=await client.from("staff_access_requests").select("requested_role,status,organisation").eq("user_id",user.id).maybeSingle();
 return <><header><Link href={roleHome[profile.role]} className="brand"><span className="mark">C</span>CivicConnect</Link><ProfileMenu name={profile.display_name} role={profile.role}/></header><main id="main"><p className="eyebrow">YOUR SPACE</p><h1>My profile</h1><section className="panel compact profile-card"><span className="avatar avatar-large" aria-hidden="true">{profile.display_name.slice(0,1).toUpperCase()}</span><h2>{profile.display_name}</h2><p>{user.email}</p><span className="status">{profile.role==="DEPARTMENT_ADMIN"?"Administrator":profile.role.replaceAll("_"," ")}</span><dl><dt>Email verification</dt><dd>{user.email_confirmed_at?"Verified":"Pending confirmation"}</dd></dl>{request&&<div className="access-note"><h3>Staff access request</h3><p>{request.requested_role==="DEPARTMENT_ADMIN"?"Administrator":"Officer"} · {request.organisation}</p><span className="status">{request.status}</span>{request.status==="PENDING"&&<p>Your citizen workspace remains available while your employment is verified.</p>}</div>}{error&&<p className="hint">Staff request status is temporarily unavailable.</p>}<nav className="auth-links"><Link className="button-link" href={roleHome[profile.role]}>Open workspace ↗</Link><Link href="/update-password">Change password</Link></nav></section></main></>;
}
