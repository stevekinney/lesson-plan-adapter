import { describe, it, expect, beforeAll } from 'bun:test';
import { readAllReferences } from './read-reference';
import { ADAPT_LESSON_REFERENCES, ONBOARDING_REFERENCES } from './reference-lists';

describe('ADAPT_LESSON_REFERENCES', () => {
  let result: string;

  beforeAll(async () => {
    result = await readAllReferences(ADAPT_LESSON_REFERENCES);
  });

  it('loads all reference files and joins with separators', () => {
    expect(result).toContain('\n\n---\n\n');
  });

  it('includes adaptation guidelines content', () => {
    expect(result).toContain('Adaptation Guidelines');
  });

  it('includes artifact patterns content', () => {
    expect(result).toContain('Adaptation Artifact Specification');
  });

  it('includes clipboard fallback content', () => {
    expect(result).toContain('Clipboard Fallback');
  });

  it('includes UDL framework content', () => {
    expect(result).toContain('Universal Design for Learning');
  });

  it('includes strategy reference content', () => {
    expect(result).toContain('Differentiation Strategy Library');
  });

  it('includes effort level content', () => {
    expect(result).toContain('Effort Level');
  });

  it('includes teaching context guide content', () => {
    expect(result).toContain('Teaching Context');
  });
});

describe('ONBOARDING_REFERENCES', () => {
  let result: string;

  beforeAll(async () => {
    result = await readAllReferences(ONBOARDING_REFERENCES);
  });

  it('loads all reference files and joins with separators', () => {
    expect(result).toContain('\n\n---\n\n');
  });

  it('includes taxonomy reference content', () => {
    expect(result).toContain('Taxonomy');
  });

  it('includes onboarding artifact specification content', () => {
    expect(result).toContain('Onboarding Artifact Specification');
  });

  it('includes clipboard fallback content', () => {
    expect(result).toContain('Clipboard Fallback');
  });

  it('does not include adaptation-specific localStorage guidance', () => {
    expect(result).not.toContain('window.localStorage');
  });
});
