"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
export function NotificationBell(){
 const [count,setCount]=useState<number|null>(null);const path=usePathname();
 useEffect(()=>{
 const controller=new AbortController();let busy=false;
 async function refresh(){if(busy||document.visibilityState==="hidden")return;busy=true;try{const response=await fetch("/citizen/notifications/count",{cache:"no-store",signal:controller.signal});if(response.ok){const data=await response.json();setCount(data.count);}else setCount(null);}catch{if(!controller.signal.aborted)setCount(null);}finally{busy=false;}}
 void refresh();const timer=setInterval(refresh,15000);window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
 return()=>{controller.abort();clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[path]);
 const label=count===null?"Notifications":`Notifications, ${count} unread`;
 return <Link href="/citizen/notifications" className="notification-bell" aria-label={label} title={label}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>{count!==null&&count>0&&<span className="notification-count" aria-hidden="true">{count>99?"99+":count}</span>}</Link>;
}
