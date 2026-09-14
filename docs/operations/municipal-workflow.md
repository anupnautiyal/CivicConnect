# Municipal workflow setup

## Apply the migration

Run only `supabase/migrations/202609130004_municipal_workflow.sql` in the existing development Supabase project's SQL Editor. It follows the previously applied identity and reporting migrations. Do not rerun the initial setup bundle. The migration is transaction-wrapped.

## Staff accounts

Use separate accounts for the citizen, department administrator, and officer when testing. Keep your citizen account unchanged so you can compare citizen-visible and internal updates.

1. Register and confirm two additional test accounts through the app, or reuse existing verified staff test accounts.
2. Find each account UUID under Supabase Authentication > Users.
3. In the SQL Editor, promote the exact intended UUIDs with the examples below. Replace the placeholders before executing.
4. Sign out and back in with each account. Roles are read from the database, never from signup metadata.

```sql
-- Sanitation department administrator:
update public.profiles
set role = 'DEPARTMENT_ADMIN',
    department_id = (select id from public.departments where code = 'SAN')
where user_id = '<administrator-user-uuid>';

-- Sanitation officer:
update public.profiles
set role = 'OFFICER',
    department_id = (select id from public.departments where code = 'SAN')
where user_id = '<officer-user-uuid>';
```

Match the department to the issue you want to work on. Available seeded codes: SAN (Sanitation), PWD (Public Works), WAT (Water Services), ELE (Street Lighting). The water-leakage report needs Water Services staff, not Sanitation staff.

If system-wide triage is needed, a project owner may explicitly promote a dedicated verified account to SYSTEM_ADMIN with department_id null. All profile role/department changes are audited. No service-role credential is used by the app.

## Acceptance walkthrough

1. Citizen submits a report in the chosen category.
2. Department admin signs in at /department, filters the queue and opens the report.
3. Verify it, then assign the department's officer.
4. Officer signs in at /officer and sees the assigned report.
5. Add one citizen-visible update and one internal note.
6. Start work, upload a resolution photograph and write a resolution note.
7. Resolve the report.
8. Citizen opens the details: resolution photo, public update and full status history appear; internal notes do not.
9. A different department admin and an unassigned officer must not be able to access the report.
10. For a separate ASSIGNED report, use Return for reassignment with a reason; the old officer loses access and the admin can assign another officer.

Citizen confirmation, reopening, ratings and notifications are Sprint 4. An officer can work on an existing REOPENED state according to the approved graph; Sprint 3 does not expose a citizen reopen action.

## Authorization and data integrity

- Department admins read only their department's issues; officers read only actively assigned issues in their current department; system admins can triage across departments.
- No client gets direct write grants for issues, history, assignments, comments or workflow receipts.
- staff_workflow validates actor, expected state, operation, assignee department, required reason and resolution evidence in a transaction. Per-request receipts avoid duplicated effects on retries.
- One active assignment per issue is enforced by a unique partial index.
- Reassignment follows ASSIGNED -> VERIFIED -> ASSIGNED, preserving ended assignment records.
- Notes explicitly distinguish STAFF and CITIZEN visibility. Transition notes are always citizen-visible.
- Every status change records a history event with an actor display-name snapshot and timestamp. Every workflow operation adds an audit event without copying internal note contents into public records.
- Resolution images use the same bounded image decoding and metadata removal as report photos.
- Storage read access follows authorized media access. Cleanup checks attachment independently of the caller's visibility, so losing assignment access does not let an officer delete attached evidence.
- Queue filters cover status, category, ward, priority and received-from date, with pagination. Bulk assignment, staff account-management UI and analytics remain future work.

## Validation

`npm run check` covers TypeScript, all 13 tests and a production build. Local PostgreSQL tests exercise citizen/staff isolation, cross-department rejection, unassigned officer denial, stale-state rejection, reason/evidence requirements, idempotent resolution, internal-note privacy, immutable evidence after access loss, reassignment and deactivation.

These tests emulate Supabase Auth and Storage metadata. Hosted staff sign-in, actual photo delivery and the end-to-end walkthrough still require the configured accounts.


Hosted migration was applied successfully by the user. Anonymous reads of assignments, comments and workflow_requests were verified as 401 permission denied. Signed-out staff-page and private-photo HTTP checks passed. Staff account setup and the hosted end-to-end workflow remain pending.

## Current access model — global staff visibility

The user revised staff visibility: all active admins and officers can view every citizen report, its photos, timeline and staff notes. Citizens still see only their own private records and citizen-visible notes.

Apply 202609130005_global_staff_visibility.sql after the municipal migration. Administrator accounts no longer require a department and enter at /admin; the old /department URL redirects. The persisted DEPARTMENT_ADMIN enum is retained for compatibility but now means a general administrator. Officers enter at /officer, see all reports by default and can filter Assigned to me.

Viewing and editing are separate. Administrators verify and assign across departments. Officers can start, resolve or add updates only to reports actively assigned to them in their department. Assignments still select an officer from the report's responsible department. Thus department affiliation is routing data for officers, not a boundary on report visibility.

The earlier department-scoped instructions in this document describe the previous migration. The current rules above supersede them. The two existing mock account logins remain valid; no new registration is needed.
