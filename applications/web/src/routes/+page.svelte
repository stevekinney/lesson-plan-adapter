<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@lesson-adapter/components/button';
  import { Card } from '@lesson-adapter/components/card';

  import { Badge } from '@lesson-adapter/components/badge';

  const categoryLabels: Record<string, string> = {
    representation: 'Representation',
    expression: 'Action & Expression',
    engagement: 'Engagement',
  };

  const needsByCategory = $derived.by(() => {
    const needs = page.data.profile?.needs ?? [];
    const grouped: Record<string, string[]> = {};
    for (const need of needs) {
      (grouped[need.category] ??= []).push(need.tag);
    }
    return grouped;
  });

  function formatTag(tag: string): string {
    return tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<svelte:head>
  <title>Lesson Plan Adapter</title>
</svelte:head>

<main class="page-container">
  {#if page.data.user}
    {#if page.data.profile}
      <div class="content">
        <h1 class="title">Lesson Plan Adapter</h1>
        <p class="subtitle">
          Welcome back, <strong>{page.data.user.name || page.data.user.email}</strong>.
        </p>

        <Card
          title="Your Classroom Profile"
          description="{page.data.profile.needs.length} learning needs configured"
        >
          <div class="needs-list">
            {#each Object.entries(needsByCategory) as [category, tags] (category)}
              <div class="needs-category">
                <h3 class="category-label">{categoryLabels[category] ?? category}</h3>
                <div class="needs-tags">
                  {#each tags as tag (tag)}
                    <Badge label={formatTag(tag)} />
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </Card>

        <Card title="Next Steps">
          <ol class="next-steps">
            <li>Open a new conversation in Claude</li>
            <li>Paste or describe a lesson plan</li>
            <li>Get specific differentiation suggestions based on your classroom's needs</li>
          </ol>
          <p class="next-steps-hint">
            To update your classroom profile, ask Claude:
            <strong>"Help me update my classroom profile."</strong>
          </p>
        </Card>

        <form method="POST" action="?/signOut" class="sign-out">
          <Button type="submit" variant="ghost-danger" size="xs" label="Sign Out" />
        </form>
      </div>
    {:else}
      <div class="content">
        <h1 class="title">Lesson Plan Adapter</h1>
        <p class="subtitle">
          Welcome, <strong>{page.data.user.name || page.data.user.email}</strong>.
        </p>
        <p class="text-muted">
          Connect the Lesson Plan Adapter integration in Claude, then start a new conversation and
          say <strong>"Help me set up my classroom profile."</strong> It takes about two minutes.
        </p>
        <form method="POST" action="?/signOut" class="sign-out">
          <Button type="submit" variant="ghost-danger" size="xs" label="Sign Out" />
        </form>
      </div>
    {/if}
  {:else}
    <Card>
      <div class="content">
        <h1 class="title">Lesson Plan Adapter</h1>
        <p class="tagline">
          Adapt lesson plans to the learning needs in your classroom, grounded in the Universal
          Design for Learning (UDL) framework.
        </p>
        <p class="text-muted">
          Define your classroom's learning needs once, then drop in any lesson plan and receive
          specific, actionable differentiation suggestions — no prompt engineering required.
        </p>
        <p class="pii-note">
          This tool works with classroom-level learning needs. Please avoid including student names
          when pasting lesson plans.
        </p>
        <form method="POST" action="?/signIn">
          <Button type="submit" variant="primary" size="md" fullWidth label="Sign in with Google" />
        </form>
      </div>
    </Card>
  {/if}
</main>

<style>
  .page-container {
    max-width: 540px;
    margin: var(--space-8) auto;
    padding: var(--space-4);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .title {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .subtitle {
    font-size: var(--text-base);
    color: var(--text-muted);
  }

  .tagline {
    font-size: var(--text-base);
    color: var(--text-muted);
  }

  .needs-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .needs-category {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .category-label {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .needs-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1-5);
  }

  .next-steps {
    padding-left: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .next-steps-hint {
    margin-top: var(--space-3);
    font-size: var(--text-xs);
    color: var(--text-subtle);
  }

  .sign-out {
    align-self: flex-end;
  }

  .pii-note {
    font-size: var(--text-xs);
    color: var(--text-disabled);
    font-style: italic;
  }
</style>
