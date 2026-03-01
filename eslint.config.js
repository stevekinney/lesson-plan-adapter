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
    ignores: ['**/node_modules/', '**/.svelte-kit/', '**/build/', '**/dist/', '**/.turbo/'],
  },
);
