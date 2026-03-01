<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@lesson-adapter/components/button';
  import { Alert } from '@lesson-adapter/components/alert';
  import { Card } from '@lesson-adapter/components/card';
  import { Badge } from '@lesson-adapter/components/badge';

  let { data } = $props();
  let form = $derived(page.form);
</script>

<svelte:head>
  <title>{form?.approved ? 'Connected' : 'Authorize Application'}</title>
</svelte:head>

<main class="page-container">
  {#if form?.approved}
    <Card>
      <div class="content">
        <Alert variant="success" title="Connected!">
          <div class="alert-body">
            {#if form.hasProfile}
              <p>
                You're all set. Open a new conversation in Claude and paste a lesson plan to get
                adaptation suggestions.
              </p>
              <p>
                To update your classroom profile, just ask Claude:
                <strong>"Help me update my classroom profile."</strong>
              </p>
            {:else}
              <p>
                To get started, open a new conversation in Claude and say:
                <strong>"Help me set up my classroom profile."</strong> It takes about two minutes.
              </p>
            {/if}
          </div>
        </Alert>

        <p class="close-note">You can close this tab.</p>
      </div>
    </Card>

    <!-- Hidden iframe completes the OAuth redirect_uri callback so the MCP client
         receives the authorization code without navigating the user's browser tab. -->
    <iframe src={form.callbackUrl} title="OAuth callback" hidden></iframe>
  {:else if data.error}
    <Card>
      <Alert variant="danger" title="Authorization Error" description={data.error} />
    </Card>
  {:else}
    <Card>
      <div class="content">
        <h1 class="title">Authorize {data.clientName}</h1>
        <p class="text-muted">
          <strong>{data.clientName}</strong> wants to access your account as
          <strong>{data.user?.email || data.user?.name || 'Unknown'}</strong>.
        </p>

        {#if data.scope}
          <p class="text-muted">Requested scopes: <Badge label={data.scope} size="sm" /></p>
        {/if}

        <div class="actions">
          <form method="POST" action="?/approve">
            <input type="hidden" name="client_id" value={data.clientId} />
            <input type="hidden" name="redirect_uri" value={data.redirectUri} />
            <input type="hidden" name="code_challenge" value={data.codeChallenge} />
            <input type="hidden" name="code_challenge_method" value={data.codeChallengeMethod} />
            <input type="hidden" name="state" value={data.state || ''} />
            <input type="hidden" name="scope" value={data.scope} />
            <Button type="submit" variant="primary" label="Approve" />
          </form>

          <form method="POST" action="?/deny">
            <input type="hidden" name="client_id" value={data.clientId} />
            <input type="hidden" name="redirect_uri" value={data.redirectUri} />
            <input type="hidden" name="state" value={data.state || ''} />
            <Button type="submit" variant="secondary" label="Deny" />
          </form>
        </div>
      </div>
    </Card>
  {/if}
</main>

<style>
  .page-container {
    max-width: 480px;
    margin: var(--space-8) auto;
    padding: var(--space-4);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .title {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text);
  }

  .actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  .alert-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .close-note {
    font-size: var(--text-xs);
    color: var(--text-disabled);
    font-style: italic;
  }
</style>
