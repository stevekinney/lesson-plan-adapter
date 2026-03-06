<script lang="ts">
  import { page } from '$app/state';
  import { enhance, applyAction } from '$app/forms';
  import { Button } from '@lesson-adapter/components/button';
  import { Card } from '@lesson-adapter/components/card';
  import { Badge } from '@lesson-adapter/components/badge';
  import { Checkbox } from '@lesson-adapter/components/checkbox';
  import { Input } from '@lesson-adapter/components/input';
  import { Select } from '@lesson-adapter/components/select';
  import { Textarea } from '@lesson-adapter/components/textarea';
  import { TAXONOMY } from '@lesson-adapter/mcp/taxonomy';
  import type { TeachingContext } from '@lesson-adapter/database/schema';

  const categoryLabels: Record<string, string> = {
    representation: 'Representation',
    expression: 'Action & Expression',
    engagement: 'Engagement',
  };

  const taxonomyByCategory = $derived.by(() => {
    const grouped: Record<string, (typeof TAXONOMY)[number][]> = {};
    for (const entry of TAXONOMY) {
      (grouped[entry.category] ??= []).push(entry);
    }
    return grouped;
  });

  // ── Server-derived state ──

  const serverNeedTags = $derived(
    new Set((page.data.profile?.needs ?? []).map((n: { tag: string }) => n.tag)),
  );

  const serverContext = $derived<TeachingContext>(page.data.profile?.teachingContext ?? {});

  // ── Local form state: Learning Needs ──

  let checkedNeeds: Record<string, boolean> = $state(
    Object.fromEntries(
      TAXONOMY.map((t) => [
        t.tag,
        (page.data.profile?.needs ?? []).some((n: { tag: string }) => n.tag === t.tag),
      ]),
    ),
  );

  const needsCount = $derived(Object.values(checkedNeeds).filter(Boolean).length);

  const needsDirty = $derived(
    TAXONOMY.some((t) => checkedNeeds[t.tag] !== serverNeedTags.has(t.tag)),
  );

  function revertNeeds() {
    for (const entry of TAXONOMY) {
      checkedNeeds[entry.tag] = serverNeedTags.has(entry.tag);
    }
  }

  // ── Local form state: Teaching Context ──

  function devicesFormValue(value: boolean | undefined | null): string {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return '';
  }

  let gradeRange = $state(page.data.profile?.teachingContext?.gradeRange ?? '');
  let subjectAreas = $state(page.data.profile?.teachingContext?.subjectAreas?.join(', ') ?? '');
  let typicalBlockMinutes = $state(
    page.data.profile?.teachingContext?.typicalBlockMinutes?.toString() ?? '',
  );
  let studentsHaveDevices = $state(
    devicesFormValue(page.data.profile?.teachingContext?.studentsHaveDevices),
  );
  let teachingState = $state(page.data.profile?.teachingContext?.state ?? '');
  let teachingPriorities = $state(page.data.profile?.teachingContext?.teachingPriorities ?? '');
  let knownConstraints = $state(page.data.profile?.teachingContext?.knownConstraints ?? '');
  let additionalContext = $state(page.data.profile?.teachingContext?.additionalContext ?? '');

  const contextDirty = $derived(
    gradeRange !== (serverContext.gradeRange ?? '') ||
      subjectAreas !== (serverContext.subjectAreas?.join(', ') ?? '') ||
      typicalBlockMinutes !== (serverContext.typicalBlockMinutes?.toString() ?? '') ||
      studentsHaveDevices !== devicesFormValue(serverContext.studentsHaveDevices) ||
      teachingState !== (serverContext.state ?? '') ||
      teachingPriorities !== (serverContext.teachingPriorities ?? '') ||
      knownConstraints !== (serverContext.knownConstraints ?? '') ||
      additionalContext !== (serverContext.additionalContext ?? ''),
  );

  function revertContext() {
    const ctx = page.data.profile?.teachingContext ?? {};
    gradeRange = ctx.gradeRange ?? '';
    subjectAreas = ctx.subjectAreas?.join(', ') ?? '';
    typicalBlockMinutes = ctx.typicalBlockMinutes?.toString() ?? '';
    studentsHaveDevices = devicesFormValue(ctx.studentsHaveDevices);
    teachingState = ctx.state ?? '';
    teachingPriorities = ctx.teachingPriorities ?? '';
    knownConstraints = ctx.knownConstraints ?? '';
    additionalContext = ctx.additionalContext ?? '';
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

      <div class="dashboard-grid">
        <!-- Learning Needs -->
        <form
          method="POST"
          action="?/updateLearningNeeds"
          use:enhance={() => {
            return async ({ result }) => {
              await applyAction(result);
              if (result.type === 'success') revertNeeds();
            };
          }}
        >
          <Card title="Learning Needs" description="{needsCount} selected">
            {#snippet actions()}
              {#if needsDirty}
                <Button type="submit" variant="primary" size="xs" label="Save" />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  label="Revert"
                  onclick={revertNeeds}
                />
              {/if}
            {/snippet}
            {#if page.form?.action === 'updateLearningNeeds' && page.form?.error}
              <p class="form-error">{page.form.error}</p>
            {/if}
            <div class="needs-edit-list">
              {#each Object.entries(taxonomyByCategory) as [category, tags] (category)}
                <div class="needs-category">
                  <h3 class="category-label">{categoryLabels[category] ?? category}</h3>
                  <div class="needs-checkboxes">
                    {#each tags as entry (entry.tag)}
                      <Checkbox
                        id="need-{entry.tag}"
                        name="needs"
                        value={entry.tag}
                        label={entry.label}
                        compact
                        bind:checked={checkedNeeds[entry.tag]}
                      />
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        </form>

        <!-- Right column: Teaching Context + Next Steps -->
        <div class="dashboard-column">
          <form
            method="POST"
            action="?/updateTeachingContext"
            use:enhance={() => {
              return async ({ result }) => {
                await applyAction(result);
                if (result.type === 'success') revertContext();
              };
            }}
          >
            <Card title="Teaching Context">
              {#snippet actions()}
                {#if contextDirty}
                  <Button type="submit" variant="primary" size="xs" label="Save" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    label="Revert"
                    onclick={revertContext}
                  />
                {/if}
              {/snippet}
              {#if page.form?.action === 'updateTeachingContext' && page.form?.error}
                <p class="form-error">{page.form.error}</p>
              {/if}
              <div class="context-form">
                <Select
                  id="gradeRange"
                  name="gradeRange"
                  label="Grade Range"
                  bind:value={gradeRange}
                >
                  <option value="">Not set</option>
                  <option value="K-2">K-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-8">6-8</option>
                  <option value="9-12">9-12</option>
                </Select>

                <Input
                  id="subjectAreas"
                  name="subjectAreas"
                  label="Subject Areas"
                  description="Comma-separated (e.g. Math, Science, ELA)"
                  bind:value={subjectAreas}
                />

                <Input
                  id="typicalBlockMinutes"
                  name="typicalBlockMinutes"
                  label="Block Length (minutes)"
                  type="number"
                  bind:value={typicalBlockMinutes}
                />

                <Select
                  id="studentsHaveDevices"
                  name="studentsHaveDevices"
                  label="Students Have Devices"
                  bind:value={studentsHaveDevices}
                >
                  <option value="">Not set</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>

                <Input
                  id="state"
                  name="state"
                  label="State"
                  maxlength={2}
                  description="2-letter abbreviation (e.g. CA, NY)"
                  bind:value={teachingState}
                />

                <Textarea
                  id="teachingPriorities"
                  name="teachingPriorities"
                  label="Teaching Priorities"
                  description="Core priorities or values (e.g. student independence, equity)"
                  bind:value={teachingPriorities}
                />

                <Textarea
                  id="knownConstraints"
                  name="knownConstraints"
                  label="Known Constraints"
                  description="Hard constraints (e.g. no para support, 30+ students)"
                  bind:value={knownConstraints}
                />

                <Textarea
                  id="additionalContext"
                  name="additionalContext"
                  label="Additional Context"
                  bind:value={additionalContext}
                />
              </div>
            </Card>
          </form>

          <Card title="Next Steps">
            <ol class="next-steps">
              <li>Open a new conversation in Claude</li>
              <li>Share a lesson plan you'd like to adapt</li>
              <li>Review the suggestions and decide what fits your classroom</li>
            </ol>
          </Card>
        </div>
      </div>

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

  /* Hero */

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
    max-width: 72rem;
    margin-inline: auto;
    padding-inline: var(--space-6);
    padding-block: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
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

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  @media (min-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .dashboard-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Learning Needs form */

  .needs-edit-list {
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

  .needs-checkboxes {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  /* Teaching Context form */

  .context-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* Next Steps */

  .next-steps {
    padding-left: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  /* Shared */

  .form-error {
    font-size: var(--text-sm);
    color: var(--text-error, oklch(55% 0.2 25));
    margin-bottom: var(--space-3);
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
