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

  it('includes recurring patterns section when 2+ adaptations share needs', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '6-8' },
      },
    ]);
    // Two recent adaptations with overlapping needs
    setQueryResult(1, [
      {
        id: 'adaptation-1',
        createdAt: new Date('2026-02-10'),
        adaptationSummary: {
          lessonTitle: 'Photosynthesis Lab',
          lessonSummary: 'Lab about plants',
          activityCount: 3,
          adaptationCount: 4,
          quickWinCount: 2,
          depthMode: 'standard',
          topStrategies: ['visual supports'],
          needsAddressed: ['visual-supports', 'text-read-aloud', 'simplified-text'],
        },
      },
      {
        id: 'adaptation-2',
        createdAt: new Date('2026-02-20'),
        adaptationSummary: {
          lessonTitle: 'Cell Division Review',
          lessonSummary: 'Review activity',
          activityCount: 2,
          adaptationCount: 3,
          quickWinCount: 1,
          depthMode: 'standard',
          topStrategies: ['graphic organizers'],
          needsAddressed: ['visual-supports', 'graphic-organizers'],
        },
      },
    ]);
    // Reflections for both adaptations
    setQueryResult(2, [
      {
        adaptedLessonId: 'adaptation-1',
        reflectionData: {
          whatWorked: ['Color-coded vocabulary cards'],
          whatDidNotWork: ['Station rotation was too chaotic'],
          overallRating: 'very-helpful',
        },
      },
      {
        adaptedLessonId: 'adaptation-2',
        reflectionData: {
          whatWorked: ['Graphic organizer for cell stages', 'Color-coded vocabulary cards'],
          whatDidNotWork: ['Timed activities caused anxiety'],
          overallRating: 'somewhat-helpful',
        },
      },
    ]);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson about ecosystems' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;

    // Should have the recurring patterns section
    expect(text).toContain('Recurring Patterns');

    // visual-supports appears in both adaptations, so it should be flagged as recurring
    expect(text).toContain('visual-supports');
    expect(text).toContain('Recurring needs across lessons');

    // Strategies that worked should be aggregated
    expect(text).toContain('Strategies that have worked');
    expect(text).toContain('Color-coded vocabulary cards');

    // Strategies that did not work should be aggregated
    expect(text).toContain('Strategies that have not worked');
    expect(text).toContain('Station rotation was too chaotic');
  });

  it('does not include recurring patterns section with only 1 adaptation', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: { gradeRange: '3-5' },
      },
    ]);
    // Only one adaptation
    setQueryResult(1, [
      {
        id: 'adaptation-1',
        createdAt: new Date('2026-02-15'),
        adaptationSummary: {
          lessonTitle: 'Photosynthesis Lab',
          lessonSummary: 'Lab activity',
          activityCount: 3,
          adaptationCount: 5,
          quickWinCount: 2,
          depthMode: 'standard',
          topStrategies: ['visual supports'],
          needsAddressed: ['visual-supports'],
        },
      },
    ]);
    setQueryResult(2, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test lesson plan' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    expect(text).toContain('Patterns from Previous Adaptations');
    expect(text).not.toContain('Recurring Patterns');
  });

  it('only flags needs that appear in 2+ adaptations as recurring', async () => {
    setQueryResult(0, [
      {
        needs: [{ tag: 'visual-supports', category: 'representation' }],
        teachingContext: {},
      },
    ]);
    setQueryResult(1, [
      {
        id: 'adaptation-1',
        createdAt: new Date('2026-02-10'),
        adaptationSummary: {
          lessonTitle: 'Lesson A',
          lessonSummary: 'A',
          activityCount: 2,
          adaptationCount: 2,
          quickWinCount: 1,
          depthMode: 'standard',
          topStrategies: [],
          needsAddressed: ['visual-supports', 'text-read-aloud'],
        },
      },
      {
        id: 'adaptation-2',
        createdAt: new Date('2026-02-20'),
        adaptationSummary: {
          lessonTitle: 'Lesson B',
          lessonSummary: 'B',
          activityCount: 2,
          adaptationCount: 2,
          quickWinCount: 1,
          depthMode: 'standard',
          topStrategies: [],
          needsAddressed: ['visual-supports', 'extended-time'],
        },
      },
    ]);
    setQueryResult(2, []);

    const result = await adaptLessonPrompt.handler(
      { lesson_plan: 'Test plan' },
      { userId: 'test-user' },
    );

    const text = result.messages[0].content.text;
    // visual-supports appears in both → recurring
    expect(text).toContain('visual-supports');
    // text-read-aloud only in one → not flagged as recurring
    // extended-time only in one → not flagged as recurring
    // The recurring needs line should list visual-supports but not the others
    const recurringLine = text
      .split('\n')
      .find((line: string) => line.includes('Recurring needs across lessons'));
    expect(recurringLine).toBeDefined();
    expect(recurringLine).toContain('visual-supports');
    expect(recurringLine).not.toContain('text-read-aloud');
    expect(recurringLine).not.toContain('extended-time');
  });
});
