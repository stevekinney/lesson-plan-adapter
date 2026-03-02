/**
 * Builds plugin.zip and skill.zip from the distribution/plugin directory
 * and writes them to applications/web/static/ for serving as static files.
 *
 * Run: bun scripts/build-distribution-archives.ts
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  lstatSync,
  writeFileSync,
} from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { createZipArchive } from './create-zip-archive.js';

const ROOT = resolve(import.meta.dirname, '..');
const PLUGIN_DIRECTORY = resolve(ROOT, 'distribution/plugin');
const SKILL_DIRECTORY = resolve(PLUGIN_DIRECTORY, 'skills/lesson-plan-adapter');
const OUTPUT_DIRECTORY = resolve(ROOT, 'applications/web/static');

interface FileEntry {
  path: string;
  data: Uint8Array;
}

function collectFiles(directory: string, base: string): FileEntry[] {
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

if (!existsSync(PLUGIN_DIRECTORY)) {
  console.error('distribution/plugin/ not found. Run generate:references first.');
  process.exit(1);
}

if (!existsSync(OUTPUT_DIRECTORY)) {
  mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
}

const pluginFiles = collectFiles(PLUGIN_DIRECTORY, PLUGIN_DIRECTORY);
const pluginZip = createZipArchive(pluginFiles);
writeFileSync(resolve(OUTPUT_DIRECTORY, 'plugin.zip'), pluginZip);
console.log(`plugin.zip: ${pluginFiles.length} files, ${pluginZip.byteLength} bytes`);

const skillFiles = collectFiles(SKILL_DIRECTORY, SKILL_DIRECTORY);
const skillZip = createZipArchive(skillFiles);
writeFileSync(resolve(OUTPUT_DIRECTORY, 'skill.zip'), skillZip);
console.log(`skill.zip: ${skillFiles.length} files, ${skillZip.byteLength} bytes`);
