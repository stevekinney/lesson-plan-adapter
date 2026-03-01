import { z } from 'zod';
import { logger } from '../logger.js';

const adaptationSummarySchema = z.object({
  lessonTitle: z.string(),
  lessonSummary: z.string(),
  activityCount: z.number(),
  adaptationCount: z.number(),
  quickWinCount: z.number(),
  depthMode: z.enum(['quick-scan', 'standard', 'deep-dive']),
  topStrategies: z.array(z.string()),
  needsAddressed: z.array(z.string()),
});

export const saveLessonAdaptationTool = {
  name: 'save_lesson_adaptation' as const,
  description:
    "Saves a lesson adaptation to the teacher's history so they can revisit it later and so future adaptations can reference past patterns. Call this automatically after generating adaptations.",
  inputSchema: z.object({
    adaptation_summary: adaptationSummarySchema.describe(
      'Summary of the adaptation including counts, strategies, and needs addressed. The lessonTitle field inside this object is used as the lesson title.',
    ),
  }),
  handler: async (
    input: {
      adaptation_summary: z.infer<typeof adaptationSummarySchema>;
    },
    context: { userId: string },
  ) => {
    const requestLogger = logger.child({
      tool: 'save_lesson_adaptation',
      userId: context.userId,
    });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');

      const [inserted] = await database
        .insert(schema.adaptedLessons)
        .values({
          userId: context.userId,
          lessonTitle: input.adaptation_summary.lessonTitle,
          adaptationSummary: input.adaptation_summary,
        })
        .returning({ id: schema.adaptedLessons.id });

      const durationMs = Date.now() - start;
      requestLogger.info(
        {
          durationMs,
          lessonTitle: input.adaptation_summary.lessonTitle,
          adaptedLessonId: inserted.id,
        },
        'Tool completed',
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              adaptedLessonId: inserted.id,
              lessonTitle: input.adaptation_summary.lessonTitle,
              message: 'Adaptation saved. The teacher can revisit this later.',
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to save lesson adaptation.' }],
        isError: true,
      };
    }
  },
};
