# Authentication setup and verification

## Apply the database setup

The application uses only your publishable key; it cannot execute DDL. In the project's Supabase SQL Editor, open a new query, paste `supabase/setup-development.sql`, and run it once. This generated bundle contains both versioned migrations and synthetic configuration seeds. Use it only for this new project. Do not rerun it against an initialized schema. Future changes must use new migrations.

The user trigger creates a citizen profile, ignoring role metadata. Existing auth users are backfilled. Users can read their own profile and update only display name and preferences. Active authenticated users can read active configuration. Client-side staff role changes and configuration writes remain denied.

## Configure email redirects

In Authentication > URL Configuration:
- Site URL: `http://127.0.0.1:3000`
- Add redirect URL: `http://127.0.0.1:3000/auth/callback**`

Keep `APP_ORIGIN=http://127.0.0.1:3000` in `apps/web/.env.local`. For staging/production set the actual HTTPS origin and add its callback URL explicitly. Do not derive email redirects from client input or forwarded host headers.

Keep email confirmation enabled and use the default confirmation and recovery templates. This implementation exchanges PKCE codes: open emailed links in the same browser/device that requested them. Supabase's built-in email provider has recipient restrictions and rate limits; configure a custom SMTP provider for testing with other recipients and for a pilot.

## First account and staff bootstrap

Register at /register, confirm the email, then sign in. It should open /citizen. No service-role key is needed by the web app.

Staff accounts must first register and verify their email. A project owner can promote an exact user UUID in the SQL Editor using a reviewed statement, for example:

```sql
-- Substitute a verified account UUID. Do not use untrusted user metadata.
update public.profiles set role = 'OFFICER',
department_id = (select id from public.departments where code = 'SAN')
where user_id = '<verified-user-uuid>';
```

Use DEPARTMENT_ADMIN with a department, or SYSTEM_ADMIN with department_id null. Never promote an arbitrary account by a client-provided role. Changes to role, department and active status create audit records. For SQL Editor bootstrap, actor_id may be null; database_actor records the database connection identity. An audited administrator UI remains future work.

## Verification

`npm run check` runs TypeScript, lifecycle tests, local PostgreSQL policy tests, and the production build. The local PostgreSQL tests emulate Supabase auth users and JWT identity; they do not test the hosted Auth service or actual email delivery.

Hosted acceptance checklist:
1. Apply SQL and configure redirects.
2. Register two citizens and confirm their emails.
3. Sign in; verify profile names and /citizen redirects.
4. Visit /officer, /department, /admin as a citizen; each redirects to /citizen.
5. Promote dedicated test accounts to each staff role and verify exact role routes.
6. Verify each user sees only their profile through the Data API; role mutations fail.
7. Sign out; protected URLs redirect to /login.
8. Request password recovery, follow the email, change password, then sign in with it.
9. Deactivate a test profile and confirm it cannot access a role workspace.

No test accounts or emails are created automatically. Reporting and municipal operational tools remain later milestones.


HTTP smoke checks: with the development server running, run `node --test tests/e2e/anonymous.test.mjs`. Public pages, all anonymous role redirects, and the callback destination passed on September 11, 2026. The hosted setup was applied successfully by the user; read-only API checks confirmed anonymous reads of profiles, departments and audit_logs fail with permission denied. Hosted registration and email delivery remain manual acceptance steps.

Implementation reference: [Supabase SSR client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
