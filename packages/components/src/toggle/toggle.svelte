<script lang="ts" module>
  import type { HTMLButtonAttributes } from 'svelte/elements';

  export type ToggleProps = Omit<HTMLButtonAttributes, 'type' | 'id'> & {
    /** Unique identifier for the toggle (required for accessibility) */
    id: string;
    checked?: boolean;
    /** Label text for the toggle (required for accessibility) */
    label: string;
    /** Visually hide the label while keeping it accessible to screen readers */
    hideLabel?: boolean;
  };
</script>

<script lang="ts">
  import { cn } from '../utilities/cn.js';

  let {
    class: className,
    checked = $bindable(false),
    label,
    hideLabel = false,
    disabled,
    id,
    ...rest
  }: ToggleProps = $props();

  function toggle() {
    if (!disabled) {
      checked = !checked;
    }
  }
</script>

<div class="toggle-container">
  <button
    {id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={hideLabel ? label : undefined}
    {disabled}
    onclick={toggle}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    }}
    class={cn('toggle', className)}
    data-checked={checked}
    {...rest}
  >
    <span aria-hidden="true" class="toggle-thumb"></span>
  </button>
  <label for={id} class={cn('toggle-label', hideLabel && 'sr-only')} data-disabled={disabled}>
    {label}
  </label>
</div>

<style>
  .toggle-container {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
  }

  .toggle {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    height: 1.5rem;
    width: 2.75rem;
    cursor: pointer;
    border-radius: 9999px;
    border: 2px solid transparent;
    background: var(--control-border);
    transition:
      background-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  .toggle:focus-visible {
    outline: 2px solid transparent;
    box-shadow:
      0 0 0 var(--ring-offset) var(--ring-offset-color),
      0 0 0 calc(var(--ring-offset) + var(--ring-width)) var(--control-ring-color);
  }

  .toggle:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: grayscale(1);
  }

  .toggle[data-checked='true'] {
    background: var(--accent);
  }

  .toggle-thumb {
    pointer-events: none;
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: white;
    box-shadow: var(--shadow-md);
    transition: transform var(--duration-fast) var(--ease-standard);
    transform: translateX(0);
  }

  .toggle[data-checked='true'] .toggle-thumb {
    transform: translateX(1.25rem);
  }

  .toggle-label {
    font-size: var(--text-sm);
    color: var(--text);
    cursor: pointer;
    user-select: none;
  }

  .toggle-label[data-disabled='true'] {
    cursor: not-allowed;
  }
</style>
