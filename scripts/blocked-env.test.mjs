import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBlockedEnvPath } from './lib/blocked-env.mjs';

test('実 .env と二段拡張子は止める', () => {
	assert.equal(isBlockedEnvPath('.env'), true);
	assert.equal(isBlockedEnvPath('.env.local'), true);
	assert.equal(isBlockedEnvPath('.env.production.local'), true);
	assert.equal(isBlockedEnvPath('deploy/.env.staging.local'), true);
	assert.equal(isBlockedEnvPath('.envrc'), true);
});

test('example / sample は通す', () => {
	assert.equal(isBlockedEnvPath('.env.example'), false);
	assert.equal(isBlockedEnvPath('.env.sample'), false);
	assert.equal(isBlockedEnvPath('src/app.js'), false);
});
