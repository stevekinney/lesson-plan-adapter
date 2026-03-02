/**
 * AI Fluency Framework content assertions.
 *
 * These tests verify that the prompt templates and reference documents
 * contain the keywords and structural elements required by the Framework
 * for AI Fluency (Dakan & Feller). Each test maps to a specific competency:
 *
 * - Discernment: considered alternatives, assumptions, evidence basis
 * - Delegation: task-framing instructions in system prompt
 * - Description: teaching priorities, known constraints in onboarding
 * - Diligence: reflection fields, pattern aggregation, dismissal interaction
 */

import { describe, it, expect } from 'bun:test';
import { readTemplate } from './lib/read-template';
import { readReference } from './lib/read-reference';

describe('Discernment — adaptation template requires transparency fields', () => {
  it('requires a considered alternative in each adaptation', async () => {
    const template = await readTemplate('adapt-lesson.md');
    expect(template).toContain('considered alternative');
  });

  it('requires a key assumption in each adaptation', async () => {
    const template = await readTemplate('adapt-lesson.md');
    expect(template).toContain('key assumption');
  });

  it('requires an evidence basis classification in each adaptation', async () => {
    const template = await readTemplate('adapt-lesson.md');
    expect(template).toContain('evidence basis');
  });

  it('specifies the three evidence basis levels', async () => {
    const template = await readTemplate('adapt-lesson.md');
    expect(template).toContain('research-supported');
    expect(template).toContain('practitioner-established');
    expect(template).toContain('context-dependent');
  });
});

describe('Discernment — deep-dive activity template requires transparency fields', () => {
  it('requires a key assumption in each deep-dive adaptation', async () => {
    const template = await readTemplate('deep-dive-activity.md');
    expect(template).toContain('Key assumption');
  });

  it('requires an evidence basis in each deep-dive adaptation', async () => {
    const template = await readTemplate('deep-dive-activity.md');
    expect(template).toContain('Evidence basis');
  });

  it('includes implementation guidance with what could go wrong', async () => {
    const template = await readTemplate('deep-dive-activity.md');
    expect(template).toContain('What could go wrong');
  });

  it('includes implementation guidance with what to watch for', async () => {
    const template = await readTemplate('deep-dive-activity.md');
    expect(template).toContain('What to watch for');
  });

  it('includes implementation guidance with quick adjustment', async () => {
    const template = await readTemplate('deep-dive-activity.md');
    expect(template).toContain('Quick adjustment');
  });
});

describe('Discernment — strategy reference includes evidence classification', () => {
  it('defines the evidence classification system', async () => {
    const reference = await readReference('strategy-reference.md');
    expect(reference).toContain('Evidence Classification');
  });

  it('defines research-supported evidence level', async () => {
    const reference = await readReference('strategy-reference.md');
    expect(reference).toContain('Research-supported');
  });

  it('defines practitioner-established evidence level', async () => {
    const reference = await readReference('strategy-reference.md');
    expect(reference).toContain('Practitioner-established');
  });

  it('defines context-dependent evidence level', async () => {
    const reference = await readReference('strategy-reference.md');
    expect(reference).toContain('Context-dependent');
  });
});

describe('Discernment — artifact specification includes transparency UI', () => {
  it('includes evidence basis badge in adaptation cards', async () => {
    const reference = await readReference('artifact-patterns.md');
    expect(reference).toContain('evidenceBasis');
  });

  it('includes considered alternative in the data structure', async () => {
    const reference = await readReference('artifact-patterns.md');
    expect(reference).toContain('consideredAlternative');
  });

  it('includes assumptions in the data structure', async () => {
    const reference = await readReference('artifact-patterns.md');
    expect(reference).toContain('assumptions');
  });

  it('includes dismissal interaction for teacher rejection tracking', async () => {
    const reference = await readReference('artifact-patterns.md');
    expect(reference).toContain('Not for my class');
    expect(reference).toContain('Dismissed');
  });
});

describe('Description — teaching context guide includes priorities and constraints', () => {
  it('includes teaching priorities guidance', async () => {
    const reference = await readReference('teaching-context-guide.md');
    expect(reference).toContain('Teaching Priorities');
  });

  it('includes known constraints guidance', async () => {
    const reference = await readReference('teaching-context-guide.md');
    expect(reference).toContain('Known Constraints');
  });

  it('instructs to weight suggestions toward stated priorities', async () => {
    const reference = await readReference('teaching-context-guide.md');
    expect(reference).toContain('weight');
  });

  it('instructs to eliminate infeasible suggestions based on constraints', async () => {
    const reference = await readReference('teaching-context-guide.md');
    expect(reference).toContain('infeasible');
  });
});

describe('Description — onboarding artifact includes priority and constraint fields', () => {
  it('includes teaching priorities field in onboarding form', async () => {
    const reference = await readReference('onboarding-artifact-specification.md');
    expect(reference).toContain('Teaching priorities');
  });

  it('includes known constraints field in onboarding form', async () => {
    const reference = await readReference('onboarding-artifact-specification.md');
    expect(reference).toContain('Known constraints');
  });
});

describe('Delegation — system instructions enforce structured interaction', () => {
  let instructions: string;

  // The instructions.md is imported in server.ts as the system prompt
  // We read it directly to test content
  it('loads the instructions file', async () => {
    const { default: content } = await import('../instructions.md');
    instructions = content;
    expect(instructions).toBeTruthy();
  });

  it('requires question-asking before adapting', () => {
    expect(instructions).toContain('MANDATORY: Ask questions before adapting');
  });

  it('requires invoking the adapt_lesson prompt', () => {
    expect(instructions).toContain('MANDATORY: Invoke the adapt_lesson prompt');
  });

  it('prohibits generating adaptations as inline text', () => {
    expect(instructions).toContain(
      'NEVER generate adaptation suggestions as inline conversational text',
    );
  });

  it('requires context confirmation after presenting adaptations', () => {
    expect(instructions).toContain('confirm in one sentence what context shaped the output');
  });

  it('guides teachers to evaluate AI output', () => {
    expect(instructions).toContain('do any of them surprise you or seem off');
  });

  it('asks teachers to evaluate whether needs were addressed', () => {
    expect(instructions).toContain('needs_addressed');
    expect(instructions).toContain('needs_not_addressed');
  });

  it('captures rejected suggestions with reasons', () => {
    expect(instructions).toContain('rejected_suggestions');
  });
});

describe('Diligence — adaptation template references reflection data', () => {
  it('includes an adaptationHistory placeholder for reflection integration', async () => {
    const template = await readTemplate('adapt-lesson.md');
    expect(template).toContain('{adaptationHistory}');
  });
});
