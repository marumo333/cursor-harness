#!/usr/bin/env node
/**
 * Feature 正本 + OPA grow 入場ゲート（ADR 0038）。
 * --test   : opa test policy/
 * --admit <yaml> : evaluate grow.admission action=admit
 * (default): opa test + 全 Feature の canon + canon 差分があれば apply allow
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureOpa } from './ensure-opa.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POLICY = join(ROOT, 'policy');
const FEATURES = join(ROOT, 'knowledge', 'features');
const DECISIONS = join(ROOT, 'knowledge', 'decisions');

const args = process.argv.slice(2);
const testOnly = args.includes('--test');
const admitIdx = args.indexOf('--admit');
const admitPath = admitIdx >= 0 ? args[admitIdx + 1] : null;

const opa = ensureOpa();

function opaJson(opaArgs) {
	const out = execFileSync(opa, opaArgs, { encoding: 'utf8', cwd: ROOT });
	return JSON.parse(out);
}

function evalQuery(query, inputObj) {
	const dir = mkdtempSync(join(tmpdir(), 'opa-gate-'));
	const inputFile = join(dir, 'input.json');
	writeFileSync(inputFile, JSON.stringify(inputObj));
	try {
		const parsed = opaJson(['eval', '-f', 'json', '-d', POLICY, '--input', inputFile, query]);
		return parsed.result?.[0]?.expressions?.[0]?.value;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

function loadFeature(path) {
	const parsed = opaJson(['eval', '-f', 'json', '-d', path, 'data']);
	const data = parsed.result?.[0]?.expressions?.[0]?.value;
	if (!data || !data.feature) {
		throw new Error(`${path}: top-level feature: mapping is required`);
	}
	return data.feature;
}

function featureFiles() {
	if (!existsSync(FEATURES)) return [];
	return readdirSync(FEATURES)
		.filter((n) => /^F-\d{4}-.+\.ya?ml$/.test(n))
		.map((n) => join(FEATURES, n))
		.sort();
}

function runOpaTest() {
	execFileSync(opa, ['test', POLICY, '-v'], { stdio: 'inherit', cwd: ROOT });
}

function gitLines(cmd) {
	try {
		return execFileSync('git', cmd, { encoding: 'utf8', cwd: ROOT })
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
	} catch {
		return [];
	}
}

function diffPaths() {
	const staged = gitLines(['diff', '--cached', '--name-only']);
	const unstaged = gitLines(['diff', '--name-only']);
	const untracked = gitLines(['ls-files', '--others', '--exclude-standard']);
	let against = [];
	const mergeBase = gitLines(['merge-base', 'origin/main', 'HEAD']);
	if (mergeBase[0]) {
		against = gitLines(['diff', '--name-only', mergeBase[0]]);
	} else {
		against = gitLines(['diff', '--name-only', 'main...HEAD']);
	}
	return [...new Set([...staged, ...unstaged, ...untracked, ...against])];
}

function existingAdrs() {
	if (!existsSync(DECISIONS)) return [];
	const mergeBase = gitLines(['merge-base', 'origin/main', 'HEAD'])[0];
	if (mergeBase) {
		return gitLines(['ls-tree', '-r', '--name-only', mergeBase, 'knowledge/decisions'])
			.filter((p) => p.endsWith('.md') && !p.endsWith('README.md'));
	}
	return readdirSync(DECISIONS)
		.filter((n) => n.endsWith('.md'))
		.map((n) => `knowledge/decisions/${n}`);
}

function fail(msg) {
	console.error(`[feature-gate] FAIL ${msg}`);
	process.exit(1);
}

runOpaTest();
if (testOnly) {
	console.log('[feature-gate] opa test pass');
	process.exit(0);
}

if (admitPath) {
	const feature = loadFeature(admitPath);
	const deny = evalQuery('data.grow.admission.deny', { action: 'admit', feature }) ?? [];
	const allow = evalQuery('data.grow.admission.allow', { action: 'admit', feature });
	if (!allow) fail(`admit denied for ${admitPath}: ${JSON.stringify(deny)}`);
	console.log(`[feature-gate] admit allow ${feature.id}`);
	process.exit(0);
}

const files = featureFiles();
if (files.length === 0) fail('no knowledge/features/F-NNNN-*.yaml (正本が空)');

for (const file of files) {
	const feature = loadFeature(file);
	const deny = evalQuery('data.feature.canon.deny', { feature }) ?? [];
	if (deny.length) fail(`${file}: ${JSON.stringify(deny)}`);
}

const paths = diffPaths();
const input = {
	action: 'apply',
	diff_paths: paths,
	existing_adrs: existingAdrs()
};

const CANON_FILES = new Set(['.claude/CLAUDE.md', '.claude/AGENTS.md']);
const CANON_PREFIXES = [
	'.claude/skills/',
	'.claude/agents/',
	'knowledge/decisions/',
	'knowledge/criteria/',
	'policy/'
];
const needsApply = paths.some(
	(p) => CANON_FILES.has(p) || CANON_PREFIXES.some((pre) => p.startsWith(pre))
);

if (needsApply) {
	let allowed = false;
	/** @type {string[]} */
	const reports = [];
	for (const file of files) {
		const feature = loadFeature(file);
		const allow = evalQuery('data.grow.admission.allow', { ...input, feature });
		const deny = evalQuery('data.grow.admission.deny', { ...input, feature }) ?? [];
		reports.push(`${feature.id}: allow=${allow} deny=${JSON.stringify(deny)}`);
		if (allow) allowed = true;
	}
	if (!allowed) {
		fail(
			`canon paths changed without an admitted/bootstrap Feature covering them.\n  ${reports.join('\n  ')}`
		);
	}
}

console.log(`[feature-gate] pass (${files.length} feature(s), ${paths.length} diff path(s))`);
