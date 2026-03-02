import { describe, it, expect } from 'bun:test';
import { readTemplate } from './read-template';

describe('readTemplate', () => {
  it('reads a template file by filename', async () => {
    const content = await readTemplate('adapt-lesson.md');
    expect(content).toContain('Lesson Plan Analysis');
  });

  it('returns the same content on subsequent calls', async () => {
    const first = await readTemplate('onboarding.md');
    const second = await readTemplate('onboarding.md');
    expect(first).toBe(second);
  });

  it('throws for a nonexistent template file', async () => {
    await expect(readTemplate('nonexistent-template.md')).rejects.toThrow(
      'Unknown template: nonexistent-template.md',
    );
  });
});
