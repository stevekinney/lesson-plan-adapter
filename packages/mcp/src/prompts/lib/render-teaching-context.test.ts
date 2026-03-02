import { describe, it, expect } from 'bun:test';
import { renderTeachingContext } from './render-teaching-context';

describe('renderTeachingContext', () => {
  it('returns default message for empty context', () => {
    expect(renderTeachingContext({})).toBe('No additional teaching context has been provided.');
  });

  it('renders full context', () => {
    const result = renderTeachingContext({
      gradeRange: '6-8',
      subjectAreas: ['ELA', 'Social Studies'],
      typicalBlockMinutes: 45,
      studentsHaveDevices: true,
      state: 'TX',
      additionalContext: 'I co-teach with a SPED teacher during 3rd period.',
    });
    expect(result).toContain('6-8');
    expect(result).toContain('ELA and Social Studies');
    expect(result).toContain('TX');
    expect(result).toContain('45-minute blocks');
    expect(result).toContain('Students have devices available.');
    expect(result).toContain('I co-teach with a SPED teacher during 3rd period.');
  });

  it('renders grade range only', () => {
    const result = renderTeachingContext({ gradeRange: 'K-2' });
    expect(result).toContain('K-2');
    expect(result).toContain('classroom');
  });

  it('renders subject areas only', () => {
    const result = renderTeachingContext({ subjectAreas: ['Math'] });
    expect(result).toContain('Math classroom');
  });

  it('renders state only', () => {
    const result = renderTeachingContext({ state: 'CA' });
    expect(result).toContain('classroom in CA');
  });

  it('renders block minutes only', () => {
    const result = renderTeachingContext({ typicalBlockMinutes: 90 });
    expect(result).toContain('90-minute blocks');
  });

  it('renders devices false', () => {
    const result = renderTeachingContext({ studentsHaveDevices: false });
    expect(result).toContain('Students do not have devices.');
  });

  it('renders additional context only', () => {
    const result = renderTeachingContext({ additionalContext: 'Small class of 12.' });
    expect(result).toBe('Small class of 12.');
  });

  it('renders partial context with grade and block', () => {
    const result = renderTeachingContext({
      gradeRange: '9-12',
      typicalBlockMinutes: 60,
    });
    expect(result).toContain('9-12');
    expect(result).toContain('60-minute blocks');
  });

  it('uses Oxford comma for three or more subject areas', () => {
    const result = renderTeachingContext({
      subjectAreas: ['ELA', 'Math', 'Science'],
    });
    expect(result).toContain('ELA, Math, and Science');
  });

  it('renders teaching priorities', () => {
    const result = renderTeachingContext({
      teachingPriorities: 'student independence and equity',
    });
    expect(result).toContain('Teaching priorities: student independence and equity.');
  });

  it('renders known constraints', () => {
    const result = renderTeachingContext({
      knownConstraints: 'no para support, 30+ students',
    });
    expect(result).toContain('Known constraints: no para support, 30+ students.');
  });

  it('renders teaching priorities only without default message', () => {
    const result = renderTeachingContext({
      teachingPriorities: 'building confidence',
    });
    expect(result).not.toContain('No additional teaching context has been provided.');
  });

  it('renders known constraints only without default message', () => {
    const result = renderTeachingContext({
      knownConstraints: 'shared classroom',
    });
    expect(result).not.toContain('No additional teaching context has been provided.');
  });

  it('renders full context including teaching priorities and known constraints', () => {
    const result = renderTeachingContext({
      gradeRange: '6-8',
      subjectAreas: ['ELA'],
      typicalBlockMinutes: 45,
      studentsHaveDevices: true,
      state: 'TX',
      additionalContext: 'Co-teach with SPED teacher.',
      teachingPriorities: 'student independence',
      knownConstraints: 'no aide available',
    });
    expect(result).toContain('6-8');
    expect(result).toContain('ELA');
    expect(result).toContain('45-minute blocks');
    expect(result).toContain('Students have devices available.');
    expect(result).toContain('Co-teach with SPED teacher.');
    expect(result).toContain('Teaching priorities: student independence.');
    expect(result).toContain('Known constraints: no aide available.');
  });
});
