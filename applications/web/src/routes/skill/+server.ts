import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createZipArchive } from '$lib/create-zip-archive';
import { collectFiles, getRepositoryRoot } from '$lib/collect-files';

let cachedZip: Uint8Array | undefined;

function getSkillZip(): Uint8Array {
  if (cachedZip) return cachedZip;

  const skillDirectory = resolve(getRepositoryRoot(), 'distribution', 'skill');

  if (!existsSync(skillDirectory)) {
    error(404, 'Skill distribution not found. Run: bun generate:skill-references');
  }

  cachedZip = createZipArchive(collectFiles(skillDirectory, skillDirectory));
  return cachedZip;
}

export const GET: RequestHandler = async () => {
  const zip = getSkillZip();
  const body = new Uint8Array(zip);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="lesson-plan-adapter-skill.zip"',
      'Content-Length': String(zip.byteLength),
    },
  });
};
