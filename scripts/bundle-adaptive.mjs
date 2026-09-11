import * as esbuild from 'esbuild';

await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['packages/adaptive/src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'HybridAdaptive',
  outfile: 'adaptive-bundle.js',
  platform: 'browser',
  target: 'es2022',
  footer: {
    js: 'if (typeof globalThis !== "undefined") globalThis.HybridAdaptive = HybridAdaptive;',
  },
});
