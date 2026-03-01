---
name: teardown
description: >
  Interactive teardown that walks through removing configured services: GitHub
  secrets, Railway linkage, environment file, and Neon project. Each phase
  requires explicit user confirmation. Use this skill when the user says
  "teardown", "tear down", "remove services", "clean up infrastructure",
  "delete the project", or any variation of wanting to undo the setup.
---

# Teardown

Walk the user through removing configured services step by step. Create a task
for each phase so progress is visible. Every destructive action requires
explicit user confirmation via AskUserQuestion.

**Phase order matters.** Delete GitHub secrets and unlink Railway before deleting
`.env.local`, because those phases may need values from it.

## Phase 1: GitHub Secrets

1. Check if `gh` is installed via `which gh`. If not, skip with "gh not
   installed. Nothing to do."
2. Run `gh secret list` via Bash. If it fails (not authenticated or no repo),
   skip with a note.
3. Filter the output for managed secrets:
   - `NEON_PROJECT_ID`
   - `NEON_API_KEY`
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `SKIP_ENV_VALIDATION`
4. If none are found, skip with "No managed GitHub secrets found."
5. List the found secrets and ask the user to confirm deletion.
6. For each confirmed secret, run `gh secret delete <NAME>` via Bash.
7. Report which secrets were deleted.

## Phase 2: Railway

1. Check if `railway` is installed via `which railway`. If not, skip with
   "railway not installed. Nothing to do."
2. Run `railway status` via Bash. If it fails, skip with "No Railway project
   linked. Nothing to do."
3. Ask the user to confirm unlinking.
4. Run `railway unlink` via Bash.

## Phase 3: Environment File

1. Check if `.env.local` exists by attempting to Read it. If it does not exist,
   skip with ".env.local does not exist. Nothing to do."
2. Ask the user to confirm deletion.
3. Delete via Bash: `rm .env.local` (from the project root).

## Phase 4: Neon Project

This phase permanently deletes a Neon project and all its data. Handle with
care.

1. Check if `neonctl` is installed via `which neonctl`. If not, skip.
2. Run `neonctl projects list --output json` via Bash. Parse the JSON. The
   response may be a flat array or an object with a `projects` key — handle
   both.
3. If no projects are found, skip.
4. Try to identify the configured project: if `.env.local` still exists (it may
   have been deleted in Phase 3), read `DATABASE_URL` and check if any project
   ID appears as a substring of the connection string.
5. If a matching project is identified, show it and ask the user to confirm
   deletion.
6. If no match (or `.env.local` was already deleted), list all projects with
   numbers and ask the user to pick one or skip.
7. **Safety gate:** Print a warning that this permanently deletes the project
   and all its data. Ask the user to type the exact project name to confirm.
   Match exactly — case-sensitive, no partial matches.
8. If the typed name matches, run `neonctl projects delete <id>` via Bash.
9. If it does not match, skip with "Name does not match."

## Completion

Summarize what was removed and what was skipped.

## Edge Cases

- If `.env.local` was deleted in Phase 3, Phase 4 cannot identify the
  configured project automatically. Fall back to listing all projects.
- If `neonctl auth` has not been run, `neonctl projects list` will fail. Skip
  with a note.
- A user might have multiple Neon projects from separate setup runs. Let them
  pick which one to delete rather than assuming.
