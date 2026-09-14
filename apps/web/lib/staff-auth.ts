import "server-only";
import { redirect } from "next/navigation";
import { requireProfile } from "./auth";
export async function requireStaff() {
 const session=await requireProfile();
 if(session.profile.role==="CITIZEN")redirect("/citizen");
 return session;
}
