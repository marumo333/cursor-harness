import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commitLogArgs } from './lib/commit-log-args.mjs';

test('引数なしと HEAD は先端1件だけ', () => {
	assert.deepEqual(commitLogArgs([]), ['log', '-1', '--format=%s']);
	assert.deepEqual(commitLogArgs(['HEAD']), ['log', '-1', '--format=%s']);
	assert.deepEqual(commitLogArgs(['--tip']), ['log', '-1', '--format=%s']);
});

test('範囲指定はそのまま使う', () => {
	assert.deepEqual(commitLogArgs(['origin/main..HEAD']), ['log', 'origin/main..HEAD', '--format=%s']);
});
