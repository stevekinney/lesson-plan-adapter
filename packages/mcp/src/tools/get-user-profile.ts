import { z } from 'zod';
import { logger } from '../logger.js';
import { generateNeedsSummary } from '../lib/taxonomy.js';
import type { UdlCategory } from '../lib/taxonomy.js';

export const getUserProfileTool = {
  name: 'get_user_profile' as const,
  description:
    "Returns the authenticated user's profile including their classroom learning needs and teaching context. Check this first to see if the teacher has a profile set up.",
  inputSchema: z.object({}),
  handler: async (_input: Record<string, never>, context: { userId: string }) => {
    const requestLogger = logger.child({ tool: 'get_user_profile', userId: context.userId });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq } = await import('drizzle-orm');

      const [user] = await database
        .select()
        .from(schema.neonAuthUsers)
        .where(eq(schema.neonAuthUsers.id, context.userId))
        .limit(1);

      if (!user) {
        const durationMs = Date.now() - start;
        requestLogger.info({ durationMs }, 'User not found');
        return {
          content: [{ type: 'text' as const, text: 'User not found.' }],
          isError: true,
        };
      }

      const [profile] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      const hasLearningProfile = Boolean(profile && profile.needs.length > 0);

      const durationMs = Date.now() - start;
      requestLogger.info({ durationMs, hasLearningProfile }, 'Tool completed');

      if (!hasLearningProfile) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                hasLearningProfile: false,
                message:
                  'This teacher has not set up their classroom learning needs yet. Invoke the "setup_classroom_profile" prompt to help them get started.',
              }),
            },
          ],
        };
      }

      const grouped: Record<UdlCategory, string[]> = {
        representation: [],
        expression: [],
        engagement: [],
      };

      for (const need of profile.needs) {
        if (need.category in grouped) {
          grouped[need.category as UdlCategory].push(need.tag);
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              id: user.id,
              name: user.name,
              email: user.email,
              hasLearningProfile: true,
              learningNeeds: grouped,
              teachingContext: profile.teachingContext,
              needsSummary: generateNeedsSummary(profile.needs),
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to retrieve user profile.' }],
        isError: true,
      };
    }
  },
};
