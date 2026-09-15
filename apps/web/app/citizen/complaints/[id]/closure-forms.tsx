"use client";
import {useActionState,useState,useEffect} from "react";
import {closeReport} from "./closure-actions";
function ResponseForm({id,operation}:{id:string;operation:"CONFIRM"|"REOPEN"|"RATE"}){
 const [request,setRequest]=useState("");
 useEffect(()=>setRequest(crypto.randomUUID()),[]);
 const [state,action,pending]=useActionState(closeReport,{message:""});
 return <form action={action} className="panel compact"><input type="hidden" name="issue" value={id}/><input type="hidden" name="request" value={request}/><input type="hidden" name="operation" value={operation}/>
 {operation==="RATE"&&<label>Service rating<select name="rating" required defaultValue=""><option value="" disabled>Choose a rating</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>}
 {operation!=="CONFIRM"&&<label>{operation==="REOPEN"?"What still needs fixing?":"Feedback (optional)"}<textarea name="note" maxLength={2000} minLength={operation==="REOPEN"?10:undefined} required={operation==="REOPEN"}/></label>}
 <button disabled={pending||!request}>{pending?"Saving…":operation==="CONFIRM"?"Confirm resolution and close":operation==="REOPEN"?"Reopen complaint":"Submit rating"}</button>{state.message&&<p role="status">{state.message}</p>}</form>;
}
export function ClosureForms({id,status,rating}:{id:string;status:string;rating:number|null}){
 return <section><h2>Your response</h2>{status==="RESOLVED"?<><p>Check the resolution photo and updates. Confirm if the problem is fixed, or explain what remains. Reopening is available for a limited period after resolution.</p><ResponseForm id={id} operation="CONFIRM"/><ResponseForm id={id} operation="REOPEN"/></>:status==="CLOSED"?(rating?<p>Your service rating: {rating} / 5. Thank you for your feedback.</p>:<ResponseForm id={id} operation="RATE"/>):<p>You can respond once staff mark this complaint resolved.</p>}</section>;
}
