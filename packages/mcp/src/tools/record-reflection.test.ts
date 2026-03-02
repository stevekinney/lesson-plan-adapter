import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import {
  setupDatabaseMock,
  setQueryResult,
  resetQueryCallCount,
} from '../prompts/lib/test-helpers';

beforeAll(() => {
  setupDatabaseMock();
});

beforeEach(() => {
  resetQueryCallCount();
});

const { recordReflectionTool } = await import('./record-reflection');

describe('recordReflectionTool', () => {
  it('has the expected name', () => {
    expect(recordReflectionTool.name).toBe('record_reflection');
  });

  it('has a description', () => {
    expect(recordReflectionTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(recordReflectionTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof recordReflectionTool.handler).toBe('function');
  });
});

describe('recordReflectionTool.handler', () => {
  it('returns error when adapted lesson is not found', async () => {
    // Query 0: ownership check returns empty (lesson not found)
    setQueryResult(0, []);

    const result = await recordReflectionTool.handler(
      {
        adapted_lesson_id: '00000000-0000-0000-0000-000000000000',
        what_worked: ['Visual chart helped'],
        what_did_not_work: [],
        overall_rating: 'very-helpful' as const,
      },
      { userId: 'test-user' },
    );

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toContain('not found');
  });

  it('returns success when lesson exists and reflection is saved', async () => {
    // Query 0: ownership check returns the lesson
    setQueryResult(0, [{ id: 'adaptation-1' }]);

    const result = await recordReflectionTool.handler(
      {
        adapted_lesson_id: 'adaptation-1',
        what_worked: ['Vocabulary chart was effective'],
        what_did_not_work: ['Graphic organizer was too complex'],
        surprises: 'Students finished early',
        would_change_next: 'Simplify the organizer',
        overall_rating: 'very-helpful' as const,
      },
      { userId: 'test-user' },
    );

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toContain('Reflection saved');
  });

  it('accepts needs_addressed and needs_not_addressed fields', async () => {
    setQueryResult(0, [{ id: 'adaptation-1' }]);

    const result = await recordReflectionTool.handler(
      {
        adapted_lesson_id: 'adaptation-1',
        what_worked: ['Visual supports helped'],
        what_did_not_work: [],
        overall_rating: 'somewhat-helpful' as const,
        needs_addressed: ['visual-supports', 'text-read-aloud'],
        needs_not_addressed: ['extended-time'],
      },
      { userId: 'test-user' },
    );

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
  });

  it('accepts rejected_suggestions field', async () => {
    setQueryResult(0, [{ id: 'adaptation-1' }]);

    const result = await recordReflectionTool.handler(
      {
        adapted_lesson_id: 'adaptation-1',
        what_worked: ['Sentence starters worked'],
        what_did_not_work: [],
        overall_rating: 'very-helpful' as const,
        rejected_suggestions: [
          {
            suggestion: 'Add station rotation',
            reason: 'Not enough space in my classroom',
          },
          {
            suggestion: 'Use audio recording for assessment',
            reason: 'Students do not have devices',
          },
        ],
      },
      { userId: 'test-user' },
    );

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
  });
});

describe('recordReflectionTool.inputSchema', () => {
  it('validates needs_addressed as an array of strings', () => {
    const schema = recordReflectionTool.inputSchema;
    const result = schema.safeParse({
      adapted_lesson_id: '00000000-0000-0000-0000-000000000000',
      what_worked: ['test'],
      what_did_not_work: [],
      overall_rating: 'very-helpful',
      needs_addressed: ['visual-supports'],
    });
    expect(result.success).toBe(true);
  });

  it('validates needs_not_addressed as an array of strings', () => {
    const schema = recordReflectionTool.inputSchema;
    const result = schema.safeParse({
      adapted_lesson_id: '00000000-0000-0000-0000-000000000000',
      what_worked: ['test'],
      what_did_not_work: [],
      overall_rating: 'very-helpful',
      needs_not_addressed: ['extended-time'],
    });
    expect(result.success).toBe(true);
  });

  it('validates rejected_suggestions as array of objects with suggestion and reason', () => {
    const schema = recordReflectionTool.inputSchema;
    const result = schema.safeParse({
      adapted_lesson_id: '00000000-0000-0000-0000-000000000000',
      what_worked: ['test'],
      what_did_not_work: [],
      overall_rating: 'very-helpful',
      rejected_suggestions: [{ suggestion: 'Use tablets', reason: 'No devices' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects rejected_suggestions with missing reason field', () => {
    const schema = recordReflectionTool.inputSchema;
    const result = schema.safeParse({
      adapted_lesson_id: '00000000-0000-0000-0000-000000000000',
      what_worked: ['test'],
      what_did_not_work: [],
      overall_rating: 'very-helpful',
      rejected_suggestions: [{ suggestion: 'Use tablets' }],
    });
    expect(result.success).toBe(false);
  });

  it('allows all new fields to be omitted', () => {
    const schema = recordReflectionTool.inputSchema;
    const result = schema.safeParse({
      adapted_lesson_id: '00000000-0000-0000-0000-000000000000',
      what_worked: ['test'],
      what_did_not_work: [],
      overall_rating: 'somewhat-helpful',
    });
    expect(result.success).toBe(true);
  });
});
