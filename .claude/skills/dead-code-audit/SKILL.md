---
name: dead-code-audit
description: >
  Audit a codebase for dead code, unused exports, stale dependencies, legacy
  shims, backwards-compatibility layers, deprecated markers, commented-out code,
  and anything else that no longer serves a purpose — then remove it. Use this
  skill whenever the user asks to "clean up dead code", "audit unused code",
  "remove legacy code", "strip deprecated code", "find unused exports", "prune
  dependencies", "remove backwards compatibility", or any variation of wanting to
  eliminate code that is no longer needed. Also trigger when the user says "audit
  the codebase", "clean house", or "remove cruft" — especially in pre-MVP or
  early-stage projects where carrying dead weight is never justified.
---

# Dead Code Audit

Systematically find and remove code that serves no purpose. Pre-MVP projects
have zero reason to carry dead code, backwards-compatibility shims, or
deprecated wrappers — if something isn't actively used, it's gone.

## Philosophy

Every line of dead code has a cost: it confuses readers, creates false
dependencies in search results, and slows down refactors because people are
afraid to touch code they don't understand. In a pre-MVP codebase the calculus
is simple — there are no external consumers, no published APIs, no reason to
keep anything around "just in case." Delete aggressively, verify the build, move
on.

## Phase 1: Understand the Project

Before removing anything, understand what you're working with.

1. Read the project's CLAUDE.md, README, and package.json files to understand
   the structure, build system, and conventions.
2. Identify the verification commands (typecheck, build, test, lint). You'll run
   these after each major removal pass to catch breakage early.
3. Note the package boundaries — in a monorepo, each package has its own public
   API surface. An export that looks unused within one package might be consumed
   by another.

## Phase 2: Audit

Work through each category below. For each one, search the entire codebase —
not just the current package. Use Grep and Glob, not guesswork.

If the user's request focuses on a specific category (e.g., "audit
dependencies"), cover that category thoroughly — but still do a quick scan of
the other categories and note anything obvious you spot. Mention which
categories you skipped and why (e.g., "The user asked specifically about
dependencies; the remaining categories were not audited").

Create a task for each category as you work through it so progress is visible.

### 2a. Unused Dependencies

Check every dependency in every `package.json`:

```bash
# For each package, list dependencies and check if they're actually imported
```

For each dependency, grep the package's `src/` directory for imports of that
module. A dependency that appears in `package.json` but is never imported is
dead. Also watch for:

- Dependencies that were replaced (e.g., an old HTTP client swapped for a new
  one but never removed from package.json)
- `devDependencies` for tools no longer referenced in scripts or config files
- Peer dependencies listed but never actually used

Don't remove dependencies that are used implicitly (PostCSS plugins referenced
in config files, Vite plugins, TypeScript types packages used via `tsconfig`
references, etc.). Check config files before declaring a dependency unused.

### 2b. Unused Exports

For each TypeScript/JavaScript source file, identify every named export. Then
search the rest of the codebase for imports of that symbol. An export with zero
consumers outside its own file is dead — either remove the export keyword (if
the symbol is used locally) or delete the symbol entirely (if nothing references
it at all).

Pay special attention to barrel files (`index.ts`). They often re-export symbols
that were removed or renamed elsewhere. A re-export of a symbol nobody imports
is doubly useless.

In a monorepo, check cross-package imports. A symbol exported from
`packages/mcp` might be imported by `applications/web`. Grep the entire repo
root, not just the local package.

### 2c. Unused Files

Look for source files that are never imported by anything. Common culprits:

- Old utility files superseded by a different approach
- Test fixtures for tests that were deleted
- Config files for tools no longer in use
- Migration files that were experiments and never applied (be careful here —
  applied migrations should be kept)

For each candidate, verify by grepping for the filename (without extension)
across the codebase. Also check if it's referenced in any config file, build
script, or dynamic import.

### 2d. Backwards-Compatibility Code

This is code that exists solely to preserve an old API shape. In a pre-MVP
project, there are no external consumers — this code is always dead. Look for:

