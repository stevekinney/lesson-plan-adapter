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

const { listMyAdaptationsTool } = await import('./list-my-adaptations');

describe('listMyAdaptationsTool', () => {
  it('has the expected name', () => {
    expect(listMyAdaptationsTool.name).toBe('list_my_adaptations');
  });

  it('has a description', () => {
    expect(listMyAdaptationsTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(listMyAdaptationsTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof listMyAdaptationsTool.handler).toBe('function');
  });
});

describe('listMyAdaptationsTool.handler', () => {
  it('returns empty list message when no adaptations exist', async () => {
    setQueryResult(0, []);

    const result = await listMyAdaptationsTool.handler({ limit: 10 }, { userId: 'test-user' });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.adaptations).toEqual([]);
    expect(parsed.message).toContain('No adapted lessons found');
  });

  it('returns mapped adaptations when results exist', async () => {
    setQueryResult(0, [
      {
        id: 'adaptation-1',
        adaptationSummary: {
          lessonTitle: 'Photosynthesis Lab',
          lessonSummary: 'Hands-on lab about photosynthesis',
          activityCount: 3,
          adaptationCount: 5,
          quickWinCount: 2,
          depthMode: 'standard',
          topStrategies: ['visual supports'],
          needsAddressed: ['visual-supports'],
        },
        createdAt: new Date('2026-02-15'),
      },
    ]);

    const result = await listMyAdaptationsTool.handler({ limit: 10 }, { userId: 'test-user' });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.totalCount).toBe(1);
    expect(parsed.adaptations[0].lessonTitle).toBe('Photosynthesis Lab');
    expect(parsed.adaptations[0].lessonSummary).toBe('Hands-on lab about photosynthesis');
    expect(parsed.adaptations[0].adaptationCount).toBe(5);
    expect(parsed.adaptations[0].quickWinCount).toBe(2);
    expect(parsed.adaptations[0].depthMode).toBe('standard');
  });
});
