import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const referenceCache: Record<string, string> = {};

export async function readReference(filename: string): Promise<string> {
  if (filename in referenceCache) return referenceCache[filename];
  const filePath = fileURLToPath(import.meta.resolve(`../references/${filename}`));
  referenceCache[filename] = await fs.readFile(filePath, 'utf-8');
  return referenceCache[filename];
}

export async function readAllReferences(filenames: string[]): Promise<string> {
  const contents = await Promise.all(filenames.map(readReference));
  return contents.join('\n\n---\n\n');
}
