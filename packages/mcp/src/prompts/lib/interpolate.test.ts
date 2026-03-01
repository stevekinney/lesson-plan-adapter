import { describe, it, expect } from 'bun:test';
import { interpolate } from './interpolate';

describe('interpolate', () => {
  it('replaces a single variable', () => {
    expect(interpolate('Hello {name}!', { name: 'World' })).toBe('Hello World!');
  });

  it('replaces multiple variables', () => {
    const result = interpolate('{greeting} {name}!', { greeting: 'Hi', name: 'Teacher' });
    expect(result).toBe('Hi Teacher!');
  });

  it('throws on missing variable naming the variable', () => {
    expect(() => interpolate('Hello {name}!', {})).toThrow('Missing template variable: {name}');
  });

  it('returns template unchanged when no placeholders and empty variables', () => {
    expect(interpolate('No placeholders here.', {})).toBe('No placeholders here.');
  });

  it('handles multi-line templates', () => {
    const template = 'Line 1: {first}\nLine 2: {second}';
    const result = interpolate(template, { first: 'A', second: 'B' });
    expect(result).toBe('Line 1: A\nLine 2: B');
  });
});
