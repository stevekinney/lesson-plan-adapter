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

const { updateTeachingContextTool } = await import('./update-teaching-context');

describe('updateTeachingContextTool', () => {
  it('has the expected name', () => {
    expect(updateTeachingContextTool.name).toBe('update_teaching_context');
  });

  it('has a description', () => {
    expect(updateTeachingContextTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(updateTeachingContextTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof updateTeachingContextTool.handler).toBe('function');
  });
});

describe('updateTeachingContextTool.inputSchema', () => {
  it('accepts teachingPriorities as a string', () => {
    const result = updateTeachingContextTool.inputSchema.safeParse({
      teachingPriorities: 'student independence and equity',
    });
    expect(result.success).toBe(true);
  });

  it('accepts knownConstraints as a string', () => {
    const result = updateTeachingContextTool.inputSchema.safeParse({
      knownConstraints: 'no para support, 30+ students',
    });
    expect(result.success).toBe(true);
  });

  it('accepts both new fields together with existing fields', () => {
    const result = updateTeachingContextTool.inputSchema.safeParse({
      gradeRange: '6-8',
      subjectAreas: ['ELA'],
      teachingPriorities: 'engagement',
      knownConstraints: 'shared classroom',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = updateTeachingContextTool.inputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid gradeRange values', () => {
    const result = updateTeachingContextTool.inputSchema.safeParse({
      gradeRange: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateTeachingContextTool.handler', () => {
  it('creates a new profile when none exists', async () => {
    // Query 0: no existing profile
    setQueryResult(0, []);

    const result = await updateTeachingContextTool.handler(
      { teachingPriorities: 'building confidence' },
      { userId: 'test-user' },
    );

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.teachingContext.teachingPriorities).toBe('building confidence');
  });

  it('merges new fields with existing teaching context', async () => {
    // Query 0: existing profile with some context
    setQueryResult(0, [
      {
        teachingContext: { gradeRange: '6-8', subjectAreas: ['ELA'] },
        needs: [],
      },
    ]);

    const result = await updateTeachingContextTool.handler(
      { knownConstraints: 'no aide available' },
      { userId: 'test-user' },
    );

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.teachingContext.gradeRange).toBe('6-8');
    expect(parsed.teachingContext.subjectAreas).toEqual(['ELA']);
    expect(parsed.teachingContext.knownConstraints).toBe('no aide available');
  });

  it('updates teachingPriorities on an existing profile', async () => {
    setQueryResult(0, [
      {
        teachingContext: {
          gradeRange: '3-5',
          teachingPriorities: 'old priorities',
        },
        needs: [],
      },
    ]);

    const result = await updateTeachingContextTool.handler(
      { teachingPriorities: 'student independence' },
      { userId: 'test-user' },
    );

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.teachingContext.teachingPriorities).toBe('student independence');
    expect(parsed.teachingContext.gradeRange).toBe('3-5');
  });
});
