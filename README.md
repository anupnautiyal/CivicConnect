# CivicConnect

Civic issue reporting PWA and municipal operations workspace. The source of scope is [the project plan](CivicConnect_Project_Plan.md).

## Current milestone

Sprint 2 reporting is implemented: private photo upload, location selection, secure submission, My complaints and report timelines. See [reporting setup](docs/operations/reporting.md). Authentication includes registration, login, logout, email confirmation, recovery, protected role pages, profile policies and audit records. Apply the hosted setup and configure redirects using [the authentication guide](docs/operations/authentication.md). The reporting flow at /demo remains a sample without report persistence or uploads.

## Run locally

Use Node.js 22.13+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000 to create an account or sign in. For the sample workflow open http://127.0.0.1:3000/demo. Use **Preview submission**, **Verify report**, **Assign demo officer**, **Start work**, **Preview resolution**, then **Confirm resolution**. Refreshing clears all demo state.

```sh
npm run check
```

Runs TypeScript, domain tests, local PostgreSQL policy tests, and a production build. CI runs the same checks. Copy apps/web/.env.example to apps/web/.env.local and supply your Supabase URL, publishable key and app origin for live authentication. No service-role key is used. The build and local policy tests work without hosted credentials.

## Structure

- `apps/web`: Next.js UI with citizen/staff demo flow.
- `packages/domain`: roles, categories, department seeds, and status graph.
- `supabase/migrations`: versioned foundation SQL; not applied automatically.
- `supabase/seed.sql`: synthetic configuration data for local/staging only.
- `docs/architecture`: decisions and schema draft.
- `docs/operations`: migration workflow.
- `docs/progress.md`: milestone status and next steps.

This step is local development only. Production release follows Sprint 6 acceptance checks.
