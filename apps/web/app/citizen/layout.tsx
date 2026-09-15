import Link from "next/link";
import {requireProfile} from "../../lib/auth";
import {ProfileMenu} from "../components/profile-menu";
import {NotificationBell} from "./notification-bell";
export default async function Layout({children}:{children:React.ReactNode}){
 const {profile}=await requireProfile("CITIZEN");
 return <><header><Link href="/citizen" className="brand"><span className="mark">C</span>CivicConnect</Link><div className="citizen-nav-actions"><span className="pill">Citizen</span><NotificationBell/><ProfileMenu name={profile.display_name} role={profile.role}/ ></div></header>{children}</>;
}