- Re-export files that alias old names to new ones
- Wrapper functions that just call through to another function
- `@deprecated` JSDoc tags — if it's deprecated, delete it
- Comments like `// for backwards compatibility`, `// legacy`, `// TODO: remove`
- Symbols with names like `legacyX`, `oldX`, `_deprecated_X`
- Feature flags or environment checks that gate code for gradual rollouts (in
  pre-MVP, just keep the new code path)

### 2e. Commented-Out Code

Commented-out code is dead code with extra noise. Version control exists
precisely so you don't need to keep old code around in comments. Search for:

- Large blocks of commented-out code (3+ consecutive commented lines that look
  like code, not documentation)
- `// TODO: uncomment when...` patterns
- Code inside `if (false)` or `if (0)` blocks

Remove it. If someone needs it later, `git log` has it.

### 2f. Unused Type Definitions

Types and interfaces that are never referenced anywhere. These accumulate when
the code they described gets refactored but the types are left behind. Check:

- Interfaces and type aliases in dedicated type files
- Exported types that nothing imports
- Generic type utilities that were written for a pattern that was abandoned

### 2g. Dead CSS

Selectors that don't match any elements in the markup. In component frameworks
(Svelte, React, Vue), scoped styles are only relevant to their own component —
check that the selectors actually match elements in the template/JSX.

Also look for:

- CSS custom properties (variables) that are defined but never consumed
- Entire stylesheets that are imported but whose selectors are all dead
- Duplicate style rules (same selector + properties defined in multiple places)

### 2h. Dead Routes and Endpoints

In web applications, look for:

- Route files that are never linked to from any navigation or redirect
- API endpoints that no client code calls
- Middleware that's registered but does nothing (passes through without
  modifying the request/response)

Be careful here — some routes are entry points (like OAuth callbacks or
webhooks) that won't have explicit callers in the codebase. Check for external
references before removing.

## Phase 3: Remove

After completing the audit, you'll have a list of things to remove. Group the
removals by impact level:

1. **Safe removals** — Clearly unused: no imports, no references, no dynamic
   usage. Remove these first.
2. **Likely safe** — Appears unused but has some ambiguity (dynamic imports,
   string-based references, config-based loading). Verify more carefully.
3. **Needs confirmation** — Might be used by external systems, scripts, or in
   ways that aren't visible in the source code. Flag these for the user.

For each removal:

1. Remove the dead code
2. Remove any imports that become unused as a result
3. If removing an export causes a barrel file to have nothing left, remove the
   barrel file too
4. If removing a file causes a directory to be empty, remove the directory

After each major category of removals, run the verification suite. Don't
accumulate a giant pile of deletions and then discover something broke — verify
incrementally.

## Phase 4: Verify and Report

Verification is not optional and is not a suggestion — it's part of the
deliverable. The user needs to see that the codebase still builds and passes
after your removals.

1. Run the full verification suite: typecheck, build, test, lint (all four)
2. Fix any breakage you introduced
3. Run verification again after fixes until everything is green
4. Include the verification results in your final report — specifically state
   which commands you ran and that they passed. For example:
   ```
   ## Verification
   - `bun turbo typecheck` — passed (0 errors)
   - `bun turbo build` — passed
   - `bun turbo test` — passed (N tests, 0 failures)
   - `bun turbo lint` — passed (no errors)
   ```

If you're writing a report-only audit (no removals), still include a
**Recommended Verification Plan** section listing the exact commands to run
after the removals are applied, so the reader knows how to validate safely.

## Edge Cases

- **Dynamic imports**: `import()` with variable paths can't be statically
  analyzed. If you see dynamic imports, check what values the variable can take
  before declaring anything unused.
- **Reflection / string-based references**: Some frameworks reference components
  or routes by string name. Grep for the string, not just the import.
- **Test-only exports**: Exports used only by test files are still used. Don't
  remove them unless the tests are also dead.
- **Generated code**: Don't audit generated files (`.svelte-kit/`, `dist/`,
  `node_modules/`, `drizzle/meta/`). Focus on source code.
- **Migration files**: Applied database migrations should never be deleted —
  they're part of the migration history. Only remove migration files that were
  never applied.
