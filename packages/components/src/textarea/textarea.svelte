<script lang="ts" module>
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  export type TextareaProps = Omit<HTMLTextareaAttributes, 'value' | 'placeholder' | 'id'> & {
    /** Unique identifier for the textarea (required for accessibility) */
    id: string;
    error?: string;
    /** Label text for the textarea (required for accessibility) */
    label: string;
    /** Visually hide the label while keeping it accessible to screen readers */
    hideLabel?: boolean;
    /** Placeholder text - defaults to label if hideLabel is true */
    placeholder?: string;
    /** Helper text displayed below the textarea */
    description?: string;
    value?: string;
  };
</script>

<script lang="ts">
  import { cn } from '../utilities/cn.js';
  import Label from '../label/label.svelte';

  let {
    class: className,
    error,
    label,
    hideLabel = false,
    placeholder,
    description,
    id,
    required,
    value = $bindable(''),
    ...rest
  }: TextareaProps = $props();

  const descriptionId = $derived(description ? `${id}-description` : undefined);
  const errorId = $derived(error ? `${id}-error` : undefined);
  const describedBy = $derived([descriptionId, errorId].filter(Boolean).join(' ') || undefined);
  const effectivePlaceholder = $derived(hideLabel && !placeholder ? label : placeholder);
</script>

<div class="form-field">
  <Label for={id} required={required ?? undefined} class={hideLabel ? 'sr-only' : undefined}>
    {label}
  </Label>
  <textarea
    {id}
    class={cn('control', className)}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={describedBy}
    placeholder={effectivePlaceholder}
    {required}
    bind:value
    rows={rest.rows ?? 3}
    {...rest}
  ></textarea>
  {#if description}
    <p id={descriptionId} class="field-description">{description}</p>
  {/if}
  {#if error}
    <p id={errorId} class="field-error">{error}</p>
  {/if}
</div>

<style>
  textarea.control {
    min-height: 5rem;
    resize: vertical;
  }
</style>
