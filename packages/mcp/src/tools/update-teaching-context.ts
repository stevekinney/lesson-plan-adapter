import { z } from 'zod';
import { logger } from '../logger.js';
import type { TeachingContext } from '../lib/taxonomy.js';

export const updateTeachingContextTool = {
  name: 'update_teaching_context' as const,
  description:
    "Updates the teacher's teaching context (grade range, subject areas, block length, device availability, state, or additional notes). Only provided fields are updated; others are left unchanged. Call this when a teacher shares information about their teaching environment.",
  inputSchema: z.object({
    gradeRange: z.enum(['K-2', '3-5', '6-8', '9-12']).optional(),
    subjectAreas: z.array(z.string()).optional(),
    typicalBlockMinutes: z.number().positive().optional(),
    studentsHaveDevices: z.boolean().optional(),
    state: z.string().length(2).toUpperCase().optional(),
    additionalContext: z.string().optional(),
    teachingPriorities: z
      .string()
      .optional()
      .describe(
        "The teacher's core teaching priorities or values (e.g., 'student independence', 'equity', 'engagement'). Used to weight adaptation suggestions toward what matters most to this teacher.",
      ),
    knownConstraints: z
      .string()
      .optional()
      .describe(
        "Hard constraints on the teacher's classroom (e.g., 'no para support', '30+ students', 'shared classroom'). Suggestions that violate stated constraints will not be generated.",
      ),
  }),
  handler: async (input: Partial<TeachingContext>, context: { userId: string }) => {
    const requestLogger = logger.child({
      tool: 'update_teaching_context',
      userId: context.userId,
    });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq } = await import('drizzle-orm');

      const [existing] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      const definedFields: Partial<TeachingContext> = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          definedFields[key as keyof TeachingContext] = value as never;
        }
      }

      if (existing) {
        const merged: TeachingContext = { ...existing.teachingContext, ...definedFields };
        await database
          .update(schema.learningProfiles)
          .set({ teachingContext: merged, updatedAt: new Date() })
          .where(eq(schema.learningProfiles.userId, context.userId));

        const durationMs = Date.now() - start;
        requestLogger.info({ durationMs }, 'Tool completed');

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ success: true, teachingContext: merged }),
            },
          ],
        };
      }

      await database.insert(schema.learningProfiles).values({
        userId: context.userId,
        needs: [],
        teachingContext: definedFields,
        updatedAt: new Date(),
      });

      const durationMs = Date.now() - start;
      requestLogger.info({ durationMs }, 'Tool completed (new profile created)');

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, teachingContext: definedFields }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to update teaching context.' }],
        isError: true,
      };
    }
  },
};
