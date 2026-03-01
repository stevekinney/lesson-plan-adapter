import { plugin } from 'bun';
import { compile, compileModule } from 'svelte/compiler';

plugin({
  name: 'svelte',
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
      const source = await Bun.file(path).text();
      const result = compile(source, {
        filename: path,
        generate: 'client',
        dev: true,
        css: 'injected',
      });
      return { contents: result.js.code, loader: 'js' };
    });

    // .svelte.ts files are Svelte rune modules (plain TS with runes),
    // not components — use compileModule instead of compile.
    build.onLoad({ filter: /\.svelte\.ts$/ }, async ({ path }) => {
      const source = await Bun.file(path).text();
      const result = compileModule(source, {
        filename: path,
        generate: 'client',
        dev: true,
      });
      return { contents: result.js.code, loader: 'js' };
    });
  },
});
