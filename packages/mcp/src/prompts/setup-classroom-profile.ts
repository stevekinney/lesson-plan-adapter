import type { UdlCategory } from '../lib/taxonomy.js';
import { logger } from '../logger.js';
import { interpolate } from './lib/interpolate.js';
import { readAllReferences } from './lib/read-reference.js';
import { readTemplate } from './lib/read-template.js';
import { ONBOARDING_REFERENCES } from './lib/reference-lists.js';

export const setupClassroomProfilePrompt = {
  name: 'setup_classroom_profile' as const,
  description:
    'Set up or update your classroom learning needs profile. Start here if you are new to the Lesson Plan Adapter.',
  arguments: {},
  handler: async (_arguments: Record<string, never>, context: { userId: string }) => {
    const requestLogger = logger.child({
      prompt: 'setup_classroom_profile',
      userId: context.userId,
    });

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq } = await import('drizzle-orm');

      const [profile] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      const hasProfile = profile && profile.needs.length > 0;
      const mode = hasProfile ? 'edit' : 'setup';

      let existingNeeds = '';
      let existingContext = '';

      if (hasProfile) {
        const { TAXONOMY } = await import('../lib/taxonomy.js');

        const grouped: Record<UdlCategory, string[]> = {
          representation: [],
          expression: [],
          engagement: [],
        };

        for (const need of profile.needs) {
          const entry = TAXONOMY.find((t) => t.tag === need.tag);
          if (entry) {
            grouped[need.category as UdlCategory]?.push(entry.tag);
          }
        }

        const lines: string[] = ["The teacher's current learning needs are:"];
        for (const category of ['representation', 'expression', 'engagement'] as const) {
          if (grouped[category].length > 0) {
            lines.push(
              `- ${category[0].toUpperCase() + category.slice(1)}: ${grouped[category].join(', ')}`,
            );
          }
        }
        lines.push('');
        lines.push('Pre-check these tags in the artifact and allow the teacher to modify them.');
        existingNeeds = lines.join('\n');

        if (profile.teachingContext) {
          const contextLines: string[] = [];
          if (profile.teachingContext.gradeRange) {
            contextLines.push(`- Grade Range: ${profile.teachingContext.gradeRange}`);
          }
          if (
            profile.teachingContext.subjectAreas &&
            profile.teachingContext.subjectAreas.length > 0
          ) {
            contextLines.push(`- Subjects: ${profile.teachingContext.subjectAreas.join(', ')}`);
          }
          if (profile.teachingContext.typicalBlockMinutes) {
            contextLines.push(
              `- Block Length: ${profile.teachingContext.typicalBlockMinutes} minutes`,
            );
          }
          if (profile.teachingContext.studentsHaveDevices !== undefined) {
            contextLines.push(
              `- Devices: ${profile.teachingContext.studentsHaveDevices ? 'Yes' : 'No'}`,
            );
          }
          if (profile.teachingContext.state) {
            contextLines.push(`- State: ${profile.teachingContext.state}`);
          }
          if (profile.teachingContext.additionalContext) {
            contextLines.push(`- Additional Context: ${profile.teachingContext.additionalContext}`);
          }

          if (contextLines.length > 0) {
            existingContext = [
              "The teacher's current teaching context is:",
              ...contextLines,
              '',
              'Pre-fill these values in the artifact and allow the teacher to modify them.',
            ].join('\n');
          }
        }
      }

      const [template, references] = await Promise.all([
        readTemplate('onboarding.md'),
        readAllReferences(ONBOARDING_REFERENCES),
      ]);
      const rendered = interpolate(template, { existingNeeds, existingContext });
      const fullPrompt = rendered + '\n\n---\n\n' + references;

      requestLogger.info({ mode }, 'Prompt rendered');

      return {
        messages: [
          {
            role: 'user' as const,
            content: { type: 'text' as const, text: fullPrompt },
          },
        ],
      };
    } catch (error) {
      requestLogger.error({ err: error }, 'Prompt failed');
      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: 'An error occurred while generating the classroom profile setup.',
            },
          },
        ],
      };
    }
  },
};
