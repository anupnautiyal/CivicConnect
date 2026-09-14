"use client";
import {useEffect,useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {applyWorkflow,type WorkflowResult} from "./actions";
type Officer={user_id:string;display_name:string;department_name:string};
export function WorkflowForm({issue,status,operation,label,officers=[]}:{issue:string;status:string;operation:string;label:string;officers?:Officer[]}){
 const [request,setRequest]=useState("");const [result,setResult]=useState<WorkflowResult>({});
 const [pending,start]=useTransition();const router=useRouter();const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>setRequest(crypto.randomUUID()),[]);
 const noteRequired=["REJECT","UNASSIGN","RESOLVE","NOTE"].includes(operation);
 return <form ref={formRef} className="workflow-form" onSubmit={event=>{
 event.preventDefault();const form=new FormData(event.currentTarget);
 start(async()=>{try{const response=await applyWorkflow(form);setResult(response);if(response.success){setRequest(crypto.randomUUID());formRef.current?.reset();router.refresh();}}
 catch{setResult({error:"The request was interrupted. Sign in again if your session expired, or retry."});}});
 }}>
 <h3>{label}</h3><input type="hidden" name="issue" value={issue}/><input type="hidden" name="expected" value={status}/>
 <input type="hidden" name="operation" value={operation}/><input type="hidden" name="request" value={request}/>
 <fieldset disabled={pending}>
 {operation==="ASSIGN"&&<label>Officer<select name="officer" required defaultValue=""><option value="" disabled>Choose an officer</option>{officers.map(o=><option key={o.user_id} value={o.user_id}>{o.display_name} · {o.department_name}</option>)}</select></label>}
 {operation==="NOTE"&&<label>Who can see this note?<select name="visibility" defaultValue="CITIZEN"><option value="CITIZEN">Citizen and authorized staff</option><option value="STAFF">Authorized staff only</option></select></label>}
 {(noteRequired||operation==="VERIFY"||operation==="START")&&<label>{operation==="NOTE"?"Update":operation==="RESOLVE"?"Resolution note (visible to citizen)":"Reason / note (visible to citizen)"}<textarea name="note" required={noteRequired} maxLength={2000} rows={3}/></label>}
 {operation==="RESOLVE"&&<label>Resolution photograph<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required/><small>JPEG, PNG or WebP · Up to 5 MB</small></label>}
 <button disabled={!request||pending||(operation==="ASSIGN"&&!officers.length)}>{pending?"Saving…":label}</button>
 </fieldset>{operation==="ASSIGN"&&!officers.length&&<p>No active officers are available for this department.</p>}
 {result.error&&<p className="auth-error" role="alert">{result.error}</p>}{result.success&&<p className="success" role="status">Saved.</p>}
 </form>;
}
