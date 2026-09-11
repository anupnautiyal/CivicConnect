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
