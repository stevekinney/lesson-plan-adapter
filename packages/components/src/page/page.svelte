<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type PageProps = {
    /** Page title - used in header and <title> tag */
    title: string;
    /** Meta description for SEO */
    description?: string;
    /** Optional subtitle shown below the title in the header */
    subtitle?: string;
    /** Icon component to show before title */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    /** Actions (buttons, etc.) to show on the right side of the header */
    actions?: Snippet;
    /** Page content */
    children: Snippet;
  };
</script>

<script lang="ts">
  let { title, description, subtitle, icon: Icon, actions, children }: PageProps = $props();
</script>

<svelte:head>
  <title>{title}</title>
  {#if description}
    <meta name="description" content={description} />
    <meta property="og:description" content={description} />
  {/if}
  <meta property="og:title" content={title} />
</svelte:head>

<header class="page-header">
  <div class="page-header-container">
    <div class="page-header-row">
      <div class="page-header-leading">
        {#if Icon}
          <div class="page-header-icon">
            <Icon class="icon-md" />
          </div>
        {/if}
        <div class="page-header-title-group">
          <h1 class="page-header-title">{title}</h1>
          {#if subtitle}
            <p class="page-header-subtitle">{subtitle}</p>
          {/if}
        </div>
      </div>

      {#if actions}
        {@render actions()}
      {/if}
    </div>
  </div>
</header>

<main class="page-content">
  {@render children()}
</main>

<style>
  .page-header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--border-muted);
    padding-block: var(--space-3);
    background: color-mix(in oklch, var(--surface), transparent 20%);
    backdrop-filter: blur(24px);
  }

  .page-header-container {
    max-width: 72rem;
    margin-inline: auto;
    padding-inline: var(--space-4);
  }

  @media (min-width: 640px) {
    .page-header-container {
      padding-inline: var(--space-6);
    }
  }

  .page-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-header-leading {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .page-header-icon {
    color: var(--text-muted);
  }

  .page-header-title-group {
    min-width: 0;
  }

  .page-header-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .page-header-subtitle {
    font-size: var(--text-sm);
    color: var(--text-muted);
    margin-top: 0.125rem;
  }

  .page-content {
    max-width: 72rem;
    margin-inline: auto;
    padding-inline: var(--space-4);
    padding-block: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  @media (min-width: 640px) {
    .page-content {
      padding-inline: var(--space-6);
    }
  }
</style>
