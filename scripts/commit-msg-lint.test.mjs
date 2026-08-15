import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';

test('feat と日本語主語は通る', () => {
	const r = lintCommitMessage('feat: pre-commit を常時起動する。');
	assert.equal(r.ok, true);
	assert.deepEqual(r.errors, []);
});

test('scope 付き prefix は通る', () => {
	const r = lintCommitMessage('fix(hooks): --no-verify を拒否する。');
	assert.equal(r.ok, true);
});

test('docs / chore / test も通る', () => {
	for (const type of ['docs', 'chore', 'test', 'refactor', 'ci', 'build', 'perf', 'style', 'revert']) {
		const r = lintCommitMessage(`${type}: 日本語の主語である。`);
		assert.equal(r.ok, true, type);
	}
});

test('prefix が無いと落ちる', () => {
	const r = lintCommitMessage('pre-commit を常時起動する。');
	assert.equal(r.ok, false);
	assert.ok(r.errors.some((e) => e.includes('prefix')));
});

test('未知の prefix は落ちる', () => {
	const r = lintCommitMessage('wip: とりあえず進める。');
	assert.equal(r.ok, false);
});

test('英語だけの主語は落ちる', () => {
	const r = lintCommitMessage('feat: add always-on pre-commit hook');
	assert.equal(r.ok, false);
	assert.ok(r.errors.some((e) => e.includes('日本語')));
});

test('先頭が大文字の Feat は落ちる', () => {
	const r = lintCommitMessage('Feat: フックを足す。');
	assert.equal(r.ok, false);
});

test('全角コロンは落ちる', () => {
	const r = lintCommitMessage('feat：フックを足す。');
	assert.equal(r.ok, false);
});

test('本文があっても主語が英語なら落ちる', () => {
	const r = lintCommitMessage('feat: add hook\n\n詳細は日本語。');
	assert.equal(r.ok, false);
});

test('コメント行と空行は無視する', () => {
	const r = lintCommitMessage('\n# 編集中\nfeat: コメントを無視する。\n');
	assert.equal(r.ok, true);
});

test('空メッセージは落ちる', () => {
	const r = lintCommitMessage('   \n# only comments\n');
	assert.equal(r.ok, false);
});

test('手書き Merge / fixup は通さない', () => {
	assert.equal(lintCommitMessage("Merge branch 'topic'").ok, false);
	assert.equal(lintCommitMessage('Merge whatever i want here').ok, false);
	assert.equal(lintCommitMessage('fixup! feat: 本流。').ok, false);
	assert.equal(lintCommitMessage('squash! feat: 本流。').ok, false);
});

test('git 生成の Merge / rebase 中の fixup は通す', () => {
	assert.equal(lintCommitMessage("Merge branch 'topic'", { isMerge: true }).ok, true);
	assert.equal(lintCommitMessage("Merge abcdef0 into 1234567", { parentCount: 2 }).ok, true);
	assert.equal(lintCommitMessage("Merge abcdef0 into 1234567", { parentCount: 1 }).ok, false);
	assert.equal(lintCommitMessage('fixup! feat: 本流。', { allowFixup: true }).ok, true);
	assert.equal(lintCommitMessage('squash! feat: 本流。', { allowFixup: true }).ok, true);
});

test('Revert は引用内の主語を再検査する', () => {
	assert.equal(lintCommitMessage('Revert "feat: 本流。"').ok, true);
	assert.equal(lintCommitMessage('Revert "Update README.md"').ok, false);
	assert.equal(lintCommitMessage("Revert \"Merge branch 'topic'\"").ok, true);
	assert.equal(lintCommitMessage('Revert "Merge do whatever i want in english"').ok, false);
});

test('1行目が # の確定済み主語はスキップしない', () => {
	assert.equal(
		lintCommitMessage('# pwned english subject\nfeat: 日本語の主語。', { skipHashComments: false }).ok,
		false
	);
	assert.equal(lintCommitMessage('# Please enter the commit message\nfeat: 日本語の主語。').ok, true);
});
