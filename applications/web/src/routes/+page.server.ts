import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { database, schema } from '@lesson-adapter/database';
import { eq } from 'drizzle-orm';
import { generateNeedsSummary } from '@lesson-adapter/mcp';
import { getAuthentication } from '$lib/authentication';

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
      updatedAt: profile.updatedAt.toISOString(),
    },
  };
};

export const actions = {
  signIn: async () => {
    // Redirect to the existing /sign-in GET endpoint which handles the
    // full OAuth flow including Set-Cookie headers for state verification.
    throw redirect(303, '/sign-in?provider=google');
  },

  signOut: async ({ request }) => {
    // Invalidate the session server-side. The cookie becomes invalid on the
    // next request even if it lingers in the browser, because Better Auth
    // checks the session against the database.
    await getAuthentication().api.signOut({
      headers: request.headers,
    });

    throw redirect(303, '/');
  },
} satisfies Actions;
