/**
 * Merge runtime dependencies from all workspace packages into a single
 * package.json suitable for `npm install --omit=dev` in a Docker stage.
 *
 * Workspace references (workspace:*) are stripped because SvelteKit
 * bundles that code at build time.
 *
 * Usage: node scripts/merge-production-dependencies.ts /output/directory
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WORKSPACE_PACKAGES = [
  'applications/web/package.json',
  'packages/database/package.json',
  'packages/mcp/package.json',
  'packages/components/package.json',
];

const outputDirectory = process.argv[2];

if (!outputDirectory) {
  console.error('Usage: node scripts/merge-production-dependencies.ts <output-directory>');
  process.exit(1);
}

const merged: Record<string, string> = {};

for (const packagePath of WORKSPACE_PACKAGES) {
  if (!existsSync(packagePath)) continue;

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  const dependencies: Record<string, string> = packageJson.dependencies ?? {};

  for (const [name, version] of Object.entries(dependencies)) {
    if (version.startsWith('workspace:')) continue;
    if (!merged[name] || merged[name] < version) {
      merged[name] = version;
    }
  }
}

const outputPath = resolve(outputDirectory);
mkdirSync(outputPath, { recursive: true });

writeFileSync(
  resolve(outputPath, 'package.json'),
  JSON.stringify(
    {
      name: 'lesson-adapter-production',
      private: true,
      dependencies: merged,
    },
    null,
    2,
  ) + '\n',
);

console.log(`Wrote production package.json to ${outputPath}/package.json`);
console.log(`Merged ${Object.keys(merged).length} dependencies.`);
