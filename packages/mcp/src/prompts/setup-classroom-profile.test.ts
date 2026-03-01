import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import { mockQueryResult, setupDatabaseMock, resetQueryCallCount } from './lib/test-helpers';

beforeAll(() => {
  setupDatabaseMock();
});

beforeEach(() => {
  mockQueryResult.length = 0;
  resetQueryCallCount();
});

const { setupClassroomProfilePrompt } = await import('./setup-classroom-profile');

describe('setupClassroomProfilePrompt', () => {
  it('has the expected name', () => {
    expect(setupClassroomProfilePrompt.name).toBe('setup_classroom_profile');
  });

  it('has a description', () => {
    expect(setupClassroomProfilePrompt.description).toBeTruthy();
  });

  it('has a handler function', () => {
    expect(typeof setupClassroomProfilePrompt.handler).toBe('function');
  });
});

describe('setupClassroomProfilePrompt.handler', () => {
  it('returns onboarding content with reference separators in setup mode', async () => {
    mockQueryResult.length = 0;

    const result = await setupClassroomProfilePrompt.handler({} as Record<string, never>, {
      userId: 'test-user',
    });

    const text = result.messages[0].content.text;
    expect(text).toContain('\n\n---\n\n');
    expect(text).toContain('Taxonomy');
    expect(text).toContain('Onboarding Artifact Specification');
  });

  it('does not include adaptation-specific localStorage guidance', async () => {
    mockQueryResult.length = 0;

    const result = await setupClassroomProfilePrompt.handler({} as Record<string, never>, {
      userId: 'test-user',
    });

    const text = result.messages[0].content.text;
    expect(text).not.toContain('window.localStorage');
  });

  it('includes the onboarding template content', async () => {
    mockQueryResult.length = 0;

    const result = await setupClassroomProfilePrompt.handler({} as Record<string, never>, {
      userId: 'test-user',
    });

    const text = result.messages[0].content.text;
    expect(text).toContain('classroom profile setup');
  });
});
