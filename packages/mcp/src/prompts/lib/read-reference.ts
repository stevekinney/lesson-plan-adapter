import adaptationGuidelines from '../references/adaptation-guidelines.md';
import artifactPatterns from '../references/artifact-patterns.md';
import clipboardFallback from '../references/clipboard-fallback.md';
import effortLevels from '../references/effort-levels.md';
import materialSpecifications from '../references/material-specifications.md';
import onboardingArtifactSpecification from '../references/onboarding-artifact-specification.md';
import strategyReference from '../references/strategy-reference.md';
import taxonomyReference from '../references/taxonomy-reference.md';
import teachingContextGuide from '../references/teaching-context-guide.md';
import udlFramework from '../references/udl-framework.md';

const references: Record<string, string> = {
  'adaptation-guidelines.md': adaptationGuidelines,
  'artifact-patterns.md': artifactPatterns,
  'clipboard-fallback.md': clipboardFallback,
  'effort-levels.md': effortLevels,
  'material-specifications.md': materialSpecifications,
  'onboarding-artifact-specification.md': onboardingArtifactSpecification,
  'strategy-reference.md': strategyReference,
  'taxonomy-reference.md': taxonomyReference,
  'teaching-context-guide.md': teachingContextGuide,
  'udl-framework.md': udlFramework,
};

export async function readReference(filename: string): Promise<string> {
  const content = references[filename];
  if (content === undefined) {
    throw new Error(`Unknown reference: ${filename}`);
  }
  return content;
}

export async function readAllReferences(filenames: string[]): Promise<string> {
  const contents = await Promise.all(filenames.map(readReference));
  return contents.join('\n\n---\n\n');
}
