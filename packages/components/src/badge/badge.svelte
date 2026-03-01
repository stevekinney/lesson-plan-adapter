<script lang="ts" module>
  import type { Snippet, ComponentType, SvelteComponent } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';
  export type BadgeSize = 'xs' | 'sm';

  type IconComponent = ComponentType<SvelteComponent<{ class?: string }>>;

  export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant;
    size?: BadgeSize;
    /** Snippet content for the badge */
    children?: Snippet;
    /** Text label for the badge - use instead of children for simple text */
    label?: string;
    /** Icon component to render before the label */
    icon?: IconComponent;
    /** Display as monospace code style */
    code?: boolean;
    /** Truncate to this many characters (displays full value in title) */
    truncate?: number;
  };
</script>

<script lang="ts">
  import { cn } from '../utilities/cn.js';
  import { truncate as truncateText } from '../utilities/truncate.js';

  let {
    variant = 'default',
    size = 'sm',
    class: className,
    children,
    label,
    icon: Icon,
    code = false,
    truncate,
    ...rest
  }: BadgeProps = $props();

  const displayValue = $derived.by(() => {
    if (!label) return null;
    return truncate ? truncateText(label, truncate, '') : label;
  });
</script>

<span
  class={cn('badge', className)}
  data-code={code}
  data-variant={variant}
  data-size={size}
  title={truncate && label && label.length > truncate ? label : undefined}
  {...rest}
>
  {#if Icon}<Icon class="icon-xs" />{/if}
  {#if children}{@render children()}{:else if displayValue}{displayValue}{/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-0-5) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    line-height: 1.25;
    border-radius: var(--radius-sm);
    border-width: 1px;
    border-style: solid;
    white-space: nowrap;
    transition: background-color var(--duration-fast) var(--ease-standard);
  }

  .badge[data-size='xs'] {
    font-size: var(--text-3xs);
    padding: 0 var(--space-1);
    height: 1rem;
  }

  .badge[data-code='true'] {
    font-family: var(--font-mono);
    user-select: all;
  }

  /* Variant: default */
  .badge[data-variant='default'] {
    background: var(--surface-inset);
    color: var(--text);
    border-color: var(--border-muted);
  }

  /* Variant: accent */
  .badge[data-variant='accent'] {
    background: color-mix(in oklch, var(--secondary), transparent 85%);
    color: var(--secondary);
    border-color: color-mix(in oklch, var(--secondary), transparent 60%);
  }

  /* Variant: success */
  .badge[data-variant='success'] {
    background: var(--success-bg);
    color: var(--success);
    border-color: var(--success-bg-strong);
  }

  /* Variant: warning */
  .badge[data-variant='warning'] {
    background: var(--warning-bg);
    color: var(--warning);
    border-color: var(--warning-bg-strong);
  }

  /* Variant: danger */
  .badge[data-variant='danger'] {
    background: var(--danger-bg);
    color: var(--danger);
    border-color: var(--danger-bg-strong);
  }
</style>
