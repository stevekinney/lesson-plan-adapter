import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import {
  mockQueryResult,
  setupDatabaseMock,
  setQueryResult,
  resetQueryCallCount,
} from './lib/test-helpers';

beforeAll(() => {
  setupDatabaseMock();
});

beforeEach(() => {
  mockQueryResult.length = 0;
  resetQueryCallCount();
});

const { deepDiveActivityPrompt } = await import('./deep-dive-activity');

describe('deepDiveActivityPrompt', () => {
  it('has the expected name', () => {
    expect(deepDiveActivityPrompt.name).toBe('deep_dive_activity');
  });

  it('has a description', () => {
    expect(deepDiveActivityPrompt.description).toBeTruthy();
  });

  it('has an arguments schema with activity_name and activity_text fields', () => {
    expect(deepDiveActivityPrompt.arguments).toBeDefined();
    expect(deepDiveActivityPrompt.arguments.activity_name).toBeDefined();
    expect(deepDiveActivityPrompt.arguments.activity_text).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof deepDiveActivityPrompt.handler).toBe('function');
  });
});

describe('deepDiveActivityPrompt.handler', () => {
  it('returns a fallback message when no profile exists', async () => {
    setQueryResult(0, []);

    const result = await deepDiveActivityPrompt.handler(
      { activity_name: 'Warm-up', activity_text: 'Students do a warm-up' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('no classroom profile');
  });

  it('returns rendered prompt with references when profile exists', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '3-5' },
      },
    ]);

    const result = await deepDiveActivityPrompt.handler(
      { activity_name: 'Guided Reading', activity_text: 'Students read in small groups' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('Guided Reading');
    expect(text).toContain('Students read in small groups');
    expect(text).toContain('\n\n---\n\n');
    expect(text).toContain('Universal Design for Learning');
  });

  it('includes prior adaptations when provided', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: {},
      },
    ]);

    const result = await deepDiveActivityPrompt.handler(
      {
        activity_name: 'Lab Work',
        activity_text: 'Students conduct experiment',
        prior_adaptations: 'Already suggested: add visual instructions',
      },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('Already suggested: add visual instructions');
  });
});
