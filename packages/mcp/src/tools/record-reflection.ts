import { z } from 'zod';
import { logger } from '../logger.js';

export const recordReflectionTool = {
  name: 'record_reflection' as const,
  description:
    "Records a teacher's reflection after teaching a lesson with adaptations. Captures what worked, what didn't, and overall helpfulness. This data improves future adaptation suggestions.",
  inputSchema: z.object({
    adapted_lesson_id: z
      .string()
      .uuid()
      .describe('The ID of the adapted lesson being reflected on.'),
    what_worked: z
      .array(z.string())
      .describe('Specific adaptations or strategies that worked well.'),
    what_did_not_work: z
      .array(z.string())
      .describe('Specific adaptations or strategies that did not work as expected.'),
    surprises: z
      .string()
      .optional()
      .describe('Anything unexpected that happened during the lesson.'),
    would_change_next: z
      .string()
      .optional()
      .describe('What the teacher would do differently next time.'),
    overall_rating: z
      .enum(['very-helpful', 'somewhat-helpful', 'not-helpful'])
      .describe('Overall rating of how helpful the adaptation suggestions were.'),
  }),
  handler: async (
    input: {
      adapted_lesson_id: string;
      what_worked: string[];
      what_did_not_work: string[];
      surprises?: string;
      would_change_next?: string;
      overall_rating: 'very-helpful' | 'somewhat-helpful' | 'not-helpful';
    },
    context: { userId: string },
  ) => {
    const requestLogger = logger.child({
      tool: 'record_reflection',
      userId: context.userId,
    });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq, and } = await import('drizzle-orm');

      const [lesson] = await database
        .select({ id: schema.adaptedLessons.id })
        .from(schema.adaptedLessons)
        .where(
          and(
            eq(schema.adaptedLessons.id, input.adapted_lesson_id),
            eq(schema.adaptedLessons.userId, context.userId),
          ),
        )
        .limit(1);

      if (!lesson) {
        const durationMs = Date.now() - start;
        requestLogger.info(
          { durationMs, adaptedLessonId: input.adapted_lesson_id },
          'Lesson not found',
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Adapted lesson not found or does not belong to this teacher.',
              }),
            },
          ],
          isError: true,
        };
      }

      const reflectionData = {
        whatWorked: input.what_worked,
        whatDidNotWork: input.what_did_not_work,
        surprises: input.surprises,
        wouldChangeNext: input.would_change_next,
        overallRating: input.overall_rating,
      };

      await database
        .insert(schema.adaptationReflections)
        .values({
          userId: context.userId,
          adaptedLessonId: input.adapted_lesson_id,
          reflectionData,
        })
        .onConflictDoUpdate({
          target: [
            schema.adaptationReflections.userId,
            schema.adaptationReflections.adaptedLessonId,
          ],
          set: { reflectionData },
        });

      const durationMs = Date.now() - start;
      requestLogger.info(
        { durationMs, adaptedLessonId: input.adapted_lesson_id, rating: input.overall_rating },
        'Tool completed',
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message:
                "Reflection saved. This feedback will help improve future adaptation suggestions for this teacher's classroom.",
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to save reflection.' }],
        isError: true,
      };
    }
  },
};
