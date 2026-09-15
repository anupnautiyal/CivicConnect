import Link from "next/link";
import {logout} from "../auth/actions";
export function ProfileMenu({name,role}:{name:string;role:string}){
 const initials=name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase()||"U";
 return <details className="profile-menu"><summary aria-label="Open my profile"><span className="avatar">{initials}</span><span className="profile-name">{name}</span><span aria-hidden="true">⌄</span></summary><div className="profile-popover"><strong>{name}</strong><small>{role==="DEPARTMENT_ADMIN"?"Administrator":role.toLowerCase().replaceAll("_"," ")}</small><Link href="/profile">My profile ↗</Link><Link href="/update-password">Change password</Link><form action={logout}><button className="secondary">Sign out</button></form></div></details>;
}
