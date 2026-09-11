import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const bundle = spawnSync('node', [join(root, 'scripts', 'bundle-adaptive.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (bundle.status !== 0) process.exit(bundle.status ?? 1);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const files = [
  'index.html',
  'home.css',
  'logger.css',
  'library.css',
  'app.js',
  'engine.js',
  'library.js',
  'library-ui.js',
  'logger.js',
  'timer.js',
  'session.js',
  'native-bridge.js',
  'brain-bundle.js',
  'adaptive-bundle.js',
  'service-worker.js',
  'PRODUCT.json',
];

const dirs = ['assets', 'connectors', 'vendor'];

const missing = [];
for (const rel of [...files, ...dirs]) {
  const src = join(root, rel);
  if (!existsSync(src)) {
    missing.push(rel);
    continue;
  }
  cpSync(src, join(dist, rel), { recursive: true });
}

if (missing.length) {
  console.error('build-site: missing expected files:', missing.join(', '));
  process.exit(1);
}

console.log(`build-site: assembled ${files.length} files + ${dirs.length} dirs into dist/`);
