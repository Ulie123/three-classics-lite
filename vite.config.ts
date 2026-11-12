import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { type Plugin, defineConfig } from 'vite';

/**
 * GitHub Pages has no server-side routing, so a link straight to /three-classics-lite/checkers would
 * 404. Pages serves 404.html for unknown paths; making it a copy of the app shell lets the router
 * take over and show the right page.
 */
function spaFallback(): Plugin {
  let outDir = 'dist';
  return {
    name: 'spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

// The site is served from https://<user>.github.io/three-classics-lite/ (and so is `npm run preview`);
// dev and tests run from /.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? (process.env.BASE_PATH ?? '/three-classics-lite/') : '/',
  plugins: [react(), spaFallback()],
  server: {
    port: 5174,
  },
  worker: {
    format: 'es',
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
