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
