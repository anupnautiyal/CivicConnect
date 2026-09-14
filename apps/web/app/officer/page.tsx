import { StaffQueue } from "../staff/queue";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 return <StaffQueue role="OFFICER" query={await searchParams}/>;
}
