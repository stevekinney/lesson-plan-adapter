import { logger } from '../logger.js';
import { generateNeedsSummary } from '../lib/taxonomy.js';
import type { UdlCategory } from '../lib/taxonomy.js';

export const learningProfileResource = {
  name: 'learning_profile' as const,
  uri: 'learning-profile://current',
  description: 'Your classroom learning needs and teaching context.',
  mimeType: 'application/json',
  handler: async (uri: URL, context: { userId: string }) => {
    const requestLogger = logger.child({ resource: 'learning_profile', userId: context.userId });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq } = await import('drizzle-orm');

      const [profile] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      const durationMs = Date.now() - start;
      requestLogger.info({ durationMs }, 'Resource read completed');

      if (!profile) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify({
                hasProfile: false,
                message:
                  'No learning needs profile has been set up yet. The teacher can set one up by describing the learning needs in their classroom, or by using the setup tool.',
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
          grouped[need.category].push(need.tag);
        }
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({
              hasProfile: true,
              needs: grouped,
              teachingContext: profile.teachingContext,
              needsSummary: generateNeedsSummary(profile.needs),
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Resource read failed');
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Failed to retrieve learning profile.' }),
          },
        ],
      };
    }
  },
};
