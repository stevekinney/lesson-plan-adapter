import { describe, it, expect } from 'bun:test';
import { simplifyTextTool } from './simplify-text';

describe('simplifyTextTool', () => {
  it('has the expected name', () => {
    expect(simplifyTextTool.name).toBe('simplify_text');
  });

  it('has a description', () => {
    expect(simplifyTextTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(simplifyTextTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof simplifyTextTool.handler).toBe('function');
  });
});
