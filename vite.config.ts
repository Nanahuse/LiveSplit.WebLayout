import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Node.js is only used to build. The output runs directly from file://.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { modulePreload: false },
});
