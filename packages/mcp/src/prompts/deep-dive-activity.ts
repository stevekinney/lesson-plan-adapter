import { z } from 'zod';
import { logger } from '../logger.js';
import { generateNeedsSummary } from '../lib/taxonomy.js';
import { interpolate } from './lib/interpolate.js';
import { readAllReferences } from './lib/read-reference.js';
import { readTemplate } from './lib/read-template.js';
import { renderTeachingContext } from './lib/render-teaching-context.js';

const DEEP_DIVE_ACTIVITY_REFERENCES = [
  'adaptation-guidelines.md',
  'udl-framework.md',
  'strategy-reference.md',
  'effort-levels.md',
  'teaching-context-guide.md',
];

export const deepDiveActivityPrompt = {
  name: 'deep_dive_activity' as const,
  description:
    'Deeply analyze a single activity from a lesson plan, generating detailed adaptations with implementation steps, preparation time estimates, and material suggestions.',
  arguments: {
    activity_name: z.string().describe('The name of the activity to analyze.'),
    activity_text: z.string().describe('The full text of the activity from the lesson plan.'),
    prior_adaptations: z
      .string()
      .optional()
      .describe('Any adaptations already suggested for this activity, to avoid duplication.'),
  },
  handler: async (
    arguments_: {
      activity_name: string;
      activity_text: string;
      prior_adaptations?: string;
    },
    context: { userId: string },
  ) => {
    const requestLogger = logger.child({
      prompt: 'deep_dive_activity',
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

      if (!profile) {
        requestLogger.info('No profile found');
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'The teacher has no classroom profile yet. Ask them to set up their profile first before diving deep into an activity.',
              },
            },
          ],
        };
      }

      const [template, references] = await Promise.all([
        readTemplate('deep-dive-activity.md'),
        readAllReferences(DEEP_DIVE_ACTIVITY_REFERENCES),
      ]);

      const needsSummary = generateNeedsSummary(profile.needs);
      const teachingContext = renderTeachingContext(profile.teachingContext);

      const rendered = interpolate(template, {
        activityName: arguments_.activity_name,
        activityText: arguments_.activity_text,
        priorAdaptations: arguments_.prior_adaptations ?? 'None provided.',
        needsSummary,
        teachingContext,
      });

      const fullPrompt = rendered + '\n\n---\n\n' + references;

      requestLogger.info({ activityName: arguments_.activity_name }, 'Prompt rendered');

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
              text: 'An error occurred while generating the activity deep dive prompt.',
            },
          },
        ],
      };
    }
  },
};
