import { redirect } from "next/navigation";
import { requireProfile } from "../../lib/auth";
import { roleHome } from "@civicconnect/domain";
export default async function Page() {
  const { profile } = await requireProfile();
  redirect(roleHome[profile.role]);
}

