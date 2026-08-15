import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';
import {
	commitLogArgs,
	parseCommitLogRecords,
	parseCommitLogRequest,
	shouldSkipLegacyJa
} from './lib/commit-log-args.mjs';

const SCRIPT = fileURLToPath(new URL('./lint-commit-range.mjs', import.meta.url));
const FORMAT = '%B%x00%P%x1e';

test('引数なしと HEAD は先端1件', () => {
	assert.deepEqual(commitLogArgs([]), ['log', '-1', `--format=${FORMAT}`]);
	assert.deepEqual(commitLogArgs(['HEAD']), ['log', '-1', `--format=${FORMAT}`]);
	assert.deepEqual(commitLogArgs(['--tip']), ['log', '-1', `--format=${FORMAT}`]);
});

test('範囲指定はそのまま使う', () => {
	assert.deepEqual(commitLogArgs(['origin/main..HEAD']), ['log', `--format=${FORMAT}`, 'origin/main..HEAD']);
});

test('--tip の SHA は revision であり -- の後ろに置かない', () => {
	assert.deepEqual(commitLogArgs(['--tip', 'abc1234def']), [
		'log',
		'-1',
		`--format=${FORMAT}`,
		'abc1234def'
	]);
	const r = parseCommitLogRequest(['--tip', 'abc1234def']);
	assert.equal(r.ok, true);
	assert.equal(r.mode, 'tip');
	assert.ok(!r.args.includes('--') || r.args.indexOf('abc1234def') < r.args.indexOf('--'));
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

test('%B の1行目を主語にする（%s の段落折り畳みを使わない）', () => {
	const recs = parseCommitLogRecords('feat: add always-on pre-commit hook\n日本語の本文だが空行なし\n\0abc1234\x1e');
	assert.equal(recs.length, 1);
	assert.equal(recs[0].subject, 'feat: add always-on pre-commit hook');
	assert.equal(recs[0].parentCount, 1);
	assert.equal(lintCommitMessage(recs[0].subject).ok, false);
});

function initRepo() {
	const dir = mkdtempSync(join(tmpdir(), 'lint-range-'));
	execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
	execFileSync('git', ['config', 'user.email', 'a@b.c'], { cwd: dir });
	execFileSync('git', ['config', 'user.name', 't'], { cwd: dir });
	return dir;
}

function commitFile(dir, name, message) {
	writeFileSync(join(dir, name), name);
	execFileSync('git', ['add', name], { cwd: dir });
	execFileSync('git', ['commit', '-q', '-m', message], { cwd: dir });
	return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
}

function runLint(dir, args) {
	try {
		execFileSync('node', [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
		return 0;
	} catch (err) {
		return err && typeof err === 'object' && 'status' in err ? err.status : 1;
	}
}

test('一時リポ: --tip SHA は指定コミットを読み、手書き Merge は落とす', () => {
	const dir = initRepo();
	try {
		const good = commitFile(dir, 'a.txt', 'feat: 初期化する。');
		assert.equal(runLint(dir, ['--tip', good]), 0);
		const fakeMerge = commitFile(dir, 'b.txt', 'Merge whatever i want here');
		assert.equal(runLint(dir, ['--tip', fakeMerge]), 1);
		assert.equal(runLint(dir, ['--tip', good]), 0);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('一時リポ: 実 merge の英語主語は落とし、Merge branch は通す', () => {
	const dir = initRepo();
	try {
		commitFile(dir, 'a.txt', 'feat: 土台を作る。');
		execFileSync('git', ['checkout', '-q', '-b', 'side'], { cwd: dir });
		commitFile(dir, 's.txt', 'feat: 枝で作業する。');
		execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
		commitFile(dir, 'm.txt', 'feat: main を進める。');
		execFileSync('git', ['checkout', '-q', 'side'], { cwd: dir });
		execFileSync('git', ['merge', '--no-ff', '-m', 'pwned english subject, no prefix', 'main'], { cwd: dir });
		const badMerge = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
		assert.equal(runLint(dir, ['--tip', badMerge]), 1);
		execFileSync('git', ['reset', '--hard', '-q', 'HEAD~1'], { cwd: dir });
		execFileSync('git', ['merge', '--no-ff', '-m', "Merge branch 'main' into side", 'main'], { cwd: dir });
		const goodMerge = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
		assert.equal(runLint(dir, ['--tip', goodMerge]), 0);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
