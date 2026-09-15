import Link from "next/link";
import {logout} from "../auth/actions";
import {NotificationBell} from "./notification-bell";
export default function Layout({children}:{children:React.ReactNode}){
 return <><header><Link href="/citizen" className="brand"><span className="mark">C</span>CivicConnect</Link><div className="citizen-nav-actions"><span className="pill">Citizen</span><NotificationBell/><form action={logout}><button className="secondary">Sign out</button></form></div></header>{children}</>;
}
