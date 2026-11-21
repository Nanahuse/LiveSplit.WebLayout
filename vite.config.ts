import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const litLicense = readFileSync(new URL('./node_modules/lit-html/LICENSE', import.meta.url), 'utf8').trim();

export default defineConfig({
  build: {
    lib: { entry: 'src/entry.ts', name: 'LiveSplit', formats: ['iife'], fileName: () => 'livesplit.js', cssFileName: 'livesplit' },
  },
  plugins: [{
    name: 'parts-example',
    generateBundle(_options, bundle) {
      const script = bundle['livesplit.js'];
      if (script?.type === 'chunk') script.code = `/*! lit-html\n${litLicense}\n*/\n${script.code}`;
      const source = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
        .replace('<script type="module" src="./src/entry.ts"></script>', '<link rel="stylesheet" href="./livesplit.css">\n  <script defer src="./livesplit.js"></script>');
      this.emitFile({ type: 'asset', fileName: 'index.html', source });
    },
  }],
});
