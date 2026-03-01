<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type TooltipProps = {
    content?: string;
    contentSlot?: Snippet;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    class?: string;
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { cn } from '../utilities/cn.js';

  let {
    content,
    contentSlot,
    position = 'top',
    delay = 300,
    class: className,
    children,
  }: TooltipProps = $props();

  let visible = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isTouchDevice = $state(false);
  let touchOutsideCleanup: (() => void) | null = null;
  const tooltipId = Symbol('tooltip');
  const TOOLTIP_OPEN_EVENT = 'tooltip:open';

  function cleanupTouchOutside() {
    if (touchOutsideCleanup) {
      touchOutsideCleanup();
      touchOutsideCleanup = null;
    }
  }

  function registerTouchOutside() {
    cleanupTouchOutside();
    const handleOutside = () => {
      visible = false;
      cleanupTouchOutside();
    };
    const timeout = setTimeout(() => {
      document.addEventListener('touchstart', handleOutside, { once: true });
    }, 100);

    touchOutsideCleanup = () => {
      clearTimeout(timeout);
      document.removeEventListener('touchstart', handleOutside);
    };
  }

  function notifyTooltipOpen() {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN_EVENT, { detail: tooltipId }));
  }

  function handleTooltipOpen(event: Event) {
    const detail = (event as CustomEvent).detail;
    if (detail !== tooltipId) {
      hideTooltip();
    }
  }

  function showTooltip(event?: FocusEvent | MouseEvent) {
    if (isTouchDevice) return;
    if (event?.type === 'focusin') {
      const target = event.target as HTMLElement | null;
      if (!target?.matches(':focus-visible')) return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    timeoutId = setTimeout(() => {
      notifyTooltipOpen();
      visible = true;
    }, delay);
  }

  function hideTooltip() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    cleanupTouchOutside();
    visible = false;
  }

  function handleTouch(e: TouchEvent) {
    isTouchDevice = true;
    e.stopPropagation();
    visible = !visible;
    if (visible) {
      registerTouchOutside();
    } else {
      cleanupTouchOutside();
    }
  }

  onDestroy(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    cleanupTouchOutside();
  });

  onMount(() => {
    if (typeof document === 'undefined') return;
    document.addEventListener(TOOLTIP_OPEN_EVENT, handleTooltipOpen);
    return () => {
      document.removeEventListener(TOOLTIP_OPEN_EVENT, handleTooltipOpen);
    };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={cn('tooltip-wrapper', className)}
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  onfocusin={showTooltip}
  onfocusout={hideTooltip}
  onpointerdown={hideTooltip}
  ontouchstart={handleTouch}
>
  {@render children?.()}

  {#if visible}
    <div class="tooltip" data-position={position} role="tooltip">
      {#if contentSlot}
        {@render contentSlot()}
      {:else}
        {content}
      {/if}
      <div class="tooltip-arrow" aria-hidden="true"></div>
    </div>
  {/if}
</div>

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-flex;
  }

  .tooltip {
    position: absolute;
    z-index: var(--z-tooltip);
    padding: var(--space-1-5) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text);
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    max-width: 16rem;
    width: max-content;
    overflow-wrap: anywhere;
    pointer-events: none;
    white-space: normal;
  }

  .tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border: 4px solid transparent;
  }

  /* Position: top (default) */
  .tooltip[data-position='top'] {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: var(--space-2);
  }

  .tooltip[data-position='top'] .tooltip-arrow {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--surface-raised);
  }

  /* Position: bottom */
  .tooltip[data-position='bottom'] {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: var(--space-2);
  }

  .tooltip[data-position='bottom'] .tooltip-arrow {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--surface-raised);
  }

  /* Position: left */
  .tooltip[data-position='left'] {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: var(--space-2);
  }

  .tooltip[data-position='left'] .tooltip-arrow {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: var(--surface-raised);
  }

  /* Position: right */
  .tooltip[data-position='right'] {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: var(--space-2);
  }

  .tooltip[data-position='right'] .tooltip-arrow {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: var(--surface-raised);
  }
</style>
