import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const templateCache: Record<string, string> = {};

export async function readTemplate(filename: string): Promise<string> {
  if (filename in templateCache) return templateCache[filename];
  const filePath = fileURLToPath(import.meta.resolve(`../templates/${filename}`));
  templateCache[filename] = await fs.readFile(filePath, 'utf-8');
  return templateCache[filename];
}
