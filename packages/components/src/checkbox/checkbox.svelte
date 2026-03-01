<script lang="ts" module>
  import type { HTMLInputAttributes } from 'svelte/elements';

  export type CheckboxProps = Omit<HTMLInputAttributes, 'type' | 'size'> & {
    /** Required unique ID for accessibility - associates label and error with input */
    id: string;
    /** Label text for the checkbox (required for accessibility) */
    label: string;
    /** Visually hide the label while keeping it accessible to screen readers */
    hideLabel?: boolean;
    /** When true, removes min-height for compact contexts like task lists */
    compact?: boolean;
    /** Error message to display */
    error?: string;
  };
</script>

<script lang="ts">
  import { cn } from '../utilities/cn.js';

  let {
    id,
    class: className,
    label,
    hideLabel = false,
    compact = false,
    error,
    disabled,
    'aria-describedby': externalDescribedBy,
    checked = $bindable(false),
    ...rest
  }: CheckboxProps = $props();

  const errorId = $derived(`${id}-error`);
  const describedBy = $derived(
    [externalDescribedBy, error && errorId].filter(Boolean).join(' ') || undefined,
  );
</script>

<label for={id} class="checkbox-label" data-disabled={disabled} data-compact={compact}>
  <div class="checkbox-control">
    <input
      {id}
      type="checkbox"
      bind:checked
      {disabled}
      class={cn('checkbox', className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {...rest}
    />
    {#if checked}
      <svg
        class="checkbox-check"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    {/if}
  </div>
  <span class={cn('checkbox-text', hideLabel && 'sr-only')}>
    {label}
  </span>
  {#if error}
    <span id={errorId} class="field-error">
      {error}
    </span>
  {/if}
</label>

<style>
  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--touch-target-min);
    cursor: pointer;
    user-select: none;
  }

  .checkbox-label[data-compact='true'] {
    min-height: 0;
  }

  .checkbox-label[data-disabled='true'] {
    cursor: not-allowed;
  }

  .checkbox-control {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    margin: calc(-1 * var(--space-2));
  }

  .checkbox-check {
    position: absolute;
    width: 0.75rem;
    height: 0.75rem;
    color: var(--accent-contrast);
    pointer-events: none;
  }

  .checkbox-text {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .checkbox {
    width: var(--control-check-size);
    height: var(--control-check-size);
    background: var(--control-bg);
    border: 1px solid var(--control-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    appearance: none;
    transition:
      background-color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  .checkbox:hover {
    border-color: var(--control-border-hover);
  }

  .checkbox:focus-visible {
    outline: 2px solid transparent;
    box-shadow:
      0 0 0 var(--ring-offset) var(--ring-offset-color),
      0 0 0 calc(var(--ring-offset) + var(--ring-width)) var(--control-ring-color);
  }

  .checkbox:checked {
    background: var(--accent);
    border-color: var(--accent);
  }

  .checkbox:disabled {
    background: var(--control-bg-disabled);
    border-color: var(--control-border-disabled);
    cursor: not-allowed;
  }

  .checkbox[aria-invalid='true'] {
    border-color: var(--control-border-error);
  }
</style>
