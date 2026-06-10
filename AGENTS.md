# Project Operating Guidelines

This is a production work project hosted on Vercel and backed by Supabase. Treat the app, database, email flows, scheduled jobs, and stored customer/client data as real and business-critical.

## Safety First

- Do not run destructive commands, reset git state, delete files, or revert user changes unless explicitly asked.
- Do not read, print, copy, or commit secrets from `.env.local` or any environment file unless the user explicitly asks and it is necessary for the task.
- Do not change Vercel, Supabase, Resend, auth, cron, storage, or production environment behavior casually. Call out risk before making those changes.
- Do not run migrations, seed scripts, data repair scripts, or one-off database scripts against Supabase without confirming the target database and expected effect with the user.
- Preserve existing user/worktree changes. If unrelated files are modified, leave them alone.

## Before Editing

- Read this file and inspect the files directly involved in the requested change before editing.
- Run `git status --short` and check the current branch so user changes are not accidentally mixed into the work.
- Identify whether the change touches production-sensitive areas: auth, Supabase schema/data, service-role access, RLS, Vercel config, cron routes, webhook routes, or email sending.
- For production-sensitive work, explain the impact and verification plan before making the change.
- Keep each change set focused. Avoid opportunistic refactors, formatting churn, dependency upgrades, or schema changes outside the requested scope.

## Stack Notes

- Framework: Next.js App Router with React and TypeScript.
- Main app code: `src/app`, `src/components`, and `src/lib`.
- Supabase browser client: `src/lib/supabase.ts` uses the public URL and anon key.
- Server-side privileged Supabase usage appears in API routes under `src/app/api` and scripts under `scripts`.
- Vercel cron is configured in `vercel.json` and currently calls `/api/cron/send-scheduled-emails` every 5 minutes.
- Email sending uses Resend. Be careful with anything that can send real client emails.

## Supabase Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or equivalent service keys to client components, browser bundles, logs, or public files.
- Use service-role clients only in server-only API routes or local scripts that are intentionally run by an operator.
- For schema changes, prefer explicit, idempotent SQL migrations using `IF EXISTS` / `IF NOT EXISTS` where appropriate.
- For data changes, include narrow filters, preview/select queries, and a rollback or recovery note when feasible.
- Be extra careful with RLS policies, auth admin APIs, storage buckets, and deletes from tables such as clients, users, tasks, articles, backlinks, email updates, notifications, and profiles.

## Vercel, Cron, And Email

- Treat `vercel.json`, scheduled routes, webhook routes, and email routes as production-sensitive.
- Do not change cron frequency, webhook validation, email recipients, sender behavior, or scheduled email status transitions without explaining the operational impact.
- Avoid triggering real email sends while testing unless the user clearly approves it.

## Development Workflow

- Inspect existing patterns before editing. Keep changes focused and consistent with the current codebase.
- Prefer the existing UI components in `src/components/ui` and existing project styling conventions.
- Use `npm run lint` after code changes when practical.
- Use `npm run build` for broader or production-sensitive changes when practical.
- If verification cannot be run, state that clearly in the handoff.

## Git Commit And Push Workflow

- Default expectation: after each completed set of approved changes, verify the work, create a focused git commit, and push it to `origin`.
- Before committing, run `git status --short` and review the diff. Stage only the files intentionally changed for that set of work.
- Do not commit `.env*`, secrets, local scratch files, logs, build artifacts, or unrelated user changes.
- Use clear commit messages that describe the user-facing or operational change.
- If the current branch is `main`, remember that pushing may trigger a Vercel production deployment. For high-risk changes, state that risk before pushing; if risk is unclear, stop and ask.
- If verification fails, do not push unless the user explicitly asks to push anyway and the failure is documented in the handoff.

## Handoff Expectations

- Summarize what changed, where it changed, and what was verified.
- Mention any production risk, database impact, or manual deployment/migration step.
- Keep secrets and sensitive values out of the final response.
