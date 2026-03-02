import { z } from 'zod';
import { logger } from '../logger.js';
import { generateNeedsSummary } from '../lib/taxonomy.js';
import { interpolate } from './lib/interpolate.js';
import { readAllReferences } from './lib/read-reference.js';
import { readTemplate } from './lib/read-template.js';
import {
  ADAPT_LESSON_REFERENCES,
  ADAPT_LESSON_QUICK_SCAN_REFERENCES,
  ADAPT_LESSON_DEEP_DIVE_REFERENCES,
  ONBOARDING_REFERENCES,
} from './lib/reference-lists.js';
import { renderTeachingContext } from './lib/render-teaching-context.js';
import adaptLessonOnboardingPreamble from './preambles/adapt-lesson-onboarding.md';

const depthModeSchema = z
  .enum(['quick-scan', 'standard', 'deep-dive'])
  .default('standard')
  .describe(
    'How deep the analysis should go. quick-scan returns 3 quick wins without an artifact. standard is the full 7-phase analysis. deep-dive walks through every activity individually.',
  );

type DepthMode = z.infer<typeof depthModeSchema>;

const templateForDepthMode: Record<DepthMode, string> = {
  'quick-scan': 'adapt-lesson-quick-scan.md',
  standard: 'adapt-lesson.md',
  'deep-dive': 'adapt-lesson-deep-dive.md',
};

const referencesForDepthMode: Record<DepthMode, string[]> = {
  'quick-scan': ADAPT_LESSON_QUICK_SCAN_REFERENCES,
  standard: ADAPT_LESSON_REFERENCES,
  'deep-dive': ADAPT_LESSON_DEEP_DIVE_REFERENCES,
};

