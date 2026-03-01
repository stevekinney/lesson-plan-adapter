import { z } from 'zod';
import { logger } from '../logger.js';
import { TAXONOMY } from '../lib/taxonomy.js';
import type { UdlCategory } from '../lib/taxonomy.js';

export const getAvailableTagsTool = {
  name: 'get_available_tags' as const,
  description:
    'Returns the full taxonomy of available learning needs tags, organized by UDL category. Use this to show the teacher what options are available when setting up or modifying their profile.',
  inputSchema: z.object({}),
  handler: async () => {
    const requestLogger = logger.child({ tool: 'get_available_tags' });

    try {
      const grouped: Record<UdlCategory, Array<{ tag: string; label: string }>> = {
        representation: [],
        expression: [],
        engagement: [],
      };

      for (const entry of TAXONOMY) {
        grouped[entry.category].push({ tag: entry.tag, label: entry.label });
      }

      requestLogger.info('Tool completed');

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(grouped),
          },
        ],
      };
    } catch (error) {
      requestLogger.error({ err: error }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to retrieve available tags.' }],
        isError: true,
      };
    }
  },
};
