"use client";
import {useState,useTransition} from "react";
import {nearby,support} from "./nearby-actions";
export function NearbyReports({category,lat,lng}:{category:string;lat:string;lng:string}){
 const [result,setResult]=useState<Awaited<ReturnType<typeof nearby>>|null>(null);
 const [message,setMessage]=useState("");const [pending,start]=useTransition();
 return <section><h3>Check for an existing report</h3><p>Look for reports in this category within 500 metres. Support an existing report if it covers the same problem.</p><button type="button" disabled={pending||!category||!lat||!lng} onClick={()=>start(async()=>{try{setResult(await nearby(category,Number(lat),Number(lng)));}catch{setMessage("Could not load nearby reports. Try again.");}})}>Check nearby reports</button>{result?.error&&<p role="alert">{result.error}</p>}{result&&!result.error&&!result.reports.length&&<p>No matching open reports found.</p>}{result?.reports.map(r=><article key={r.id}><p>CC-{String(r.reference_no).padStart(6,"0")} · {r.status.replaceAll("_"," ")} · About {r.distance_m} m away · {r.support_count} supporters</p><button type="button" disabled={pending||r.supported} onClick={()=>start(async()=>{try{setMessage((await support(r.id,category,Number(lat),Number(lng))).message);setResult(await nearby(category,Number(lat),Number(lng)));}catch{setMessage("Support could not be saved. Try again.");}})}>{r.supported?"Supported":"Support this report"}</button></article>)}{message&&<p role="status">{message}</p>}</section>;
}
