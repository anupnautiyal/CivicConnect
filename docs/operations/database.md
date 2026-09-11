# Database migration workflow

The foundation SQL is authored but has not been applied or integration-tested. It expects Supabase's `auth.users`, `anon`, and `authenticated` roles. It intentionally grants no client access.

1. In Sprint 1 install/pin the Supabase CLI and initialize local configuration. Local Supabase requires Docker; alternatively use a separate development project.
2. Apply migrations in filename order to a disposable development database using the CLI. Never edit an already applied migration; append a new one.
3. Load `supabase/seed.sql` only into local or staging databases. No real people or jurisdiction boundaries are included.
4. Test invalid staff profiles, foreign keys, seed repeatability and anonymous/authenticated access denial. Add policy tests as policies are introduced.
5. Generate database TypeScript types after schema changes and keep them in version control.
6. Promote reviewed migrations to staging only after reset/replay and integration checks pass. Take a backup before pilot changes; document and test restoration before release.

Keep project credentials in local environment files or deployment secret management. A service role bypasses RLS and must never be exposed in browser code. Create staff roles through an audited trusted bootstrap flow in Sprint 1; do not seed login passwords.
