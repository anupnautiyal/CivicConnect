// Run only after independently verifying employment through the municipality.
// node scripts/review-staff-access.mjs <user UUID> approve|reject <verification reference> [department UUID]
import {createClient} from '@supabase/supabase-js';
process.loadEnvFile('apps/web/.env.local');process.loadEnvFile('.env.admin.local');
const [user,decision,reference,department]=process.argv.slice(2);
if(!/^[0-9a-f-]{36}$/i.test(user||'')||!['approve','reject'].includes(decision)||!reference||reference.trim().length<12)throw Error('Provide user UUID, approve/reject, and an independent verification reference (12+ characters).');
if(process.env.NEXT_PUBLIC_SUPABASE_URL!=='https://rvawauiwlwtlyfovsiwi.supabase.co')throw Error('Unexpected project');
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {error}=await client.rpc('review_staff_access',{p_user:user,p_approve:decision==='approve',p_reference:reference,p_department:department||null});
if(error)throw Error(error.message);
console.log('Staff request '+(decision==='approve'?'approved':'rejected')+'. Review recorded in audit history.');
