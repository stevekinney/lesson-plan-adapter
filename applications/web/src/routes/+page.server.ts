import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { database, schema } from '@lesson-adapter/database';
import type { LearningNeed, TeachingContext } from '@lesson-adapter/database/schema';
import { eq } from 'drizzle-orm';
import { generateNeedsSummary, isValidTag, getTagCategory } from '@lesson-adapter/mcp';
import { getAuthentication } from '$lib/authentication';
import { logger } from '@lesson-adapter/mcp/logger';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return { profile: null };
  }

  const [profile] = await database
    .select()
    .from(schema.learningProfiles)
    .where(eq(schema.learningProfiles.userId, locals.user.id))
    .limit(1);

  if (!profile) {
    return { profile: null };
  }

  return {
    profile: {
      needs: profile.needs,
      needsSummary: generateNeedsSummary(profile.needs),
      teachingContext: profile.teachingContext,
      updatedAt: profile.updatedAt.toISOString(),
    },
  };
};

const teachingContextSchema = z.object({
  gradeRange: z
    .enum(['K-2', '3-5', '6-8', '9-12', ''])
    .transform((value) => value || undefined)
    .optional(),
  subjectAreas: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
  typicalBlockMinutes: z
    .string()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(z.number().positive().optional().or(z.undefined()))
    .optional(),
  studentsHaveDevices: z
    .enum(['yes', 'no', ''])
    .transform((value) => {
      if (value === 'yes') return true;
      if (value === 'no') return false;
      return undefined;
    })
    .optional(),
  state: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .pipe(
      z
        .string()
        .refine((value) => value === '' || value.length === 2, {
          message: 'State must be a 2-letter abbreviation',
        })
        .transform((value) => value || undefined),
    )
    .optional(),
  additionalContext: z
    .string()
    .transform((value) => value.trim() || undefined)
    .optional(),
  teachingPriorities: z
    .string()
    .transform((value) => value.trim() || undefined)
    .optional(),
  knownConstraints: z
    .string()
    .transform((value) => value.trim() || undefined)
    .optional(),
});

export const actions = {
  signIn: async () => {
    throw redirect(303, '/sign-in?provider=google');
  },

  signOut: async ({ request }) => {
    await getAuthentication().api.signOut({
      headers: request.headers,
    });

    throw redirect(303, '/');
  },

  updateLearningNeeds: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { action: 'updateLearningNeeds', error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const tags = formData.getAll('needs').map(String);

    const needs: LearningNeed[] = [];
    const invalidTags: string[] = [];

    for (const tag of tags) {
      if (!isValidTag(tag)) {
        invalidTags.push(tag);
        continue;
      }
      const category = getTagCategory(tag);
      if (category) {
        needs.push({ tag, category });
      }
    }

    if (invalidTags.length > 0) {
      return fail(400, {
        action: 'updateLearningNeeds',
        error: `Invalid tags: ${invalidTags.join(', ')}`,
      });
    }

    try {
      await database
        .insert(schema.learningProfiles)
        .values({
          userId: locals.user.id,
          needs,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.learningProfiles.userId,
          set: {
            needs,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      logger.error({ err: error }, 'Failed to update learning needs from dashboard');
      return fail(500, { action: 'updateLearningNeeds', error: 'Failed to save learning needs' });
    }
  },

  updateTeachingContext: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { action: 'updateTeachingContext', error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const raw = Object.fromEntries(formData.entries());

    const parsed = teachingContextSchema.safeParse(raw);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return fail(400, { action: 'updateTeachingContext', error: firstError });
    }

    const definedFields: Partial<TeachingContext> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        definedFields[key as keyof TeachingContext] = value as never;
      }
    }

    try {
      const [existing] = await database
        .select()
        .from(schema.learningProfiles)
        .where(eq(schema.learningProfiles.userId, locals.user.id))
        .limit(1);

      if (existing) {
        const merged: TeachingContext = { ...existing.teachingContext, ...definedFields };
        // Remove keys that were explicitly cleared
        for (const key of Object.keys(merged) as (keyof TeachingContext)[]) {
          if (!(key in definedFields)) {
            delete merged[key];
          }
        }
        await database
          .update(schema.learningProfiles)
          .set({ teachingContext: merged, updatedAt: new Date() })
          .where(eq(schema.learningProfiles.userId, locals.user.id));
      } else {
        await database.insert(schema.learningProfiles).values({
          userId: locals.user.id,
          needs: [],
          teachingContext: definedFields as TeachingContext,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to update teaching context from dashboard');
      return fail(500, {
        action: 'updateTeachingContext',
        error: 'Failed to save teaching context',
      });
    }
  },
} satisfies Actions;
