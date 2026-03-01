import { describe, it, expect } from 'bun:test';
import { saveLessonAdaptationTool } from './save-lesson-adaptation';

describe('saveLessonAdaptationTool', () => {
  it('has the expected name', () => {
    expect(saveLessonAdaptationTool.name).toBe('save_lesson_adaptation');
  });

  it('has a description', () => {
    expect(saveLessonAdaptationTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(saveLessonAdaptationTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof saveLessonAdaptationTool.handler).toBe('function');
  });
});
