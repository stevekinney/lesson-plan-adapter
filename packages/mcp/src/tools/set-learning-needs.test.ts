import { describe, it, expect } from 'bun:test';
import { setLearningNeedsTool } from './set-learning-needs';

describe('setLearningNeedsTool', () => {
  it('has the expected name', () => {
    expect(setLearningNeedsTool.name).toBe('set_learning_needs');
  });

  it('has a description', () => {
    expect(setLearningNeedsTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(setLearningNeedsTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof setLearningNeedsTool.handler).toBe('function');
  });

  it('rejects invalid tags before any database access', async () => {
    const result = await setLearningNeedsTool.handler(
      {
        needs: [{ tag: 'not-a-real-tag', category: 'representation' }],
      },
      { userId: 'test-user-id' },
    );

    expect(result.isError).toBe(true);

    const firstContent = result.content[0];
    expect(firstContent?.type).toBe('text');

    if (!firstContent || firstContent.type !== 'text') {
      throw new Error('Expected text response');
    }

    const payload = JSON.parse(firstContent.text) as {
      error: string;
      invalidTags: string[];
    };

    expect(payload.error).toBe('Invalid tags');
    expect(payload.invalidTags).toEqual(['not-a-real-tag']);
  });

  it('rejects tag-category mismatches before any database access', async () => {
    const result = await setLearningNeedsTool.handler(
      {
        needs: [{ tag: 'visual-supports', category: 'engagement' }],
      },
      { userId: 'test-user-id' },
    );

    expect(result.isError).toBe(true);

    const firstContent = result.content[0];
    expect(firstContent?.type).toBe('text');

    if (!firstContent || firstContent.type !== 'text') {
      throw new Error('Expected text response');
    }

    const payload = JSON.parse(firstContent.text) as {
      error: string;
      invalidTagCategoryPairs: Array<{
        tag: string;
        providedCategory: string;
        expectedCategory: string;
      }>;
    };

    expect(payload.error).toBe('Invalid tag-category pairs');
    expect(payload.invalidTagCategoryPairs).toEqual([
      {
        tag: 'visual-supports',
        providedCategory: 'engagement',
        expectedCategory: 'representation',
      },
    ]);
  });
});
