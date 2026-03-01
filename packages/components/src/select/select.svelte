<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';

  export type SelectProps = Omit<HTMLSelectAttributes, 'size' | 'id'> & {
    /** Unique identifier for the select (required for accessibility) */
    id: string;
    error?: string;
    fullWidth?: boolean;
    /** Label text for the select (required for accessibility) */
    label: string;
    /** Visually hide the label while keeping it accessible to screen readers */
    hideLabel?: boolean;
    /** Helper text displayed below the select */
    description?: string;
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { cn } from '../utilities/cn.js';
  import Label from '../label/label.svelte';

  let {
    class: className,
    error,
    fullWidth = true,
    label,
    hideLabel = false,
    description,
    id,
    required,
    disabled,
    children,
    value = $bindable(),
    ...rest
  }: SelectProps = $props();

  const descriptionId = $derived(description ? `${id}-description` : undefined);
  const errorId = $derived(error ? `${id}-error` : undefined);
  const describedBy = $derived([descriptionId, errorId].filter(Boolean).join(' ') || undefined);
</script>

<div class={cn('form-field', fullWidth && 'full-width', className)}>
  <Label
    for={id}
    required={!!required}
    disabled={!!disabled}
    class={hideLabel ? 'sr-only' : undefined}
  >
    {label}
  </Label>
  <div class="select-wrapper">
    <select
      {id}
      class="control"
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      {required}
      {disabled}
      bind:value
      {...rest}
    >
      {@render children?.()}
    </select>
    <div class="select-caret" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  </div>
  {#if description}
    <p id={descriptionId} class="field-description">{description}</p>
  {/if}
  {#if error}
    <p id={errorId} class="field-error">{error}</p>
  {/if}
</div>

<style>
  .full-width {
    width: 100%;
  }

  .select-wrapper {
    position: relative;
  }

  .control {
    appearance: none;
    width: 100%;
    padding-right: var(--space-8);
  }

  .select-caret {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    padding-right: var(--space-2);
    pointer-events: none;
  }

  .select-caret svg {
    width: 0.875rem;
    height: 0.875rem;
    color: var(--text-subtle);
  }
</style>
