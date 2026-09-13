"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReport, type ReportState } from "./actions";
import { LocationPicker } from "./location-picker";
export function ReportForm({ categories }: { categories:{id:string;name:string}[] }) {
 const router = useRouter();
 const [id,setId] = useState("");
 const [point,setPoint] = useState({lat:"",lng:"",accuracy:""});
 const [preview,setPreview] = useState("");
 const [photoError,setPhotoError] = useState("");
 const [state,setState] = useState<ReportState>({});
 const [pending,startTransition] = useTransition();
 useEffect(()=>setId(crypto.randomUUID()),[]);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 useEffect(()=>{if(state.id)router.push("/citizen/complaints/"+state.id+"?submitted=1");},[state.id,router]);
 return <form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);startTransition(async()=>{try{setState(await submitReport({},data));}catch{setState({error:"Submission interrupted. Your form is preserved; retry or sign in again."});}});}} className="report-form"><input name="id" type="hidden" value={id}/>
 <fieldset disabled={pending}><legend>Report details</legend>
 <label>Title<input name="title" required minLength={5} maxLength={120} placeholder="For example: Overflowing bin on Market Road"/></label>
 <label>Category<select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Description<textarea name="description" required minLength={15} maxLength={2000} rows={5} placeholder="Describe the issue and how it affects the area."/></label>
 <label>Photograph<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e=>{
  const file=e.target.files?.[0];setPhotoError("");setPreview("");
  if(!file)return;
  if(file.size>5242880||!["image/jpeg","image/png","image/webp"].includes(file.type)){setPhotoError("Choose a JPEG, PNG, or WebP photo up to 5 MB.");e.target.value="";return;}
  setPreview(URL.createObjectURL(file));
 }}/></label><p className="hint">JPEG, PNG, or WebP · Maximum 5 MB. On mobile, choose your camera or an existing photo.</p>
 {photoError&&<p role="alert" className="auth-error">{photoError}</p>}
 {preview&&<img className="report-photo" src={preview} alt="Selected report photograph"/>}
 <LocationPicker point={point} onChange={setPoint}/>
 <label>Address or nearby landmark<input name="address" required minLength={5} maxLength={300} placeholder="Street, neighbourhood, and a nearby landmark"/></label>
 </fieldset>
 <p className="hint">Confirm the pin marks the issue. Your photograph is stored privately. Keep this page open while submitting.</p>
 {state.error&&<p className="auth-error" role="alert">{state.error}</p>}
 <button disabled={pending||!id||!categories.length} type="submit">{pending?"Uploading and saving…":"Submit report"}</button>
 </form>;
}
