import Link from "next/link";
import { requireProfile } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { ReportForm } from "./report-form";
export default async function Page() {
 await requireProfile("CITIZEN");
 const supabase=await createClient();
 const {data,error}=await supabase.from("categories").select("id,name").eq("active",true).order("name");
 return <main id="main"><Link href="/citizen">← My complaints</Link><h1>Report a local issue</h1><p>Add a photograph, describe the problem, and confirm its location.</p><section className="panel">
 {error||!data?.length?<p role="alert">Reporting is unavailable because categories could not be loaded. Please try again later.</p>:<ReportForm categories={data}/>}
 </section></main>;
}
