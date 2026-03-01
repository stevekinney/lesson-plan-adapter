import { z } from 'zod';
import { logger } from '../logger.js';
import { isValidTag, generateNeedsSummary, getTagCategory } from '../lib/taxonomy.js';
import type { LearningNeed } from '../lib/taxonomy.js';

export const setLearningNeedsTool = {
  name: 'set_learning_needs' as const,
  description:
    "Sets the learning needs present in the teacher's classroom. Replaces any existing needs. Each need is a tag ID and UDL category. Call this when a teacher describes the learning needs in their classroom, translating their description into the appropriate tags.",
  inputSchema: z.object({
    needs: z.array(
      z.object({
        tag: z.string(),
        category: z.enum(['representation', 'expression', 'engagement']),
      }),
    ),
  }),
  handler: async (input: { needs: LearningNeed[] }, context: { userId: string }) => {
    const requestLogger = logger.child({ tool: 'set_learning_needs', userId: context.userId });
    const start = Date.now();

    try {
      const invalidTags = input.needs.map((need) => need.tag).filter((tag) => !isValidTag(tag));

      if (invalidTags.length > 0) {
        requestLogger.info({ invalidTags }, 'Invalid tags rejected');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: 'Invalid tags', invalidTags }),
            },
          ],
          isError: true,
        };
      }

      const invalidTagCategoryPairs = input.needs.flatMap((need) => {
        const expectedCategory = getTagCategory(need.tag);
        if (!expectedCategory || expectedCategory === need.category) {
          return [];
        }

        return [
          {
            tag: need.tag,
            providedCategory: need.category,
            expectedCategory,
          },
        ];
      });

      if (invalidTagCategoryPairs.length > 0) {
        requestLogger.info({ invalidTagCategoryPairs }, 'Invalid tag-category pairs rejected');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Invalid tag-category pairs',
                invalidTagCategoryPairs,
              }),
            },
          ],
          isError: true,
        };
      }

      const { database, schema } = await import('@lesson-adapter/database');

      await database
        .insert(schema.learningProfiles)
        .values({
          userId: context.userId,
          needs: input.needs,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.learningProfiles.userId,
          set: {
            needs: input.needs,
            updatedAt: new Date(),
          },
        });

      const summary = generateNeedsSummary(input.needs);
      const durationMs = Date.now() - start;
      requestLogger.info({ durationMs, needsCount: input.needs.length }, 'Tool completed');

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              needsCount: input.needs.length,
              summary,
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to set learning needs.' }],
        isError: true,
      };
    }
  },
};