export const adaptLessonPrompt = {
  name: 'adapt_lesson' as const,
  description: 'Adapt a lesson plan to your classroom learning needs using the UDL framework.',
  arguments: {
    lesson_plan: z.string().describe('The full text of the lesson plan to adapt.'),
    depth_mode: depthModeSchema,
  },
  handler: async (
    arguments_: { lesson_plan: string; depth_mode?: DepthMode },
    context: { userId: string },
  ) => {
    const requestLogger = logger.child({ prompt: 'adapt_lesson', userId: context.userId });
    const depthMode: DepthMode = arguments_.depth_mode ?? 'standard';

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { and, eq, inArray, desc } = await import('drizzle-orm');

      const [profile] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      if (!profile) {
        requestLogger.info('No profile found, directing to onboarding');

        const [onboardingTemplate, onboardingReferences] = await Promise.all([
          readTemplate('onboarding.md'),
          readAllReferences(ONBOARDING_REFERENCES),
        ]);
        const rendered = interpolate(onboardingTemplate, {
          existingNeeds: '',
          existingContext: '',
        });

        const preamble = adaptLessonOnboardingPreamble + '\n\n';

        const fullPrompt = preamble + rendered + '\n\n---\n\n' + onboardingReferences;

        return {
          messages: [
            {
              role: 'user' as const,
              content: { type: 'text' as const, text: fullPrompt },
            },
          ],
        };
      }

      const templateFilename = templateForDepthMode[depthMode];
      const referenceList = referencesForDepthMode[depthMode];

      const [adaptLessonTemplate, references, recentAdaptations] = await Promise.all([
        readTemplate(templateFilename),
        readAllReferences(referenceList),
        database
          .select({
            adaptationSummary: schema.adaptedLessons.adaptationSummary,
            createdAt: schema.adaptedLessons.createdAt,
            id: schema.adaptedLessons.id,
          })
          .from(schema.adaptedLessons)
          .where(eq(schema.adaptedLessons.userId, context.userId))
          .orderBy(desc(schema.adaptedLessons.createdAt))
          .limit(3),
      ]);

      let adaptationHistory = '';

      if (recentAdaptations.length > 0) {
        const recentIds = recentAdaptations.map((a) => a.id);
        const reflections = await database
          .select({
            adaptedLessonId: schema.adaptationReflections.adaptedLessonId,
            reflectionData: schema.adaptationReflections.reflectionData,
          })
          .from(schema.adaptationReflections)
          .where(
            and(
              eq(schema.adaptationReflections.userId, context.userId),
              inArray(schema.adaptationReflections.adaptedLessonId, recentIds),
            ),
          );

        const reflectionsByLesson = new Map(
          reflections.map((reflection) => [reflection.adaptedLessonId, reflection.reflectionData]),
        );

        const historyLines = ['## Patterns from Previous Adaptations', ''];
        historyLines.push(
          `The teacher has adapted ${recentAdaptations.length} recent lesson(s). Their most recent adaptations:`,
        );
        historyLines.push('');

        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];

        for (const adaptation of recentAdaptations) {
          const summary = adaptation.adaptationSummary;
          const date = `${monthNames[adaptation.createdAt.getMonth()]} ${adaptation.createdAt.getDate()}`;
          historyLines.push(
            `- **${summary.lessonTitle}** (${date}): ${summary.adaptationCount} adaptations, ${summary.quickWinCount} quick wins. Needs addressed: ${summary.needsAddressed.join(', ')}`,
          );

          const reflection = reflectionsByLesson.get(adaptation.id);
          if (reflection) {
            if (reflection.whatWorked.length > 0) {
              historyLines.push(`  - What worked: ${reflection.whatWorked.join('; ')}`);
            }
            if (reflection.whatDidNotWork.length > 0) {
              historyLines.push(`  - What did not work: ${reflection.whatDidNotWork.join('; ')}`);
            }
          }
        }

        if (recentAdaptations.length >= 2) {
          const needsFrequency = new Map<string, number>();
          const strategiesWorked: string[] = [];
          const strategiesDidNotWork: string[] = [];

          for (const adaptation of recentAdaptations) {
            for (const need of adaptation.adaptationSummary.needsAddressed) {
              needsFrequency.set(need, (needsFrequency.get(need) || 0) + 1);
            }

            const reflection = reflectionsByLesson.get(adaptation.id);
            if (reflection) {
              strategiesWorked.push(...reflection.whatWorked);
              strategiesDidNotWork.push(...reflection.whatDidNotWork);
            }
          }

          const recurringNeeds = [...needsFrequency.entries()]
            .filter(([, count]) => count >= 2)
            .map(([need]) => need);

          historyLines.push('');
          historyLines.push('### Recurring Patterns');

          if (recurringNeeds.length > 0) {
            historyLines.push(
              `- **Recurring needs across lessons**: ${recurringNeeds.join(', ')}. These are consistently present — prioritize adaptations targeting them.`,
            );
          }

          if (strategiesWorked.length > 0) {
            historyLines.push(
              `- **Strategies that have worked**: ${strategiesWorked.join('; ')}. Favor similar approaches.`,
            );
          }

          if (strategiesDidNotWork.length > 0) {
            historyLines.push(
              `- **Strategies that have not worked**: ${strategiesDidNotWork.join('; ')}. Avoid similar approaches or explain why this time is different.`,
            );
          }
        }

        historyLines.push('');
        historyLines.push(
          'Use this context to vary your suggestions, favor strategies similar to what has worked before, and flag strategies similar to what has not worked.',
        );

        adaptationHistory = historyLines.join('\n');
      }

      const needsSummary = generateNeedsSummary(profile.needs);
      const teachingContext = renderTeachingContext(profile.teachingContext);
      const rendered = interpolate(adaptLessonTemplate, {
        needsSummary,
        teachingContext,
        lesson_plan: arguments_.lesson_plan,
        adaptationHistory,
      });

      const fullPrompt = rendered + '\n\n---\n\n' + references;

      requestLogger.info({ depthMode }, 'Prompt rendered');

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
              text: 'An error occurred while generating the lesson adaptation prompt.',
            },
          },
        ],
      };
    }
  },
};
