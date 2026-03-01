import { z } from 'zod';
import { logger } from '../logger.js';

export const listMyAdaptationsTool = {
  name: 'list_my_adaptations' as const,
  description:
    "Returns the teacher's recent lesson adaptations, ordered by most recent. Useful for referencing past work, revisiting adaptations, or understanding patterns.",
  inputSchema: z.object({
    limit: z
      .number()
      .positive()
      .max(20)
      .optional()
      .default(10)
      .describe('Maximum number of adaptations to return. Defaults to 10.'),
  }),
  handler: async (input: { limit: number }, context: { userId: string }) => {
    const requestLogger = logger.child({
      tool: 'list_my_adaptations',
      userId: context.userId,
    });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq, desc } = await import('drizzle-orm');

      const adaptations = await database
        .select({
          id: schema.adaptedLessons.id,
          adaptationSummary: schema.adaptedLessons.adaptationSummary,
          createdAt: schema.adaptedLessons.createdAt,
        })
        .from(schema.adaptedLessons)
        .where(eq(schema.adaptedLessons.userId, context.userId))
        .orderBy(desc(schema.adaptedLessons.createdAt))
        .limit(input.limit);

      const durationMs = Date.now() - start;
      requestLogger.info({ durationMs, count: adaptations.length }, 'Tool completed');

      if (adaptations.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                adaptations: [],
                message: 'No adapted lessons found. Paste a lesson plan to get started.',
              }),
            },
          ],
        };
      }

      const results = adaptations.map((adaptation) => ({
        id: adaptation.id,
        lessonTitle: adaptation.adaptationSummary.lessonTitle,
        lessonSummary: adaptation.adaptationSummary.lessonSummary,
        adaptationCount: adaptation.adaptationSummary.adaptationCount,
        quickWinCount: adaptation.adaptationSummary.quickWinCount,
        depthMode: adaptation.adaptationSummary.depthMode,
        needsAddressed: adaptation.adaptationSummary.needsAddressed,
        createdAt: adaptation.createdAt,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              adaptations: results,
              totalCount: results.length,
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to list adaptations.' }],
        isError: true,
      };
    }
  },
};
