import { describe, it, expect, spyOn } from 'bun:test';
import fs from 'node:fs/promises';
import { readTemplate } from './read-template';

describe('readTemplate', () => {
  it('reads a template file by filename', async () => {
    const content = await readTemplate('adapt-lesson.md');
    expect(content).toContain('Lesson Plan Analysis');
  });

  it('does not read from disk again on subsequent calls (caching)', async () => {
    const spy = spyOn(fs, 'readFile');
    await readTemplate('onboarding.md');
    const callsAfterFirst = spy.mock.calls.length;
    await readTemplate('onboarding.md');
    const callsAfterSecond = spy.mock.calls.length;
    expect(callsAfterSecond).toBe(callsAfterFirst);
    spy.mockRestore();
  });

  it('throws for a nonexistent template file', async () => {
    await expect(readTemplate('nonexistent-template.md')).rejects.toThrow();
  });
});
