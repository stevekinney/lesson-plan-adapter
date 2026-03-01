import { describe, it, expect } from 'bun:test';
import { updateTeachingContextTool } from './update-teaching-context';

describe('updateTeachingContextTool', () => {
  it('has the expected name', () => {
    expect(updateTeachingContextTool.name).toBe('update_teaching_context');
  });

  it('has a description', () => {
    expect(updateTeachingContextTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(updateTeachingContextTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof updateTeachingContextTool.handler).toBe('function');
  });
});
