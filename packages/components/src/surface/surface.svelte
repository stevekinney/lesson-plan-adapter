<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  export type SurfaceTone = 'default' | 'raised' | 'inset';

  export type SurfaceProps = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    tone?: SurfaceTone;
    /** Additional CSS classes */
    class?: string;
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { cn } from '../utilities/cn.js';

  let { tone = 'default', class: className, children, ...rest }: SurfaceProps = $props();
</script>

<div class={cn('surface', className)} data-tone={tone} {...rest}>
  {#if children}
    {@render children()}
  {/if}
</div>
