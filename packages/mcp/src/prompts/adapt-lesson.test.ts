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

const { adaptLessonPrompt } = await import('./adapt-lesson');

describe('adaptLessonPrompt', () => {
  it('has the expected name', () => {
    expect(adaptLessonPrompt.name).toBe('adapt_lesson');
  });

  it('has a description', () => {
    expect(adaptLessonPrompt.description).toBeTruthy();
  });

  it('has an arguments schema with a lesson_plan field', () => {
    expect(adaptLessonPrompt.arguments).toBeDefined();
    expect(adaptLessonPrompt.arguments.lesson_plan).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof adaptLessonPrompt.handler).toBe('function');
  });
});

describe('adaptLessonPrompt.handler', () => {
  it('returns onboarding content with reference separators when no profile exists', async () => {
    // Query 0: profile lookup returns empty
    setQueryResult(0, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson plan' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('\n\n---\n\n');
    expect(text).toContain('Taxonomy');
    expect(text).toContain('Onboarding Artifact Specification');
  });

  it('returns adaptation content with reference separators when profile exists', async () => {
    // Query 0: profile lookup returns a profile
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '3-5' },
      },
    ]);
    // Query 1: adapted lessons returns empty (no history)
    setQueryResult(1, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson plan' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('\n\n---\n\n');
    expect(text).toContain('Adaptation Artifact Specification');
    expect(text).toContain('Universal Design for Learning');
    expect(text).toContain('Differentiation Strategy Library');
    expect(text).toContain('Effort Level Definitions');
    expect(text).toContain('Teaching Context');
  });

  it('includes the lesson plan text in the adaptation output', async () => {
    // Query 0: profile lookup returns a profile
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: {},
      },
    ]);
    // Query 1: adapted lessons returns empty
    setQueryResult(1, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'My unique lesson about photosynthesis' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('My unique lesson about photosynthesis');
  });

  it('includes adaptation history and reflection data when past adaptations exist', async () => {
    // Query 0: profile lookup returns a profile
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '3-5' },
      },
    ]);
    // Query 1: recent adapted lessons
    setQueryResult(1, [
      {
        id: 'adaptation-1',
        createdAt: new Date('2026-02-15'),
        adaptationSummary: {
          lessonTitle: 'Photosynthesis Lab',
          lessonSummary: 'Hands-on lab about photosynthesis',
          activityCount: 3,
          adaptationCount: 5,
          quickWinCount: 2,
          depthMode: 'standard',
          topStrategies: ['visual supports', 'simplified instructions'],
          needsAddressed: ['visual-supports', 'text-read-aloud'],
        },
      },
    ]);
    // Query 2: reflections for recent adaptations
    setQueryResult(2, [
      {
        adaptedLessonId: 'adaptation-1',
        reflectionData: {
          whatWorked: ['Vocabulary chart was very effective'],
          whatDidNotWork: ['Graphic organizer was too complex'],
          overallRating: 'very-helpful',
        },
      },
    ]);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson about ecosystems' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('Patterns from Previous Adaptations');
    expect(text).toContain('Photosynthesis Lab');
    expect(text).toContain('Vocabulary chart was very effective');
    expect(text).toContain('Graphic organizer was too complex');
  });

  it('uses the quick-scan template when depth_mode is quick-scan', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '3-5' },
      },
    ]);
    setQueryResult(1, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson plan', depth_mode: 'quick-scan' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('Quick Wins Identification');
    expect(text).not.toContain('Transition Analysis');
  });

  it('uses the deep-dive template when depth_mode is deep-dive', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '3-5' },
      },
    ]);
    setQueryResult(1, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson plan', depth_mode: 'deep-dive' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('Activity-by-Activity Walkthrough');
    expect(text).toContain('Consolidation');
  });
});
