/**
 * Single-file client + ESM host build for dsh-archived-sessions.
 *
 * Mirrors the community dsh-at-file plugin: the web server serves exactly
 * one file per plugin (/plugins/dsh-archived-sessions/client.js), so the
 * client half is one CJS bundle wrapped in the ModuleLoader factory
 * handshake; @deepseek-ai/dsh-* and react stay external (the profile's
 * healed node_modules and the app's module system provide them). The host
 * half is plain ESM for Node, externalizing @deepseek-ai/dsh-* plus cordis
 * while bundling schemastery and zod (the strict wire codecs are needed on
 * both sides).
 */
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'

mkdirSync('lib', { recursive: true })

const dshExternal = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-*']

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  sourcemap: true,
  external: dshExternal,
  logLevel: 'info',
})

await build({
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  jsx: 'automatic',
  external: [...dshExternal, 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
  banner: {
    js: "window.__ModuleLoader__.load({ id: '@jiangdaoli/dsh-archived-sessions', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})
