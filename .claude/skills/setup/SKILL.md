---
name: setup
description: >
  Interactive onboarding wizard that creates a Neon project, configures
  environment variables, optionally sets up Railway and GitHub secrets, runs
  the initial migration, and generates SvelteKit types. Use this skill when the
  user says "set up", "onboard", "initialize the project", "configure the
  environment", "run setup", or any variation of wanting to get the project
  ready for development.
---

# Setup

Walk the user through project onboarding step by step. Create a task for each
phase so progress is visible. Use AskUserQuestion for choices, Read/Write/Edit
for `.env.local`, and Bash for CLI commands.

## Phase 1: Prerequisites

Check that `neonctl` is installed by running `which neonctl` via Bash.

- If missing, tell the user to install it (`brew install neonctl` or
  `npm install -g neonctl`) and stop — nothing else can proceed without it.
- Optionally check for `gh` and `railway` and note their absence, but do not
  block on them (they are only needed for optional phases).

## Phase 2: Neon Project

1. Read `.env.local` (if it exists) and check for an existing `DATABASE_URL`.
2. If `DATABASE_URL` is already set, ask the user whether to create a new Neon
   project anyway. If they decline, skip this phase.
3. Ask for the Neon region. Default: `aws-us-east-2`.
4. Run `neonctl orgs list --output json` via Bash. If the user belongs to
   multiple organizations, present the list and ask which one to use. If only
   one (or zero), proceed automatically.
5. Run the project creation command:
   ```
   neonctl projects create --region-id <region> [--org-id <org>] --output json
   ```
   Parse the JSON output to extract the project ID.
6. Retrieve connection strings:
   ```
   neonctl connection-string --project-id <id> --pooled
   neonctl connection-string --project-id <id>
   ```
7. Write `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) to
   `.env.local`. If the file exists, update existing keys or append. If it does
   not exist, create it.
8. Tell the user to enable Neon Auth in the Neon Console:
   ```
   https://console.neon.tech/app/projects/<id>/auth
   ```

**If `neonctl projects create` fails:** the user likely needs to authenticate
first. Tell them to run `neonctl auth` and retry.

## Phase 3: Application URL and Auth Secret

1. Read `.env.local` for existing `BETTER_AUTH_URL`. Default to
   `http://localhost:4545`.
2. Ask the user for the application URL.
3. Write `BETTER_AUTH_URL` to `.env.local`.
4. Check if `BETTER_AUTH_SECRET` exists in `.env.local`. If not, generate one:
   ```
   openssl rand -hex 32
   ```
   Write the generated value as `BETTER_AUTH_SECRET` to `.env.local`.

## Phase 4: Google OAuth

1. Read `.env.local` for existing `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`.
2. If both are already set, ask whether to reconfigure. If the user declines,
   skip this phase.
3. Show the user these instructions:

   > Open the Google Cloud Console: https://console.cloud.google.com/apis/credentials
   >
   > Create an OAuth 2.0 Client ID with these redirect URIs:
   >
   > - `http://localhost:4545/api/auth/callback/google` (development)
   > - `https://your-app.railway.app/api/auth/callback/google` (production)

4. Ask the user for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. If either value is blank, warn that sign-in will not work until these are
   configured. Continue with the remaining phases.
6. Write both values to `.env.local`.

## Phase 5: Verify Database Connection

1. Read `DATABASE_URL` from `.env.local`. If not set, skip with a warning.
2. Test the connection via Bash:
   ```bash
   DATABASE_URL="<value>" bun -e "
     const { neon } = await import('@neondatabase/serverless');
     const sql = neon(process.env.DATABASE_URL);
     await sql\`SELECT 1\`;
     console.log('Connected');
   "
   ```
3. If the connection fails, show the error message and ask the user how to
   proceed: fix and retry, skip, or abort.

## Phase 6: Railway (optional)

1. Check if `railway` is installed via `which railway`. If not, skip with a
   note.
2. Ask the user whether to configure Railway deployment. If they decline, skip.
3. Run `railway init -y` via Bash.
4. Read `.env.local`, parse key-value pairs, and for each one run:
   ```
   railway variable set <KEY>="<VALUE>"
   ```
5. Report which variables were synced.

## Phase 7: GitHub Secrets (optional)

1. Check if `gh` is installed via `which gh`. If not, skip with a note.
2. Ask the user whether to set GitHub secrets for CI/CD. If they decline, skip.
3. Set the managed secrets by piping values to `gh secret set`:
   - `NEON_PROJECT_ID` — the project ID from Phase 2
   - `DATABASE_URL` — the pooled connection string from Phase 2
   - `DATABASE_URL_UNPOOLED` — the direct connection string from Phase 2
4. Ask the user for `NEON_API_KEY` (used for PR workflow Neon branch creation).
   If blank, skip with a warning that the PR database validation workflow will
   not work.
5. If a `NEON_API_KEY` is provided, set it via `gh secret set`.
6. Ask the user for `CLAUDE_CODE_OAUTH_TOKEN` (used for the Claude Code GitHub
   Action — automated code review on PRs and `@claude` mentions in issues and
   comments). If blank, skip with a warning that the Claude Code workflows will
   not trigger. The token can be obtained from the Anthropic Console under
   Claude Code OAuth settings.

To set a secret via Bash:

```bash
echo "<value>" | gh secret set <NAME>
```

## Phase 8: Migration and SvelteKit Sync

1. Run `bun scripts/migrate.ts` via Bash. If it fails, report the error and
   suggest running `/migrate` manually later.
2. Run `bunx svelte-kit sync` in the `applications/web` directory via Bash. If
   it fails, report the error and suggest running manually.

## Completion

Summarize what was configured (which phases succeeded, which were skipped).
Print next steps:

```
1. bun turbo dev              — Start development server
2. bunx cloudflared tunnel --url http://localhost:4545
                              — Expose app for claude.ai (MCP at /mcp)
3. bunx @modelcontextprotocol/inspector
                              — Debug MCP locally
```

## Edge Cases

- `.env.local` already exists with partial configuration — read it and only
  fill in missing values. Never clobber existing keys without asking.
- `neonctl auth` has not been run — `neonctl projects create` will fail.
  Explain and suggest `neonctl auth`.
- No organizations returned from `neonctl orgs list` — use personal account
  (omit `--org-id` flag).
- Phase 2 values (project ID, connection strings) are needed by Phases 5 and 7.
  If Phase 2 was skipped, read the existing values from `.env.local` instead.
