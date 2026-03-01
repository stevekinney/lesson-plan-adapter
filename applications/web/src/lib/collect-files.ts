import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

let cachedRepositoryRoot: string | undefined;

/**
 * Locate the repository (or container) root.
 *
 * Deferred to first call so SvelteKit's postbuild analysis can import this
 * module without triggering a filesystem check at build time.
 *
 * Resolution order:
 * 1. `process.cwd()` — check for `distribution/`. Works in Docker (`WORKDIR /app`)
 *    and when running from the repo root.
 * 2. Walk up from `import.meta.dirname` — check for `turbo.json`, which only
 *    exists at the monorepo root. Works in Vite dev and CI builds where CWD is
 *    a subdirectory (e.g. `applications/web`).
 */
export function getRepositoryRoot(): string {
  if (cachedRepositoryRoot) return cachedRepositoryRoot;

  const cwdCandidate = process.cwd();
  if (existsSync(resolve(cwdCandidate, 'distribution'))) {
    cachedRepositoryRoot = cwdCandidate;
    return cachedRepositoryRoot;
  }

  let current = import.meta.dirname;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(current, 'turbo.json'))) {
      cachedRepositoryRoot = current;
      return cachedRepositoryRoot;
    }
    const parent = resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }

  throw new Error(
    'Cannot locate repository root. Ensure turbo.json exists at an ancestor directory, or distribution/ exists at the working directory.',
  );
}

interface FileEntry {
  path: string;
  data: Uint8Array;
}

/** Recursively collect all files in a directory, returning paths relative to `base`. */
export function collectFiles(directory: string, base: string): FileEntry[] {
  const entries: FileEntry[] = [];

  for (const name of readdirSync(directory)) {
    const fullPath = join(directory, name);
    const stat = lstatSync(fullPath);

    if (stat.isSymbolicLink()) continue;

    if (stat.isDirectory()) {
      entries.push(...collectFiles(fullPath, base));
    } else {
      entries.push({
        path: relative(base, fullPath).split('\\').join('/'),
        data: readFileSync(fullPath),
      });
    }
  }

  return entries;
}
