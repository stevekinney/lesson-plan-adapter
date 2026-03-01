import { z } from 'zod';
import { logger } from '../logger.js';

const readingLevelSchema = z.enum(['grade-2', 'grade-4', 'grade-6', 'grade-8']);

export const simplifyTextTool = {
  name: 'simplify_text' as const,
  description:
    "Prepares context for simplifying a passage to a target reading level while preserving key concepts. Returns the teacher's profile context (including bilingual support needs) so you can generate the simplified version.",
  inputSchema: z.object({
    original_text: z.string().describe('The passage to simplify.'),
    target_reading_level: readingLevelSchema.describe(
      'The approximate reading level to target (grade-2, grade-4, grade-6, grade-8).',
    ),
    preserve_vocabulary: z
      .array(z.string())
      .optional()
      .describe('Key terms that must remain in the simplified version, even if complex.'),
  }),
  handler: async (
    input: {
      original_text: string;
      target_reading_level: z.infer<typeof readingLevelSchema>;
      preserve_vocabulary?: string[];
    },
    context: { userId: string },
  ) => {
    const requestLogger = logger.child({ tool: 'simplify_text', userId: context.userId });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq } = await import('drizzle-orm');

      const [profile] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      const hasBilingualSupport =
        profile?.needs.some((need) => need.tag === 'bilingual-support') ?? false;

      const gradeRange = profile?.teachingContext?.gradeRange ?? 'not specified';

      const durationMs = Date.now() - start;
      requestLogger.info(
        { durationMs, targetLevel: input.target_reading_level, hasBilingualSupport },
        'Tool completed',
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              originalText: input.original_text,
              targetReadingLevel: input.target_reading_level,
              preserveVocabulary: input.preserve_vocabulary ?? [],
              hasBilingualSupport,
              gradeRange,
              instructions: [
                `Rewrite the passage below at a ${input.target_reading_level} reading level.`,
                'Preserve the key concepts and learning objectives.',
                input.preserve_vocabulary && input.preserve_vocabulary.length > 0
                  ? `Keep these terms exactly as-is: ${input.preserve_vocabulary.join(', ')}.`
                  : null,
                hasBilingualSupport
                  ? 'This classroom has bilingual support needs. Consider adding brief parenthetical translations or cognate hints for key terms where helpful.'
                  : null,
                'Return only the simplified version plus a brief summary of what was changed. Do not reproduce the original text, as it may contain student names or other personally identifiable information.',
              ]
                .filter(Boolean)
                .join(' '),
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [
          { type: 'text' as const, text: 'Failed to prepare text simplification context.' },
        ],
        isError: true,
      };
    }
  },
};
