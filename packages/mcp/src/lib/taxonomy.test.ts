import { describe, it, expect } from 'bun:test';
import { TAXONOMY, isValidTag, generateNeedsSummary, getTagCategory } from './taxonomy';
import type { LearningNeed } from './taxonomy';

describe('TAXONOMY', () => {
  it('has exactly 32 tags', () => {
    expect(TAXONOMY.length).toBe(32);
  });

  it('has 10 representation tags', () => {
    const count = TAXONOMY.filter((t) => t.category === 'representation').length;
    expect(count).toBe(10);
  });

  it('has 10 expression tags', () => {
    const count = TAXONOMY.filter((t) => t.category === 'expression').length;
    expect(count).toBe(10);
  });

  it('has 12 engagement tags', () => {
    const count = TAXONOMY.filter((t) => t.category === 'engagement').length;
    expect(count).toBe(12);
  });

  it('has all unique tag IDs', () => {
    const tags = TAXONOMY.map((t) => t.tag);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('has no tag IDs with spaces or uppercase', () => {
    for (const entry of TAXONOMY) {
      expect(entry.tag).not.toMatch(/[A-Z\s]/);
    }
  });
});

describe('isValidTag', () => {
  it('returns true for valid tags', () => {
    expect(isValidTag('visual-supports')).toBe(true);
    expect(isValidTag('extended-time')).toBe(true);
    expect(isValidTag('frequent-breaks')).toBe(true);
  });

  it('returns false for invalid tags', () => {
    expect(isValidTag('nonexistent-tag')).toBe(false);
    expect(isValidTag('')).toBe(false);
    expect(isValidTag('VISUAL-SUPPORTS')).toBe(false);
  });
});

describe('getTagCategory', () => {
  it('returns the category for a valid tag', () => {
    expect(getTagCategory('visual-supports')).toBe('representation');
  });

  it('returns undefined for an invalid tag', () => {
    expect(getTagCategory('nonexistent')).toBeUndefined();
  });
});

describe('generateNeedsSummary', () => {
  it('returns empty string for empty array', () => {
    expect(generateNeedsSummary([])).toBe('');
  });

  it('produces correct output for a sample needs array', () => {
    const needs: LearningNeed[] = [
      { tag: 'visual-supports', category: 'representation' },
      { tag: 'simplified-text', category: 'representation' },
      { tag: 'extended-time', category: 'expression' },
      { tag: 'frequent-breaks', category: 'engagement' },
    ];
    const result = generateNeedsSummary(needs);
    expect(result).toContain('Your classroom includes learners who need');
    expect(result).toContain('visual supports and simplified text for receiving information');
    expect(result).toContain('extended time for demonstrating learning');
    expect(result).toContain('frequent breaks for engagement');
  });

  it('uses Oxford comma for three or more items in a category', () => {
    const needs: LearningNeed[] = [
      { tag: 'visual-supports', category: 'representation' },
      { tag: 'simplified-text', category: 'representation' },
      { tag: 'text-read-aloud', category: 'representation' },
    ];
    const result = generateNeedsSummary(needs);
    expect(result).toContain('visual supports, simplified text, and text read aloud');
  });

  it('uses "; and " before the last category', () => {
    const needs: LearningNeed[] = [
      { tag: 'visual-supports', category: 'representation' },
      { tag: 'extended-time', category: 'expression' },
      { tag: 'frequent-breaks', category: 'engagement' },
    ];
    const result = generateNeedsSummary(needs);
    expect(result).toContain(
      'for receiving information; extended time for demonstrating learning; and frequent breaks for engagement.',
    );
  });

  it('does not contain display label prefixes in the summary', () => {
    const needs: LearningNeed[] = [
      { tag: 'visual-supports', category: 'representation' },
      { tag: 'text-read-aloud', category: 'representation' },
      { tag: 'extended-time', category: 'expression' },
      { tag: 'frequent-breaks', category: 'engagement' },
    ];
    const result = generateNeedsSummary(needs);
    // summaryLabels should be used, not display labels
    // Display labels start with "Needs", "Benefits from", "Uses", etc.
    expect(result).not.toMatch(
      /who need (Needs|Benefits from|Uses|Has|Learns|Can|Motivated|Responds|Works)/,
    );
  });

  it('handles needs from a single category', () => {
    const needs: LearningNeed[] = [
      { tag: 'extended-time', category: 'expression' },
      { tag: 'word-bank', category: 'expression' },
    ];
    const result = generateNeedsSummary(needs);
    expect(result).toContain('extended time and word banks for demonstrating learning');
    expect(result).not.toContain('for receiving information');
    expect(result).not.toContain('for engagement');
  });
});
