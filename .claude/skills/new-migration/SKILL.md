# Skill: New Migration

Create and apply a Drizzle ORM migration.

## Steps

1. Make schema changes in `packages/database/src/schema.ts`
2. Generate migration: `bun turbo db:generate`
3. **Verify the generated SQL does not contain `neon_auth` statements.** Read the new `.sql` file in `packages/database/drizzle/` and check for:
   - `CREATE TABLE "neon_auth".*` — these tables are managed externally by Neon Auth
   - `ALTER TABLE "neon_auth".*` — internal FK constraints between neon_auth tables
   - If found, remove those statements from the migration. Keep cross-schema FKs from public tables to `neon_auth."user"("id")` — those are correct.
   - Do **not** edit the `meta/` snapshot — it must reflect the full schema so future generates don't re-add neon_auth tables.
4. Review the remaining SQL for correctness — Drizzle may generate destructive operations
5. Validate: `cd packages/database && bunx drizzle-kit check`
6. Apply: `bun scripts/migrate.ts`

## Why neon_auth leaks into migrations

Drizzle Kit's `schemaFilter` option only affects `push`/`pull`/`introspect` — it has no effect on `generate`. The `generate` command processes every table defined in the schema file, including the `neon_auth` reference tables needed for FK declarations. There is no way to exclude them at the config level, so manual verification after generation is required.

## Important

- All `neon_auth.*` tables are managed by Neon Auth and already exist when the service is provisioned — the migration must never try to create them
- Use `DATABASE_URL_UNPOOLED` for migrations (direct connection, not pooled)
- In CI, `db:validate` runs against a Neon branch (not production)
