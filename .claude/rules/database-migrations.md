---
paths:
  - packages/database/drizzle/**
---

# Database migration guardrails

When creating or modifying migration files in `packages/database/drizzle/`:

- **Never include `CREATE TABLE "neon_auth".*` statements.** The `neon_auth` schema (user, session, account, verification) is managed externally by Neon Auth. Including these statements causes `db:migrate` to fail on deploy.
- **Never include `ALTER TABLE "neon_auth".*` statements that add FKs between neon_auth tables.** These are internal to the neon_auth schema and not our concern.
- **Do include `ALTER TABLE ... REFERENCES "neon_auth"."user"("id")` FKs** from public-schema tables. These cross-schema foreign keys are correct and necessary.
- **Never edit files in `drizzle/meta/`.** The snapshot must reflect the full schema (including neon_auth tables) so that future `drizzle-kit generate` runs produce correct incremental diffs.

`drizzle-kit generate` will always emit neon_auth statements because `schemaFilter` does not affect generation. Strip them manually after every generate.
