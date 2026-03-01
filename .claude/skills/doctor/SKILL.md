---
name: doctor
description: >
  Health-check diagnostic that verifies CLI availability, environment variables,
  database connectivity, GitHub authentication and secrets, and Railway linkage.
  Reports findings with contextual recommendations. Use this skill when the user
  says "doctor", "health check", "diagnose", "check status", "is everything
  working", or any variation of wanting to verify the project's configuration.
---

# Doctor

Run all checks below and report results. This skill is non-interactive — run
everything and present a structured summary at the end. Do not ask questions
during the checks.

Use this format for each check result:

- **PASS** — check passed
- **FAIL** — critical issue that must be fixed
- **WARN** — non-critical issue, development can proceed
- **SKIP** — check could not run because a dependency is missing

## Check 1: CLI Availability

For each of `neonctl`, `railway`, `gh`: run `which <command>` via Bash.

- Installed: report PASS.
- Not installed: report WARN (these are optional depending on the user's
  workflow).

## Check 2: Environment File

Check if `.env.local` exists by attempting to Read it.

- If it does not exist: report FAIL.
- If it exists: count the number of key-value pairs and report PASS with the
  count.

## Check 3: Required Variables

Read `.env.local` and check for these variables.

**Required** (FAIL if missing):

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (must be at least 32 characters)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Optional** (WARN if missing):

- `DATABASE_URL_UNPOOLED` — "Migrations will fall back to DATABASE_URL"
- `BETTER_AUTH_URL` — "Will default to http://localhost:4545 in development"

If `.env.local` does not exist, skip all variable checks.

## Check 4: Database Connection

If `DATABASE_URL` is not set, report SKIP.

Otherwise, test the connection via Bash:

```bash
DATABASE_URL="<value>" bun -e "
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  await sql\`SELECT 1\`;
  console.log('Connected');
"
```

- Success: report PASS.
- Failure: report FAIL with the error message.

## Check 5: GitHub

If `gh` is not installed, report SKIP for both sub-checks.

**Authentication:** Run `gh auth status` via Bash.

- Success: report PASS.
- Failure: report WARN — "Not authenticated. Run `gh auth login` to fix."

**Managed secrets:** Run `gh secret list` via Bash. For each of these secrets,
check if it appears in the output:

- `NEON_PROJECT_ID`
- `NEON_API_KEY`
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `SKIP_ENV_VALIDATION`

Report PASS or WARN for each. Missing secrets only matter if the user intends
to use CI/CD.

## Check 6: Railway

If `railway` is not installed, report SKIP.

Run `railway status` via Bash.

- Success: report PASS — "Project linked."
- Failure: report WARN — "No project linked."

## Summary

After all checks, provide a structured summary:

1. Count total FAILs and WARNs.
2. If any FAILs exist, list them and suggest running `/setup` to fix missing
   configuration.
3. If only WARNs exist, note that development can proceed but some features may
   not work.
4. If all checks pass, report "All checks passed."

## Edge Cases

- `BETTER_AUTH_SECRET` may exist but be too short (less than 32 characters).
  Report this as FAIL with a note to regenerate via `openssl rand -hex 32`.
- `gh secret list` may fail if the user is authenticated but the repository has
  no GitHub remote. Report WARN, not FAIL.
- The database connection test requires `@neondatabase/serverless` to be
  installed. If the import fails, report FAIL with a note to run `bun install`.
