import { describe, it, expect } from 'bun:test';
import { getAvailableTagsTool } from './get-available-tags';

describe('getAvailableTagsTool', () => {
  it('has the expected name', () => {
    expect(getAvailableTagsTool.name).toBe('get_available_tags');
  });

  it('has a description', () => {
    expect(getAvailableTagsTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(getAvailableTagsTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof getAvailableTagsTool.handler).toBe('function');
  });
});
