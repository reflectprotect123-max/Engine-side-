import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const js = readFileSync(join(root, 'app.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const lib = readFileSync(join(root, 'library.js'), 'utf8');
const libUi = readFileSync(join(root, 'library-ui.js'), 'utf8');
const product = JSON.parse(readFileSync(join(root, 'PRODUCT.json'), 'utf8'));
const failures = [];
function must(c, m) {
  if (!c) failures.push(m);
}

must(product.hybridProduct === 'engine', 'PRODUCT.json stamp engine');
must(js.includes('THE-hybrid-engine-v1'), 'own storage key');
must(html.includes('hybrid-product" content="engine"'), 'html product stamp');
must(html.includes('The Engine'), 'Engine title');
must(html.includes('adaptive-bundle.js'), 'loads adaptive bundle');
must(html.includes('engine.js'), 'loads engine.js');
must(!html.includes('plan-sync.js'), 'Engine does not use Strength plan sync');
must(!js.includes('strength_side'), 'Engine app does not write strength_side');
must(!js.includes('PlanSync'), 'Engine app has no PlanSync');
must(!js.includes('TRAINING_DEMO'), 'no Strength HPP demo plan');
must(libUi.includes('Create Engine session'), 'Engine library create');
must(!libUi.includes('Create Session Template'), 'no Strength template CTA');
must(!libUi.includes('+ Add Exercise'), 'Engine editor does not add lifts');
must(lib.includes("lane: kind") || lib.includes("lane: 'engine'"), 'templates are engine lane');
must(readFileSync(join(root, 'engine.js'), 'utf8').includes('decideNextCond'), 'Next calls adaptive cond');
must(!readFileSync(join(root, 'engine.js'), 'utf8').includes('decideNextLift'), 'Engine product never calls lift Next');
must(readFileSync(join(root, 'logger.js'), 'utf8').includes('How hard was that'), 'RPE after work');
must(js.includes('function trnEngineHtml'), 'Training Engine cards');
must(js.includes('THE-hybrid-engine-v1') && !js.includes("STORAGE_KEY = 'THE-brain-v1'"), 'storage is not the Strength key');

for (const f of ['app.js', 'logger.js', 'engine.js', 'session.js', 'library.js', 'library-ui.js']) {
  const r = spawnSync('node', ['--check', join(root, f)], { encoding: 'utf8' });
  must(r.status === 0, `${f} parses (${(r.stderr || '').trim() || 'ok'})`);
}

if (failures.length) {
  console.error('engine-app.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('engine-app.smoke: ok');
