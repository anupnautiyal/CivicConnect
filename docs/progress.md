# Delivery progress

## Sprint 0 — foundation

- [x] Read and adopt the supplied MVP scope and architecture.
- [x] Define the four roles and exact complaint transition graph.
- [x] Draft fictional departments, categories, and ward configuration.
- [x] Create Next.js + TypeScript npm workspace.
- [x] Create responsive tokens and a clickable citizen/admin/officer demo.
- [x] Add lifecycle unit tests and CI/build commands.
- [x] Draft foundation migration, schema relationships, and migration procedure.
- [x] Document the garbage-bin demonstration story.
- [ ] User review of the prototype and fictional configuration.
- [ ] Provision development Supabase and execute/verify migrations.

## Next: Sprint 1 — identity and foundation

1. Configure a development Supabase project and local CLI workflow.
2. Apply foundation migration and seed; verify constraints and deny-by-default RLS.
3. Add email/password login, registration, recovery, and profile creation.
4. Implement server-validated sessions and role-aware routes.
5. Add explicit profile/configuration RLS policies and authorization integration tests.
6. Verify each actor can access only its permitted area.

Later sprints remain as defined in the original plan. No backend functionality is implied by the prototype. Status graph tests do not establish authorization or evidence enforcement.

## Sprint 1 implementation — identity

- [x] Cookie-based Supabase sessions with server-validated identity and refresh proxy.
- [x] Registration, login, logout, email-confirmation callback, recovery and password update.
- [x] Exact role routes and active-profile checks for all four actors.
- [x] Citizen-only signup trigger and backfill; own-profile RLS and protected role columns.
- [x] Active-user configuration reads and audited role/department/deactivation changes.
- [x] Local PostgreSQL integration tests for access denial, ownership, role escalation and audit.
- [x] TypeScript, five tests and production build passed during implementation.
- [x] Hosted setup SQL applied successfully (confirmed by user); anonymous profile/configuration/audit reads return 401 permission denied.
- [ ] Configure Auth redirect URLs (awaiting user confirmation).
- [ ] Hosted email confirmation/recovery and four-actor sign-in acceptance tests.

Authentication setup: docs/operations/authentication.md. The original sample workflow is now at /demo. The root page provides account entry points. Staff pages are protected foundations; queues and configuration management are not yet implemented. No hosted database migration or real email delivery is claimed by local tests.

## Sprint 2 — citizen reporting

- [x] Issues, media, status history and private storage migration.
- [x] Server-side input and photo-content validation; resized JPEG output without EXIF.
- [x] GPS capture, manual map point and coordinate fallback, address/landmark entry.
- [x] Atomic report/media/history/audit creation with retry identifiers.
- [x] Paginated My complaints and private detail pages with temporary photo links.
- [x] Hosted migration applied successfully (user confirmation); anonymous table reads denied.
- [x] TypeScript, eight tests, production build and anonymous-route smoke checks passed.
- [ ] Signed-in hosted photo submission and cross-account Storage API acceptance check.

Ward assignment remains pending geographic routing. Current department routing uses the category default. Offline drafts, staff workflow and notifications remain in their planned sprints. Changes are local until the next requested GitHub push.

Photo/location follow-up: compact complaint cards now display private photo previews with retry controls; place search is available when browser GPS times out. Build and 12 tests pass. Actual device location and signed-in image display still require user verification.

## Sprint 3 — municipal workflow

- [x] Sprint 2 pushed to GitHub as cee40b4; automatic device GPS remains open and deferred.
- [x] Department, officer and system-admin queues with filters and pagination.
- [x] Verification/rejection, assignment/reassignment, work-start and evidence-backed resolution.
- [x] Citizen-visible and internal notes, actor snapshots, audit events and retry receipts.
- [x] Department/assignment RLS and private resolution-photo access.
- [x] Citizen details show public staff updates and resolution evidence.
- [x] TypeScript, 13 automated tests and production build pass.
- [x] Hosted municipal migration applied (user confirmed); anonymous assignments/comments/workflow receipt reads return 401 permission denied.
- [x] Separate confirmed mock admin/officer accounts configured; both sign in and read all hosted reports.
- [ ] Complete signed-in workflow acceptance from verification through photo-backed resolution.

See docs/operations/municipal-workflow.md. Sprint 3 changes are local; the pushed checkpoint is Sprint 2. Citizen confirmation/reopening/ratings and notifications remain Sprint 4.

## Revised staff visibility

All active administrators and officers can view all citizen reports. General admins enter at /admin; officers enter at /officer with an optional Assigned to me filter. Citizen privacy is unchanged. Officer mutations and resolution uploads still require an active assignment. Migration 202609130005_global_staff_visibility.sql was applied successfully (user confirmation). Hosted read-only verification on 2026-09-14 confirmed both mock accounts see all 2 existing reports and the administrator department is null. Existing credentials remain valid. TypeScript, all 14 tests and the production build passed; migration replay also passed its regression test.

Hosted workflow acceptance (2026-09-14): passed using authenticated mock citizen/admin/officer API sessions. Labelled synthetic report 6d252b17-9539-4fb4-abb9-41144945de77 progressed SUBMITTED -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED. Verified resolution retry creates no duplicate history/media, citizen sees only public notes, and both private photos download successfully. Test report retained for browser inspection; mock citizen credentials saved in the ignored credentials file. Browser form/visual acceptance remains pending.
