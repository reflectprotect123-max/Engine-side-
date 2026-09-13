import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const auth = readFileSync(join(dir, 'auth.ts'), 'utf8');
const whoop = readFileSync(join(dir, 'whoop.ts'), 'utf8');

test('whoop.ts can import whoopCallbackUrl from auth.ts', () => {
  assert.match(whoop, /import\s*\{\s*whoopCallbackUrl\s*\}\s*from\s*'\.\/auth\.ts'/);
  assert.match(auth, /export function whoopCallbackUrl\s*\(/);
});

test('whoopCallbackUrl prefers WHOOP_CALLBACK_URL then Edge path', () => {
  const block = auth.match(/export function whoopCallbackUrl\s*\(\)[\s\S]*?\n\}/);
  assert.ok(block, 'whoopCallbackUrl body is missing');
  assert.match(block[0], /WHOOP_CALLBACK_URL/);
  assert.match(block[0], /functions\/v1\/whoop-callback/);
});
