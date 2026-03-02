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

{#if page.data.user}
  <main class="dashboard">
    {#if page.data.profile}
      <div class="dashboard-header">
        <h1 class="dashboard-title">Your Classroom</h1>
        <p class="dashboard-subtitle">
          Welcome back, {page.data.user.name || page.data.user.email}.
        </p>
      </div>

      <Card title="Learning Needs" description="{page.data.profile.needs.length} configured">
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
          <li>Share a lesson plan you'd like to adapt</li>
          <li>Review the suggestions and decide what fits your classroom</li>
        </ol>
        <p class="next-steps-hint">
          To update your classroom profile, ask Claude:
          <strong>"Help me update my classroom profile."</strong>
        </p>
      </Card>

      <form method="POST" action="?/signOut" class="sign-out">
        <Button type="submit" variant="ghost-danger" size="xs" label="Sign Out" />
      </form>
    {:else}
      <div class="dashboard-header">
        <h1 class="dashboard-title">Welcome</h1>
        <p class="dashboard-subtitle">
          Hi, {page.data.user.name || page.data.user.email}.
        </p>
      </div>

      <Card>
        <p class="onboarding-text">
          Connect the Lesson Plan Adapter in Claude, then start a new conversation and say <strong
            >"Help me set up my classroom profile."</strong
          > It takes about two minutes.
        </p>
      </Card>

      <form method="POST" action="?/signOut" class="sign-out">
        <Button type="submit" variant="ghost-danger" size="xs" label="Sign Out" />
      </form>
    {/if}
  </main>
{:else}
  <div class="landing">
    <section class="hero">
      <div class="hero-inner">
        <p class="hero-eyebrow">Built on Universal Design for Learning</p>
        <h1 class="hero-title">Adapt lesson plans to every learner in your classroom</h1>
        <p class="hero-description">
          You know your students. Describe your classroom's learning needs once, then bring in any
          lesson plan and collaborate on specific, actionable adaptations — grounded in your
          professional judgment.
        </p>
        <form method="POST" action="?/signIn" class="hero-action">
          <Button type="submit" variant="primary" size="lg" label="Sign in with Google" />
        </form>
        <p class="hero-note">Works with classroom-level learning needs. No student names needed.</p>
      </div>
    </section>

    <main class="body">
      <section class="how-it-works">
        <h2 class="section-label">How it works</h2>
        <div class="steps">
          <div class="step-card">
            <span class="step-number">1</span>
            <h3 class="step-title">Describe your classroom</h3>
            <p class="step-description">
              Share your students' learning needs in your own words — reading levels, sensory needs,
              behavior supports. The adapter translates your expertise into a UDL-grounded profile.
            </p>
          </div>
          <div class="step-card">
            <span class="step-number">2</span>
            <h3 class="step-title">Share a lesson plan</h3>
            <p class="step-description">
              Bring any lesson plan into a Claude conversation. The adapter works with your plan's
              specific activities and structure, not generic templates.
            </p>
          </div>
          <div class="step-card">
            <span class="step-number">3</span>
            <h3 class="step-title">Refine the suggestions</h3>
            <p class="step-description">
              Review concrete adaptations tied to your lesson. Keep what fits, adjust what doesn't —
              every decision stays with you.
            </p>
          </div>
        </div>
      </section>

      <section class="install">
        <h2 class="section-label">Get started</h2>
        <div class="install-list">
          <Card title="Add from GitHub" description="Recommended — updates are automatic">
            {#snippet actions()}
              <Badge label="Recommended" />
            {/snippet}
            <p class="install-text">
              In Claude, go to <strong>Settings &rarr; Plugins &rarr; Add marketplace</strong> and enter
              the repository below.
            </p>
            <code class="copyable-url">stevekinney/lesson-plan-adapter</code>
          </Card>

          <Card title="Upload Plugin" description="Manual install for Claude">
            {#snippet actions()}
              <Button href="/plugin.zip" external variant="secondary" size="xs" label="Download" />
            {/snippet}
            <p class="install-text">
              Download the ZIP file and upload via
              <strong>Settings &rarr; Plugins &rarr; Upload plugin</strong>.
            </p>
          </Card>

          <Card title="Claude Code Skill" description="CLI integration">
            {#snippet actions()}
              <Button href="/skill.zip" external variant="secondary" size="xs" label="Download" />
            {/snippet}
            <p class="install-text">
              Unzip into your project's <code>.claude/skills/</code> directory.
            </p>
          </Card>

          <Card title="MCP Connector" description="Direct connection">
            <p class="install-text">
              In Claude, go to
              <strong>Settings &rarr; Connectors &rarr; Add custom connector</strong> and enter the URL
              below.
            </p>
            <code class="copyable-url">{page.url.origin}/mcp</code>
          </Card>
        </div>
      </section>
    </main>
  </div>
{/if}

<style>
  /* ── Landing (logged out) ────────────────────────────────── */

  .landing {
    display: flex;
    flex-direction: column;
  }

  /* Hero — dark background for contrast */

  .hero {
    background: oklch(18% 0.03 245);
    color: oklch(92% 0.01 245);
    padding-block: var(--space-16);
    padding-inline: var(--space-6);
  }

  .hero-inner {
    max-width: 42rem;
    margin-inline: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
  }

  .hero-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: oklch(70% 0.12 195);
  }

  .hero-title {
    font-size: clamp(1.75rem, 5vw, 2.75rem);
    font-weight: var(--font-bold);
    line-height: 1.15;
    letter-spacing: var(--tracking-tight);
    color: oklch(98% 0 0);
    max-width: 20ch;
    text-wrap: balance;
  }

  .hero-description {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: oklch(75% 0.01 245);
    max-width: 52ch;
    text-wrap: balance;
  }

  .hero-action {
    margin-top: var(--space-2);
  }

  .hero-note {
    font-size: var(--text-xs);
    color: oklch(55% 0.01 245);
    font-style: italic;
  }

  /* Body */

  .body {
    max-width: 64rem;
    margin-inline: auto;
    padding-inline: var(--space-6);
    padding-block: var(--space-12);
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    width: 100%;
  }

  /* How it works */

  .section-label {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: var(--space-6);
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
  }

  @media (max-width: 640px) {
    .steps {
      grid-template-columns: 1fr;
    }
  }

  .step-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
    border: 1px solid var(--border-muted);
    box-shadow: var(--shadow-sm);
  }

  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-full);
    background: oklch(18% 0.03 245);
    color: oklch(98% 0 0);
    font-size: var(--text-sm);
    font-weight: var(--font-bold);
    flex-shrink: 0;
  }

  .step-title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .step-description {
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    color: var(--text-muted);
  }

  /* Install */

  .install-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .install-text {
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    color: var(--text-muted);
  }

  .install-text code {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    background: var(--surface-inset);
    padding: var(--space-0-5) var(--space-1);
    border-radius: var(--radius-sm);
  }

  .copyable-url {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: var(--surface-inset);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--text);
    user-select: all;
    cursor: pointer;
    margin-top: var(--space-3);
  }

  /* ── Dashboard (logged in) ───────────────────────────────── */

  .dashboard {
    max-width: 540px;
    margin-inline: auto;
    padding-inline: var(--space-4);
    padding-block: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .dashboard-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .dashboard-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .dashboard-subtitle {
    font-size: var(--text-sm);
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

  .onboarding-text {
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    color: var(--text-muted);
  }

  .sign-out {
    align-self: flex-end;
  }
</style>
