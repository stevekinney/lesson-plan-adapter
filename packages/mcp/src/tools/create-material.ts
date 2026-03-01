import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { logger } from '../logger.js';
import { generateNeedsSummary } from '../lib/taxonomy.js';
import { renderTeachingContext } from '../prompts/lib/render-teaching-context.js';

const materialTypeToHeading: Record<string, string> = {
  'word-bank': 'Word Bank',
  'graphic-organizer': 'Graphic Organizer',
  rubric: 'Rubric',
  'simplified-instructions': 'Simplified Instructions',
  'choice-board': 'Choice Board',
  'sentence-starters': 'Sentence Starters',
  'vocabulary-chart': 'Vocabulary Chart',
  checklist: 'Checklist',
};

let cachedSpecificationsContent: Promise<string> | null = null;

function getSpecificationsContent(): Promise<string> {
  if (!cachedSpecificationsContent) {
    const specPath = fileURLToPath(
      import.meta.resolve('../prompts/references/material-specifications.md'),
    );
    cachedSpecificationsContent = readFile(specPath, 'utf-8');
  }
  return cachedSpecificationsContent;
}

async function readMaterialSpecification(materialType: string): Promise<string> {
  const heading = materialTypeToHeading[materialType];
  if (!heading) return '';

  const content = await getSpecificationsContent();
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
}

const materialTypeSchema = z.enum([
  'word-bank',
  'graphic-organizer',
  'rubric',
  'simplified-instructions',
  'choice-board',
  'sentence-starters',
  'vocabulary-chart',
  'checklist',
]);

export const createMaterialTool = {
  name: 'create_material' as const,
  description:
    "Generates context for creating a specific teaching material for a lesson activity. Returns the teacher's profile context and material specifications so you can generate the material. Supported types: word-bank, graphic-organizer, rubric, simplified-instructions, choice-board, sentence-starters, vocabulary-chart, checklist.",
  inputSchema: z.object({
    material_type: materialTypeSchema,
    activity_name: z.string().describe('The name of the activity this material supports.'),
    activity_context: z
      .string()
      .describe('The relevant excerpt or description of the activity from the lesson plan.'),
    learning_needs: z
      .array(z.string())
      .describe('The learning need tags this material should address.'),
    grade_range: z
      .enum(['K-2', '3-5', '6-8', '9-12'])
      .optional()
      .describe(
        "Override for grade range. If not provided, uses the grade range from the teacher's profile.",
      ),
  }),
  handler: async (
    input: {
      material_type: z.infer<typeof materialTypeSchema>;
      activity_name: string;
      activity_context: string;
      learning_needs: string[];
      grade_range?: 'K-2' | '3-5' | '6-8' | '9-12';
    },
    context: { userId: string },
  ) => {
    const requestLogger = logger.child({ tool: 'create_material', userId: context.userId });
    const start = Date.now();

    try {
      const { database, schema } = await import('@lesson-adapter/database');
      const { eq } = await import('drizzle-orm');

      const [profile] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, context.userId))
        .limit(1);

      const gradeRange =
        input.grade_range ?? profile?.teachingContext?.gradeRange ?? 'not specified';
      const needsSummary = profile ? generateNeedsSummary(profile.needs) : '';
      const teachingContext = profile ? renderTeachingContext(profile.teachingContext) : '';
      const formatSpecification = await readMaterialSpecification(input.material_type);

      const durationMs = Date.now() - start;
      requestLogger.info(
        { durationMs, materialType: input.material_type, activityName: input.activity_name },
        'Tool completed',
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              materialType: input.material_type,
              activityName: input.activity_name,
              activityContext: input.activity_context,
              learningNeeds: input.learning_needs,
              gradeRange,
              classroomContext: needsSummary,
              teachingContext,
              formatSpecification,
              instructions: `Generate a ${input.material_type} for the "${input.activity_name}" activity. The material should address the learning needs: ${input.learning_needs.join(', ')}. Target grade level: ${gradeRange}. Follow the format specification above. Make it concrete, ready-to-use, and appropriately formatted.`,
            }),
          },
        ],
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      requestLogger.error({ err: error, durationMs }, 'Tool failed');
      return {
        content: [{ type: 'text' as const, text: 'Failed to prepare material context.' }],
        isError: true,
      };
    }
  },
};
