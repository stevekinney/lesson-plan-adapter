import { describe, it, expect } from 'bun:test';
import { learningProfileResource } from './learning-profile';

describe('learningProfileResource', () => {
  it('has the expected name', () => {
    expect(learningProfileResource.name).toBe('learning_profile');
  });

  it('has the expected uri', () => {
    expect(learningProfileResource.uri).toBe('learning-profile://current');
  });

  it('has a description', () => {
    expect(learningProfileResource.description).toBeTruthy();
  });

  it('has the expected mimeType', () => {
    expect(learningProfileResource.mimeType).toBe('application/json');
  });

  it('has a handler function', () => {
    expect(typeof learningProfileResource.handler).toBe('function');
  });
});
