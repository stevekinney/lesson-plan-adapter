import { describe, it, expect, spyOn } from 'bun:test';
import fs from 'node:fs/promises';
import { readReference, readAllReferences } from './read-reference';

describe('readReference', () => {
  it('reads a reference file by filename', async () => {
    const content = await readReference('udl-framework.md');
    expect(content).toContain('Universal Design for Learning');
  });

  it('does not read from disk again on subsequent calls (caching)', async () => {
    const spy = spyOn(fs, 'readFile');
    await readReference('effort-levels.md');
    const callsAfterFirst = spy.mock.calls.length;
    await readReference('effort-levels.md');
    const callsAfterSecond = spy.mock.calls.length;
    expect(callsAfterSecond).toBe(callsAfterFirst);
    spy.mockRestore();
  });

  it('throws for a nonexistent reference file', async () => {
    await expect(readReference('nonexistent-file.md')).rejects.toThrow();
  });
});

describe('readAllReferences', () => {
  it('joins multiple reference files with separators', async () => {
    const result = await readAllReferences(['udl-framework.md', 'effort-levels.md']);
    expect(result).toContain('Universal Design for Learning');
    expect(result).toContain('Effort Level Definitions');
    expect(result).toContain('\n\n---\n\n');
  });

  it('returns a single file without separators', async () => {
    const single = await readAllReferences(['udl-framework.md']);
    const direct = await readReference('udl-framework.md');
    expect(single).toBe(direct);
  });

  it('returns empty string for empty array', async () => {
    const result = await readAllReferences([]);
    expect(result).toBe('');
  });
});
