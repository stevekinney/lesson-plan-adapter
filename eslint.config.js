import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...svelte.configs.recommended,
    ],
  },
  {
    files: ['**/*.svelte', '**/*.svelte.js', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    // The components package is intentionally decoupled from SvelteKit.
    // Navigation rules that require SvelteKit's resolve() do not apply.
    files: ['packages/components/**/*.svelte'],
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    // Prevent client-side Svelte files from importing server-only packages.
    // These barrel exports pull in env vars, database clients, and MCP SDK
    // code that crashes in the browser. Use subpath exports instead
    // (e.g., @lesson-adapter/mcp/taxonomy).
    files: ['**/*.svelte'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@lesson-adapter/mcp',
              message:
                'Import from a subpath (e.g., @lesson-adapter/mcp/taxonomy) to avoid pulling server-only code into the client bundle.',
            },
            {
              name: '@lesson-adapter/mcp/logger',
              message:
                'The logger is server-only. Use it in +page.server.ts or +server.ts instead.',
            },
            {
              name: '@lesson-adapter/mcp/env',
              message:
                'Environment variables are server-only. Use them in +page.server.ts or +server.ts instead.',
            },
            {
              name: '@lesson-adapter/database',
              message:
                'The database client is server-only. Use it in +page.server.ts or +server.ts instead.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['**/node_modules/', '**/.svelte-kit/', '**/build/', '**/dist/', '**/.turbo/'],
  },
);
