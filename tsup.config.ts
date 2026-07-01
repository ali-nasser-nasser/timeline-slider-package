import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS builds (for npm consumers / bundlers)
  {
    entry: { 'timeline-slider': 'src/TimeLineSlider.js' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2018',
    outDir: 'dist',
  },
  // IIFE/global build (for direct <script> / CDN usage via unpkg, jsdelivr)
  {
    entry: { 'timeline-slider': 'src/TimeLineSlider.js' },
    format: ['iife'],
    globalName: 'TimeLineSlider',
    sourcemap: true,
    minify: true,
    target: 'es2018',
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    footer: {
      // IIFE wraps the default export under TimeLineSlider.default by default;
      // expose it directly as the global so <script> usage is `new TimeLineSlider(...)`.
      js: 'if (typeof TimeLineSlider !== "undefined" && TimeLineSlider && TimeLineSlider.default) { TimeLineSlider = TimeLineSlider.default; }',
    },
  },
]);