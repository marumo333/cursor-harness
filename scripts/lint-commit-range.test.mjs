import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';
import { commitLogArgs, parseCommitLogRequest, shouldSkipLegacyJa } from './lib/commit-log-args.mjs';

test('引数なしと HEAD は先端1件だけ', () => {
	assert.deepEqual(commitLogArgs([]), ['log', '-1', '--format=%s%x00%P', '--']);
	assert.deepEqual(commitLogArgs(['HEAD']), ['log', '-1', '--format=%s%x00%P', '--']);
	assert.deepEqual(commitLogArgs(['--tip']), ['log', '-1', '--format=%s%x00%P', '--']);
});

test('範囲指定はそのまま使う', () => {
	assert.deepEqual(commitLogArgs(['origin/main..HEAD']), ['log', '--format=%s%x00%P', 'origin/main..HEAD']);
});

test('--tip に PR head SHA を付けたらその1件だけ', () => {
	assert.deepEqual(commitLogArgs(['--tip', 'abc1234def']), ['log', '-1', '--format=%s%x00%P', '--', 'abc1234def']);
	const r = parseCommitLogRequest(['--tip', 'abc1234def']);
	assert.equal(r.ok, true);
	assert.equal(r.mode, 'tip');
});

test('手書き Merge は親が2つ未満なら通らない', () => {
	assert.equal(lintCommitMessage('Merge abcdef0 into 1234567').ok, false);
	assert.equal(lintCommitMessage('Merge abcdef0 into 1234567', { parentCount: 2 }).ok, true);
	assert.equal(lintCommitMessage('Merge pull request #12 from foo/bar').ok, false);
});

test('先端検査では日本語レガシー免除を使わない', () => {
	assert.equal(shouldSkipLegacyJa('0026 の Claude 席ピンを Opus 5 に固定する。', 'tip'), false);
	assert.equal(shouldSkipLegacyJa('0026 の Claude 席ピンを Opus 5 に固定する。', 'range'), true);
});

test('git の出力オプションは拒否する', () => {
	const r = parseCommitLogRequest(['--output=/tmp/pwned']);
	assert.equal(r.ok, false);
	assert.match(r.reason, /拒否/);
});

test('--tip と範囲を同時に渡したら黙って捨てず拒否する', () => {
	const r = parseCommitLogRequest(['--tip', 'origin/main..HEAD']);
	assert.equal(r.ok, false);
});
