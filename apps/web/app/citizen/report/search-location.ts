"use server";
import { requireProfile } from "../../../lib/auth";
import { z } from "zod";
const responseSchema=z.object({features:z.array(z.object({
 geometry:z.object({coordinates:z.tuple([z.number().min(-180).max(180),z.number().min(-90).max(90)])}),
 properties:z.record(z.string(),z.unknown())
}))});
export type Place={label:string;lat:string;lng:string};
const cache=new Map<string,{expires:number;places:Place[]}>();
let nextRequest=0;
export async function searchLocation(query:string):Promise<{places?:Place[];error?:string}> {
 await requireProfile("CITIZEN");
 if(typeof query!=="string"||query.trim().length<3||query.length>180)return {error:"Enter a town, street or public landmark (3–180 characters)."};
 const key=query.trim().toLowerCase();
 const hit=cache.get(key);
 if(hit&&hit.expires>Date.now())return {places:hit.places};
 if(Date.now()<nextRequest)return {error:"Please wait a moment before searching again."};
 nextRequest=Date.now()+1500;
 try{
 const url=new URL(process.env.PHOTON_SEARCH_URL||"https://photon.komoot.io/api/");
 url.searchParams.set("q",query.trim());url.searchParams.set("limit","5");url.searchParams.set("lang","en");
 const response=await fetch(url,{headers:{"User-Agent":"CivicConnect/0.1 (https://github.com/anupnautiyal/CivicConnect)"},signal:AbortSignal.timeout(10000),cache:"no-store"});
 if(!response.ok)throw new Error("Search unavailable");
 const result=responseSchema.parse(await response.json());
 const places=result.features.map(feature=>{
 const p=feature.properties;
 return {label:[p.name,p.street,p.city,p.state,p.country].filter(v=>typeof v==="string").filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"Map location",
 lat:String(feature.geometry.coordinates[1]),lng:String(feature.geometry.coordinates[0])};
 });
 if(cache.size>=100)cache.delete(cache.keys().next().value!);
 cache.set(key,{places,expires:Date.now()+3600000});
 return {places};
 }catch{return {error:"Place search is unavailable. Move the map to your area and select the issue location, or enter coordinates."};}
}

