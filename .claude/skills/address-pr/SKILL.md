---
name: address-pr
description: >
  Sweep the current branch's pull request: commit uncommitted work, rebase onto
  origin/main, check CI, triage and fix failures, review all PR comments (both
  review comments and conversation comments), build a task list, address every
  item, push, resolve review threads, and reply to conversation comments. Use
  this skill whenever the user says "address the PR", "sweep the PR", "handle PR
  feedback", "fix PR comments", "triage the PR", or any variation of wanting to
  get a pull request into mergeable shape. Also trigger when the user asks to
  "check on the PR" or "get the PR ready".
---

# Address PR

A structured sweep of the current branch's open pull request. The goal is to
take a PR from "has feedback" to "ready to merge" in one pass.

## Overview

This skill walks through the PR in a specific order because each phase can
surface work for later phases. Committing first ensures nothing is lost.
Rebasing ensures you're working against the latest main. Fixing CI before
addressing review comments avoids wasted effort on code that won't build.

## Phase 1: Clean Slate

### 1a. Commit uncommitted work

Run `git status` (without `-uall` — it can be slow on large repos). If there are
staged or unstaged changes to tracked files, commit them with a descriptive
message. For untracked files, stage them only if they're clearly part of the
current work (source files, tests, config). Don't stage files that look like
artifacts, secrets, or editor state.

If the working tree is clean, move on.

### 1b. Sync with origin/main

```
git fetch origin
git log HEAD..origin/main --oneline
```

If there are new commits on origin/main, rebase:

```
git rebase origin/main
```

If the rebase encounters conflicts, resolve them. For ambiguous conflicts — where
both sides made substantive changes to the same code — ask the user rather than
guessing.

After a successful rebase, the branch will need a force push. Hold off on
pushing until Phase 5 — there may be more commits to add.

If already up to date, move on.

## Phase 2: CI Status

Get the PR details. This is the single source of truth for the PR number, repo
owner, and repo name used throughout the rest of the skill.

```
gh pr view --json number,headRefName,statusCheckRollup,url
```

Store the PR number for use in later phases. Derive the owner and repo name from
`gh repo view --json nameWithOwner`.

Examine the CI status. If all checks pass, move on.

If checks are failing:

1. Identify which checks failed and pull their logs
   (`gh run view <run-id> --log-failed`)
2. Diagnose the root cause — read the failing code, understand what broke
3. Fix the failures directly — CI issues block everything downstream
4. Run verification locally to confirm the fix before moving on
5. Commit the fixes with a clear message describing what was broken and why

## Phase 3: Gather Feedback

Collect all feedback from the PR in one pass before making changes. Reading
everything first prevents addressing one comment in a way that conflicts with
another.

### 3a. Review comments (with resolution status)

Use a single GraphQL query to fetch review threads with their resolution status
and comments. This is more reliable than the REST API, which doesn't expose
thread resolution.

```
gh api graphql -f query='
  query {
    repository(owner: "<owner>", name: "<repo>") {
      pullRequest(number: <number>) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 10) {
              nodes {
                databaseId
                body
                author { login }
              }
            }
          }
        }
      }
    }
  }
'
```

Replace `<owner>`, `<repo>`, and `<number>` with the values from Phase 2.

For each **unresolved** thread:

- Note the file path, line, and the reviewer's concern
- Determine whether it requests a code change, asks a question, or is
  informational
- Record the thread ID (the GraphQL `id` field) — you'll need it in Phase 5 to
  resolve the thread

Skip resolved threads entirely.

### 3b. Conversation comments

Fetch top-level PR conversation comments:

```
gh pr view <number> --json comments --jq '.comments[]'
```

These are often higher-level feedback, questions, or requests that don't map to
a specific line of code. Identify which ones are actionable versus purely
informational or already addressed.

Record the comment ID for any comment you plan to respond to.

### 3c. Build the task list

Create tasks (using TaskCreate) for every actionable item found above. Each task
description should include:

- What needs to change
- Which comment(s) it addresses (include the thread ID or comment ID)
- The file and line if applicable

Group related comments into a single task when they're about the same concern.
Three comments all saying "use kebab-case filenames" is one task, not three.

Order tasks so structural changes come before cosmetic ones — a rename or
refactor might make a smaller fix unnecessary.

## Phase 4: Address Everything

Work through the task list in order. For each task:

1. Mark it as in_progress
2. Read the relevant code before making changes
3. Make the code changes
4. After structural changes (renames, refactors, new files), run a quick
   verification — at minimum typecheck the affected package
5. Mark it as completed

After all tasks are done, run the full verification suite. Check the project's
CLAUDE.md or package.json for the right commands — common patterns:

- Build: `bun turbo build` or `npm run build`
- Typecheck: `bun turbo typecheck` or `tsc --noEmit`
- Lint: `bun turbo lint` or `npm run lint`
- Test: `bun test` or `npm test`

Fix anything that fails.

## Phase 5: Ship It

### 5a. Commit and push

Stage and commit all changes. Prefer specific file paths over `git add -A` to
avoid accidentally staging secrets or artifacts. If the changes are logically
distinct (e.g., a bug fix and a refactor), use separate commits.

Push the branch. If you rebased in Phase 1, you'll need:

```
git push --force-with-lease
```

Use `--force-with-lease` rather than `--force` — it refuses to push if someone
else has pushed to the branch since your last fetch, preventing you from
overwriting their work. If the branch wasn't rebased, a normal `git push`
suffices.

### 5b. Resolve review comment threads

For each review thread you addressed, resolve it using the thread ID you
recorded in Phase 3:

```
gh api graphql -f query='
  mutation {
    resolveReviewThread(input: { threadId: "<thread_id>" }) {
      thread { isResolved }
    }
  }
'
```

Only resolve threads where you actually made the requested change. If you
couldn't address a comment (or chose a different approach), leave it unresolved
and mention why in a reply instead.

### 5c. Reply to conversation comments

For each conversation comment that was addressed, post a reply explaining what
was done:

```
gh pr comment <number> --body "<response>"
```

Be concise and specific — reference what changed and where. "Addressed in
commit abc123: renamed files to kebab-case" is good. "Done" is not. If a comment
raised a question that doesn't need a code change, answer it directly.

## Edge Cases

- **No open PR for the current branch**: Tell the user and stop. Don't create a
  PR — that's a separate decision.
- **No failing CI and no comments**: Tell the user the PR looks clean and
  there's nothing to address.
- **Comments that disagree with each other**: Flag the conflict to the user and
  ask which direction to go rather than picking one silently.
- **Comments you think are wrong**: Default to implementing what the reviewer
  asked for. If you believe it's genuinely harmful to the codebase, explain your
  reasoning to the user and let them decide.
- **Review comments already addressed by previous commits**: Check if the code
  at the commented line already reflects the requested change. If so, resolve
  the thread — no additional work needed.
