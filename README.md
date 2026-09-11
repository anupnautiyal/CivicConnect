# CivicConnect

Civic issue reporting PWA and municipal operations workspace. The source of scope is [the project plan](CivicConnect_Project_Plan.md).

## Current milestone

Sprint 0 foundation: Next.js/TypeScript workspace, shared lifecycle definitions, a clickable sample flow, and database design. The UI is explicitly a prototype: no authentication, file upload, persistence, or authorization is implemented yet. Navigation between actor views is for demonstration only.

## Run locally

Use Node.js 22.13+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Use **Preview submission**, **Verify report**, **Assign demo officer**, **Start work**, **Preview resolution**, then **Confirm resolution**. Refreshing clears all demo state.

```sh
npm run check
```

Runs TypeScript, domain tests, and a production build. CI runs the same checks. Supabase credentials are not needed for this prototype. The environment template in `apps/web/.env.example` documents the upcoming backend configuration.

## Structure

- `apps/web`: Next.js UI with citizen/staff demo flow.
- `packages/domain`: roles, categories, department seeds, and status graph.
- `supabase/migrations`: versioned foundation SQL; not applied automatically.
- `supabase/seed.sql`: synthetic configuration data for local/staging only.
- `docs/architecture`: decisions and schema draft.
- `docs/operations`: migration workflow.
- `docs/progress.md`: milestone status and next steps.

This step is local development only. Production release follows Sprint 6 acceptance checks.
