import { describe, it, expect } from 'bun:test';
import { createMaterialTool } from './create-material';

describe('createMaterialTool', () => {
  it('has the expected name', () => {
    expect(createMaterialTool.name).toBe('create_material');
  });

  it('has a description', () => {
    expect(createMaterialTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(createMaterialTool.inputSchema).toBeDefined();
  });

  it('has a handler function', () => {
    expect(typeof createMaterialTool.handler).toBe('function');
  });
});
