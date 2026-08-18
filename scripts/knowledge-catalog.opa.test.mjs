import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEATURE_NAME } from './lib/knowledge-catalog.mjs';
import { loadFeatureViaOpa } from './lib/feature-opa.mjs';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const opa = join(ROOT, '.tools', 'opa');
const inCi = Boolean(process.env.GITHUB_ACTIONS);
const skip = !existsSync(opa) && !inCi;

test('Feature の id/status は OPA と一致する', { skip }, () => {
	assert.equal(existsSync(opa), true, 'CI で .tools/opa が無い。feature-gate の後に置くこと');
	const dir = join(ROOT, 'knowledge', 'features');
	const files = readdirSync(dir).filter((n) => FEATURE_NAME.test(n));
	assert.ok(files.length > 0);
	for (const n of files) {
		const f = loadFeatureViaOpa(opa, join(dir, n));
		assert.match(f.id, /^F-\d{4}$/, n);
		assert.equal(typeof f.status, 'string', n);
		assert.equal(typeof f.title, 'string', n);
	}
});
