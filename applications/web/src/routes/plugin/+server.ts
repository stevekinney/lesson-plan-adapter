import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createZipArchive } from '$lib/create-zip-archive';
import { collectFiles, getRepositoryRoot } from '$lib/collect-files';

let cachedZip: Uint8Array | undefined;

function getPluginZip(): Uint8Array {
  if (cachedZip) return cachedZip;

  const repositoryRoot = getRepositoryRoot();
  const pluginDirectory = resolve(repositoryRoot, 'distribution', 'plugin');
  const skillDirectory = resolve(repositoryRoot, 'distribution', 'skill');

  if (!existsSync(pluginDirectory)) {
    error(404, 'Plugin distribution not found.');
  }

  if (!existsSync(skillDirectory)) {
    error(404, 'Skill distribution not found. Run: bun generate:references');
  }

  const pluginFiles = collectFiles(pluginDirectory, pluginDirectory);

  const skillFiles = collectFiles(skillDirectory, skillDirectory).map((entry) => ({
    path: `skills/lesson-plan-adapter/${entry.path}`,
    data: entry.data,
  }));

  cachedZip = createZipArchive([...pluginFiles, ...skillFiles]);
  return cachedZip;
}

export const GET: RequestHandler = async () => {
  const zip = getPluginZip();
  const body = new Uint8Array(zip);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="lesson-plan-adapter-plugin.zip"',
      'Content-Length': String(zip.byteLength),
    },
  });
};
