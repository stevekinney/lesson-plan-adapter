import type { LearningNeed, TeachingContext } from '@lesson-adapter/database/schema';

export type { LearningNeed, TeachingContext };

export type UdlCategory = 'representation' | 'expression' | 'engagement';

export const TAXONOMY = [
  // Representation — How students best receive information
  {
    tag: 'visual-supports',
    label: 'Needs visual supports (diagrams, charts, images)',
    summaryLabel: 'visual supports',
    category: 'representation',
  },
  {
    tag: 'audio-preferred',
    label: 'Learns best through listening',
    summaryLabel: 'audio-based learning',
    category: 'representation',
  },
  {
    tag: 'text-read-aloud',
    label: 'Needs text read aloud',
    summaryLabel: 'text read aloud',
    category: 'representation',
  },
  {
    tag: 'simplified-text',
    label: 'Needs simplified or chunked text',
    summaryLabel: 'simplified text',
    category: 'representation',
  },
  {
    tag: 'graphic-organizers',
    label: 'Benefits from graphic organizers',
    summaryLabel: 'graphic organizers',
    category: 'representation',
  },
  {
    tag: 'bilingual-support',
    label: 'Needs bilingual or native language support',
    summaryLabel: 'bilingual support',
    category: 'representation',
  },
  {
    tag: 'concrete-manipulatives',
    label: 'Needs concrete/hands-on materials',
    summaryLabel: 'concrete manipulatives',
    category: 'representation',
  },
  {
    tag: 'color-coding',
    label: 'Benefits from color-coded materials',
    summaryLabel: 'color-coded materials',
    category: 'representation',
  },
  {
    tag: 'closed-captions',
    label: 'Needs captions on video/audio content',
    summaryLabel: 'closed captions',
    category: 'representation',
  },
  {
    tag: 'large-print',
    label: 'Needs large print or high-contrast materials',
    summaryLabel: 'large print materials',
    category: 'representation',
  },

  // Expression — How students best show what they know
  {
    tag: 'extended-time',
    label: 'Needs extended time on tasks and assessments',
    summaryLabel: 'extended time',
    category: 'expression',
  },
  {
    tag: 'reduced-written-output',
    label: 'Needs reduced written output',
    summaryLabel: 'reduced written output',
    category: 'expression',
  },
  {
    tag: 'verbal-response',
    label: 'Can demonstrate learning verbally',
    summaryLabel: 'verbal response options',
    category: 'expression',
  },
  {
    tag: 'assistive-tech',
    label: 'Uses assistive technology (speech-to-text, etc.)',
    summaryLabel: 'assistive technology',
    category: 'expression',
  },
  {
    tag: 'alternative-assessment',
    label: 'Needs alternative assessment formats',
    summaryLabel: 'alternative assessments',
    category: 'expression',
  },
  {
    tag: 'scribe-needed',
    label: 'Needs a scribe or dictation support',
    summaryLabel: 'scribe or dictation support',
    category: 'expression',
  },
  {
    tag: 'chunked-assignments',
    label: 'Needs assignments broken into smaller parts',
    summaryLabel: 'chunked assignments',
    category: 'expression',
  },
  {
    tag: 'word-bank',
    label: 'Benefits from word banks or sentence starters',
    summaryLabel: 'word banks',
    category: 'expression',
  },
  {
    tag: 'model-examples',
    label: 'Needs model/example responses before starting',
    summaryLabel: 'model examples',
    category: 'expression',
  },
  {
    tag: 'multiple-attempts',
    label: 'Benefits from multiple attempts or retakes',
    summaryLabel: 'multiple attempts',
    category: 'expression',
  },

  // Engagement — What supports participation and focus
  {
    tag: 'frequent-breaks',
    label: 'Needs frequent breaks',
    summaryLabel: 'frequent breaks',
    category: 'engagement',
  },
  {
    tag: 'movement-needs',
    label: 'Needs movement opportunities',
    summaryLabel: 'movement opportunities',
    category: 'engagement',
  },
  {
    tag: 'preferential-seating',
    label: 'Benefits from preferential seating',
    summaryLabel: 'preferential seating',
    category: 'engagement',
  },
  {
    tag: 'small-group',
    label: 'Works best in small group settings',
    summaryLabel: 'small group settings',
    category: 'engagement',
  },
  {
    tag: 'behavior-plan',
    label: 'Has a behavior intervention plan',
    summaryLabel: 'a behavior intervention plan',
    category: 'engagement',
  },
  {
    tag: 'choice-based',
    label: 'Motivated by choice and autonomy',
    summaryLabel: 'choice and autonomy',
    category: 'engagement',
  },
  {
    tag: 'sensory-regulation',
    label: 'Has sensory regulation needs',
    summaryLabel: 'sensory regulation support',
    category: 'engagement',
  },
  {
    tag: 'structured-transitions',
    label: 'Needs structured transitions between activities',
    summaryLabel: 'structured transitions',
    category: 'engagement',
  },
  {
    tag: 'positive-reinforcement',
    label: 'Responds well to specific positive reinforcement',
    summaryLabel: 'positive reinforcement',
    category: 'engagement',
  },
  {
    tag: 'reduced-distractions',
    label: 'Needs a reduced-distraction environment',
    summaryLabel: 'a reduced-distraction environment',
    category: 'engagement',
  },
  {
    tag: 'check-ins',
    label: 'Benefits from frequent teacher check-ins',
    summaryLabel: 'frequent check-ins',
    category: 'engagement',
  },
  {
    tag: 'timer-visual',
    label: 'Uses visual timers for task pacing',
    summaryLabel: 'visual timers',
    category: 'engagement',
  },
] as const;

type TagId = (typeof TAXONOMY)[number]['tag'];
type TaxonomyTag = (typeof TAXONOMY)[number];

const taxonomyByTag = new Map<string, TaxonomyTag>(TAXONOMY.map((entry) => [entry.tag, entry]));
const tagSet = new Set<string>(taxonomyByTag.keys());

export function isValidTag(tag: string): tag is TagId {
  return tagSet.has(tag);
}

export function getTagCategory(tag: string): UdlCategory | undefined {
  return taxonomyByTag.get(tag)?.category;
}

const categoryPhrasing: Record<UdlCategory, string> = {
  representation: 'for receiving information',
  expression: 'for demonstrating learning',
  engagement: 'for engagement',
};

function formatList(items: string[]): string {
  if (items.length <= 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

export function generateNeedsSummary(needs: LearningNeed[]): string {
  if (needs.length === 0) return '';

  const grouped: Record<UdlCategory, string[]> = {
    representation: [],
    expression: [],
    engagement: [],
  };

  for (const need of needs) {
    const entry = taxonomyByTag.get(need.tag);
    if (entry && need.category in grouped) {
      grouped[need.category].push(entry.summaryLabel);
    }
  }

  const parts: string[] = [];

  for (const category of ['representation', 'expression', 'engagement'] as const) {
    const labels = grouped[category];
    if (labels.length > 0) {
      parts.push(`${formatList(labels)} ${categoryPhrasing[category]}`);
    }
  }

  if (parts.length === 0) return '';

  if (parts.length === 1) return `Your classroom includes learners who need ${parts[0]}.`;

  const allButLast = parts.slice(0, -1).join('; ');
  return `Your classroom includes learners who need ${allButLast}; and ${parts[parts.length - 1]}.`;
}
