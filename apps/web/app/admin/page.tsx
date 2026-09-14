import { redirect } from "next/navigation";
import { requireStaff } from "../../lib/staff-auth";
import { StaffQueue } from "../staff/queue";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const {profile}=await requireStaff();
 if(profile.role==="OFFICER")redirect("/officer");
 return <StaffQueue role={profile.role} query={await searchParams}/>;
}
