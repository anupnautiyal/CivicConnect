# Staff access verification

Public signup offers Citizen, Administrator and Officer. Every new profile starts as CITIZEN. Staff choices create a PENDING request containing the claimed organisation and employee reference; these claims do not prove employment. Users cannot change request status, approve requests, or promote themselves. Existing staff accounts remain unchanged.

Before approving, the project owner must independently verify the applicant with the municipality using an established official contact or staff roster, confirm the requested authority, and record a verification reference. Email confirmation proves mailbox control only. Do not approve from an email domain, a screenshot, or a self-entered staff number alone. No automatic system can guarantee a person's municipal authority.

Apply supabase/migrations/202609150009_staff_access_requests.sql before accepting staff applications. On /profile the applicant sees the request status and retains citizen access while pending.

The trusted local review script uses the Git-ignored .env.admin.local service secret. It is never exposed to the browser. From the project root, after completing independent verification:

    node scripts/review-staff-access.mjs <user-uuid> approve "Municipal roster verification reference" [officer-department-uuid]

For rejection:

    node scripts/review-staff-access.mjs <user-uuid> reject "Verification could not be completed"

Only service-role execution can review a request. Approval requires a confirmed email and active citizen profile; officers require an active department. General administrators have no department restriction. Every review and privilege change is audited. A reviewed request cannot be replayed. Use Supabase's staff_access_requests table to inspect pending requests, with access limited to trusted project owners.
