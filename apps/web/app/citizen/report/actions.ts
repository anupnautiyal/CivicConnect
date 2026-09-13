"use server";
import { normalizeReportPhoto, MAX_PHOTO_BYTES } from "../../../lib/report-photo";
import { createClient } from "../../../lib/supabase/server";
import { requireProfile } from "../../../lib/auth";
import { reportSchema } from "../../../lib/report-validation";
export type ReportState = { error?: string; id?: string };
export async function submitReport(_: ReportState, form: FormData): Promise<ReportState> {
 const { user } = await requireProfile("CITIZEN");
 if (!form.get("lat") || !form.get("lng")) return { error: "Select a location on the map or enter coordinates." };
 const parsed = reportSchema.safeParse({
  id: form.get("id"), title: form.get("title"), description: form.get("description"),
  category: form.get("category"), lat: form.get("lat"), lng: form.get("lng"),
  accuracy: form.get("accuracy") ? Number(form.get("accuracy")) : null, address: form.get("address")
 });
 if (!parsed.success) return { error: parsed.error.issues[0].message };
 const photo = form.get("photo");
 if (!(photo instanceof File) || !photo.size || photo.size > MAX_PHOTO_BYTES)
  return { error: "Choose a photo up to 5 MB." };
 if (!["image/jpeg","image/png","image/webp"].includes(photo.type))
  return { error: "Use a JPEG, PNG, or WebP photo." };
 const input = parsed.data;
 const supabase = await createClient();
 const { data: existing } = await supabase.from("issues").select("id").eq("id",input.id).eq("reporter_id",user.id).maybeSingle();
 if (existing) return { id: existing.id };
 let bytes: Buffer;
 try {
  bytes = await normalizeReportPhoto(Buffer.from(await photo.arrayBuffer()));
 } catch { return { error: "This file could not be read as a photo. Choose a different image." }; }
 const path = user.id + "/" + input.id + "/report.jpg";
 try {
  const { error: uploadError } = await supabase.storage.from("issue-photos").upload(path,bytes,{contentType:"image/jpeg",upsert:false});
  if (uploadError && String(uploadError.statusCode) !== "409")
   return { error: "Photo upload failed. Your form is still here; check your connection and try again." };
  const { data, error } = await supabase.rpc("submit_issue",{
   p_id:input.id,p_title:input.title,p_description:input.description,p_category:input.category,
   p_lat:input.lat,p_lng:input.lng,p_accuracy:input.accuracy,p_address:input.address,p_photo:path
  });
  if (error) {
   // RLS prevents deleting attached evidence even if a response was lost after commit.
   await supabase.storage.from("issue-photos").remove([path]);
   return { error: "The report could not be saved. Check the category and connection, then retry. Your details have been kept." };
  }
  return { id:data };
 } catch { return { error: "The connection was interrupted. Retry this form or check My complaints before starting a new report." }; }
}
