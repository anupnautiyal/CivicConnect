"use client";
import {useState} from "react";
export function ComplaintPhoto({id,title}:{id:string;title:string}) {
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 return <div className="complaint-photo">{failed?<div className="photo-unavailable"><p>Photo could not be loaded.</p><button type="button" className="secondary" onClick={()=>{setAttempt(n=>n+1);setFailed(false);}}>Retry photo</button></div>:
 <img src={"/citizen/complaints/"+id+"/photo?attempt="+attempt} alt={"Uploaded photo: "+title} loading="lazy" onError={()=>setFailed(true)}/>}</div>;
}

