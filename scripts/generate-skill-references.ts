/**
 * Generates skill reference files from source-of-truth files in the MCP package.
 *
 * - udl-framework.md: Generated from taxonomy.ts + strategy-reference.md
 * - adaptation-quality.md: Generated from adapt-lesson.md + effort-levels.md
 *
 *
 * Run: bun scripts/generate-skill-references.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TAXONOMY } from '../packages/mcp/src/lib/taxonomy.js';

const ROOT = resolve(import.meta.dirname, '..');
const REFERENCES_SOURCE = resolve(ROOT, 'packages/mcp/src/prompts/references');
const SKILL_DIRECTORY = resolve(ROOT, 'distribution/plugin/skills/lesson-plan-adapter');
const REFERENCES_DIRECTORY = resolve(SKILL_DIRECTORY, 'references');

function ensureDirectory(directory: string): void {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function readReferenceFile(filename: string): string {
  return readFileSync(resolve(REFERENCES_SOURCE, filename), 'utf-8').trim();
}

function extractSection(content: string, startMarker: string, endMarker?: string): string {
  const startIndex = content.indexOf(startMarker);

  if (startIndex === -1) {
    throw new Error(`Marker not found in template: "${startMarker}"`);
  }

  const endIndex = endMarker ? content.indexOf(endMarker, startIndex + startMarker.length) : -1;
  const extracted =
    endIndex === -1 ? content.slice(startIndex) : content.slice(startIndex, endIndex);

  return extracted.trim();
}

function generateUdlFramework(): string {
  const strategyReference = readReferenceFile('strategy-reference.md');

  const representationTags = TAXONOMY.filter((tag) => tag.category === 'representation');
  const expressionTags = TAXONOMY.filter((tag) => tag.category === 'expression');
  const engagementTags = TAXONOMY.filter((tag) => tag.category === 'engagement');

  function renderTagTable(
    tags: readonly { tag: string; label: string; summaryLabel: string }[],
  ): string {
    const rows = tags.map((tag) => `| \`${tag.tag}\` | ${tag.label} | ${tag.summaryLabel} |`);
    return [
      '| Tag ID | Label | Summary Label |',
      '|--------|-------|---------------|',
      ...rows,
    ].join('\n');
  }

  return `# UDL Framework Reference

## Universal Design for Learning

Universal Design for Learning (UDL) is a framework for designing flexible learning experiences that accommodate individual learning differences. It is organized around three principles:

- **Representation** (the "what" of learning): Provide multiple means for students to perceive and comprehend information.
- **Expression** (the "how" of learning): Provide multiple means for students to demonstrate what they know.
- **Engagement** (the "why" of learning): Provide multiple means for recruiting and sustaining student interest and effort.

## Teacher Language to Tag Mapping

When teachers describe their classroom needs in natural language, map their descriptions to the appropriate tag IDs:

- "My students struggle with reading" → \`simplified-text\`, \`text-read-aloud\`
- "I have English learners" → \`bilingual-support\`, \`simplified-text\`
- "Some kids can't sit still" → \`movement-needs\`, \`frequent-breaks\`
- "They need things broken down" → \`chunked-assignments\`, \`graphic-organizers\`
- "I have students who won't write" → \`reduced-written-output\`, \`verbal-response\`
- "Behavior is an issue" → \`behavior-plan\`, \`positive-reinforcement\`, \`check-ins\`
- "Transitions are hard" → \`structured-transitions\`, \`timer-visual\`
- "They need to see it to understand it" → \`visual-supports\`, \`graphic-organizers\`, \`color-coding\`

## Tag Taxonomy

### Representation (${representationTags.length} tags)

How students best receive information.

${renderTagTable(representationTags)}

### Expression (${expressionTags.length} tags)

How students best show what they know.

${renderTagTable(expressionTags)}

### Engagement (${engagementTags.length} tags)

What supports participation and focus.

${renderTagTable(engagementTags)}

${strategyReference}
`;
}

function generateAdaptationQuality(): string {
  const adaptationGuidelines = readReferenceFile('adaptation-guidelines.md');
  const effortLevels = readReferenceFile('effort-levels.md');

  const rules = extractSection(adaptationGuidelines, '### Rules', '### Non-Goals');
  const nonGoals = extractSection(adaptationGuidelines, '### Non-Goals', '### What NOT to Suggest');
  const antiPatterns = extractSection(adaptationGuidelines, '### What NOT to Suggest');

  return `# Adaptation Quality Reference

This reference defines the quality standards for lesson plan adaptations. Use it to self-evaluate suggestions before presenting them to the teacher.

## Quality Rules

${rules}

${nonGoals}

${antiPatterns}

${effortLevels}

## Self-Evaluation Checklist

Before finalizing adaptation suggestions, verify:

- [ ] Every suggestion references a specific activity by name
- [ ] Suggestions propose concrete modifications, not abstract categories
- [ ] The full lesson flow is considered, including transitions
- [ ] UDL principles are balanced — not all suggestions target the same principle
- [ ] Similar suggestions across needs are aggregated into single recommendations
- [ ] Time impact is acknowledged when suggestions add prep or class time
- [ ] Language uses "you could..." and "one option is..." framing
- [ ] No new lesson plans are generated — only adaptations of what was provided
- [ ] No core content or learning objectives are removed
- [ ] No IEP compliance language or legal guidance is included
- [ ] No specific students are referenced — all suggestions are classroom-level
- [ ] No specific commercial products are recommended
`;
}

// Main

ensureDirectory(REFERENCES_DIRECTORY);

const udlFramework = generateUdlFramework();
const adaptationQuality = generateAdaptationQuality();

writeFileSync(resolve(REFERENCES_DIRECTORY, 'udl-framework.md'), udlFramework);
writeFileSync(resolve(REFERENCES_DIRECTORY, 'adaptation-quality.md'), adaptationQuality);

console.log('Generated skill reference files.');
