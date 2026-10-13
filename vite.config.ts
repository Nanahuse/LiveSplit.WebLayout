import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig({
  build: {
    lib: { entry: 'src/entry.ts', name: 'LiveSplitParts', formats: ['iife'], fileName: () => 'livesplit.js', cssFileName: 'livesplit' },
  },
  plugins: [{
    name: 'parts-example',
    generateBundle() {
      const source = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
        .replace('<script type="module" src="./src/entry.ts"></script>', '<link rel="stylesheet" href="./livesplit.css">\n  <script defer src="./livesplit.js"></script>');
      this.emitFile({ type: 'asset', fileName: 'index.html', source });
      this.emitFile({ type: 'asset', fileName: 'serve.ps1', source: readFileSync(new URL('./tools/serve.ps1', import.meta.url), 'utf8') });
      this.emitFile({ type: 'asset', fileName: 'timer.html', source: '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LiveSplit Timer</title><link rel="stylesheet" href="./livesplit.css"><script defer src="./livesplit.js"></script><style>body{margin:0;background:transparent}livesplit-timer{--ls-timer-size:100px}</style><livesplit-timer></livesplit-timer></html>' });
    },
  }],
});
