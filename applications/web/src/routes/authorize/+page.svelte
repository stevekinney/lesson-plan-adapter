<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { page } from '$app/state';
  import { Button } from '@lesson-adapter/components/button';
  import { Badge } from '@lesson-adapter/components/badge';

  let { data } = $props();
  let form = $derived(page.form);

  let completion: 'idle' | 'submitting' | 'authorized' | 'denied' = $state('idle');
  let redirectUrl: string | null = $state(null);

  function handleSubmit(action: 'authorized' | 'denied') {
    return () => {
      completion = 'submitting';

      return async ({ result }: { result: { type: string; location?: string } }) => {
        if (result.type === 'redirect' && result.location) {
          completion = action;
          redirectUrl = result.location;
          setTimeout(() => {
            if (redirectUrl) window.location.href = redirectUrl;
          }, 1000);
        } else if (result.type === 'failure' || result.type === 'error') {
          completion = 'idle';
          await applyAction(result);
        }
      };
    };
  }
</script>

<svelte:head>
  <title>Authorize — Lesson Plan Adapter</title>
</svelte:head>

<main class="authorize-page">
  {#if completion === 'authorized'}
    <div class="authorize-card">
      <div class="completion-icon completion-icon--success" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg
        >
      </div>
      <div class="completion-header">
        <h1 class="completion-title">Connection Authorized</h1>
        <p class="completion-description">You can close this tab.</p>
      </div>
    </div>
  {:else if completion === 'denied'}
    <div class="authorize-card">
      <div class="completion-icon completion-icon--error" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
          ></line></svg
        >
      </div>
      <div class="completion-header">
        <h1 class="completion-title">Access Denied</h1>
        <p class="completion-description">The authorization request was denied.</p>
      </div>
    </div>
  {:else if form?.message}
    <div class="authorize-card">
      <div class="completion-icon completion-icon--error" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
          ></line></svg
        >
      </div>
      <div class="completion-header">
        <h1 class="completion-title">Authorization Failed</h1>
        <p class="completion-description">{form.message}</p>
      </div>
    </div>
  {:else if data.error}
    <div class="authorize-card">
      <div class="completion-icon completion-icon--error" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
          ></line></svg
        >
      </div>
      <div class="completion-header">
        <h1 class="completion-title">Authorization Error</h1>
        <p class="completion-description">{data.error}</p>
      </div>
    </div>
  {:else}
    <div class="authorize-card">
      <div class="authorize-header">
        <h1 class="authorize-title">Lesson Plan Adapter</h1>
        <p class="authorize-subtitle">wants to connect to your account</p>
      </div>

      <div class="authorize-details">
        <div class="detail-row">
          <span class="detail-label">Account</span>
          <span class="detail-value">{data.user?.email || data.user?.name || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Requested by</span>
          <span class="detail-value">{data.clientName}</span>
        </div>
        {#if data.scope}
          <div class="detail-row">
            <span class="detail-label">Scope</span>
            <Badge label={data.scope} size="sm" />
          </div>
        {/if}
      </div>

      <p class="authorize-note">
        This allows the adapter to access your classroom profile when you use it in Claude.
      </p>

      <div class="authorize-actions">
        <form
          method="POST"
          action="?/approve"
          class="action-form"
          use:enhance={handleSubmit('authorized')}
        >
          <input type="hidden" name="client_id" value={data.clientId} />
          <input type="hidden" name="redirect_uri" value={data.redirectUri} />
          <input type="hidden" name="code_challenge" value={data.codeChallenge} />
          <input type="hidden" name="code_challenge_method" value={data.codeChallengeMethod} />
          <input type="hidden" name="state" value={data.state || ''} />
          <input type="hidden" name="scope" value={data.scope} />
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            label={completion === 'submitting' ? 'Authorizing…' : 'Allow Access'}
            disabled={completion === 'submitting'}
          />
        </form>

        <form
          method="POST"
          action="?/deny"
          class="action-form"
          use:enhance={handleSubmit('denied')}
        >
          <input type="hidden" name="client_id" value={data.clientId} />
          <input type="hidden" name="redirect_uri" value={data.redirectUri} />
          <input type="hidden" name="state" value={data.state || ''} />
          <Button
            type="submit"
            variant="ghost"
            size="md"
            fullWidth
            label="Deny"
            disabled={completion === 'submitting'}
          />
        </form>
      </div>
    </div>
  {/if}
</main>

<style>
  .authorize-page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
  }

  .authorize-card {
    width: 100%;
    max-width: 24rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-8) var(--space-6);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
    border: 1px solid var(--border-muted);
    box-shadow: var(--shadow-sm);
  }

  /* Authorize state */

  .authorize-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .authorize-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .authorize-subtitle {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .authorize-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-inset);
    border-radius: var(--radius-md);
    width: 100%;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-0-5);
  }

  .detail-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .detail-value {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text);
  }

  .authorize-note {
    font-size: var(--text-xs);
    color: var(--text-subtle);
    text-align: center;
    line-height: var(--leading-relaxed);
  }

  .authorize-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
  }

  .action-form {
    display: contents;
  }

  /* Completion states (success, denied, error) */

  .completion-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-full);
  }

  .completion-icon--success {
    background: var(--success-bg);
    color: var(--success);
  }

  .completion-icon--error {
    background: var(--danger-bg);
    color: var(--danger);
  }

  .completion-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .completion-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .completion-description {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
