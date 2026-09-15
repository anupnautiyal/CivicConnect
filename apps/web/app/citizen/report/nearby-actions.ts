"use server";
import {requireProfile} from "../../../lib/auth";
import {createClient} from "../../../lib/supabase/server";
export async function nearby(category:string,lat:number,lng:number){
 await requireProfile("CITIZEN");const client=await createClient();
 const {data,error}=await client.rpc("nearby_reports",{p_category:category,p_lat:lat,p_lng:lng});
 if(error)return {error:"Nearby reports could not be loaded. You can still submit your report.",reports:[]};
 return {error:"",reports:data as {id:string;reference_no:number;status:string;distance_m:number;support_count:number;supported:boolean}[]};
}
export async function support(id:string,category:string,lat:number,lng:number){
 await requireProfile("CITIZEN");const client=await createClient();
 const {error}=await client.rpc("support_report",{p_issue:id,p_category:category,p_lat:lat,p_lng:lng});
 return {message:error?(error.code==="P0001"?error.message:"Could not save support. Try again."):"Your support is recorded. You do not need to submit another report for the same issue."};
}
