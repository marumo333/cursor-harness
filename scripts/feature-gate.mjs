#!/usr/bin/env node
/**
 * Feature 正本 + OPA grow 入場ゲート（ADR 0038）。
 * --test          : opa test policy/
 * --admit <yaml>  : grow.admission action=admit（パス必須・features 配下）
 * (default)       : opa test + 全票の canon + canon 差分の和集合 apply
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureOpa } from './ensure-opa.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POLICY = join(ROOT, 'policy');
const FEATURES = join(ROOT, 'knowledge', 'features');
const GIT = ['-c', 'core.quotePath=false'];

const args = process.argv.slice(2);
const testOnly = args.includes('--test');
const admitIdx = args.indexOf('--admit');
const wantsAdmit = admitIdx >= 0;
const admitPath = wantsAdmit ? args[admitIdx + 1] : null;

const opa = ensureOpa();

function fail(msg) {
	console.error(`[feature-gate] FAIL ${msg}`);
	process.exit(1);
}

function gitLines(cmd, { required = false } = {}) {
	try {
		return execFileSync('git', [...GIT, ...cmd], { encoding: 'utf8', cwd: ROOT })
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
	} catch (e) {
		if (required) {
			fail(`git ${cmd.join(' ')} failed: ${e.message || e}`);
		}
		return [];
	}
}

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
	let parsed;
	try {
		parsed = opaJson(['eval', '-f', 'json', '-d', path, 'data']);
	} catch (e) {
		fail(`cannot parse ${path}: ${e.message || e}`);
	}
	const data = parsed.result?.[0]?.expressions?.[0]?.value;
	if (!data || !data.feature) {
		fail(`${path}: top-level feature: mapping is required`);
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

function resolveMergeBase() {
	for (const base of ['origin/main', 'main']) {
		try {
			const mb = execFileSync('git', [...GIT, 'merge-base', base, 'HEAD'], {
				encoding: 'utf8',
				cwd: ROOT
			}).trim();
			if (mb) return { base, mb };
		} catch {
			// try next
		}
	}
	return null;
}

function diffPaths() {
	const staged = gitLines(['diff', '--cached', '--name-only']);
	const unstaged = gitLines(['diff', '--name-only']);
	const untracked = gitLines(['ls-files', '--others', '--exclude-standard']);
	const resolved = resolveMergeBase();
	if (!resolved) {
		const dirty = [...new Set([...staged, ...unstaged, ...untracked])];
		if (dirty.length === 0) {
			fail('cannot resolve merge-base against origin/main or main; refusing fail-open');
		}
		return dirty;
	}
	const against = gitLines(['diff', '--name-only', resolved.mb], { required: true });
	return [...new Set([...staged, ...unstaged, ...untracked, ...against])];
}

function existingAdrs() {
	const resolved = resolveMergeBase();
	if (!resolved) fail('cannot resolve merge-base for existing ADR list; refusing fail-open');
	return gitLines(['ls-tree', '-r', '--name-only', resolved.mb, 'knowledge/decisions'], {
		required: true
	}).filter((p) => p.endsWith('.md') && !p.endsWith('/README.md') && p !== 'knowledge/decisions/README.md');
}

function assertUnderFeatures(abs) {
	const rel = relative(FEATURES, abs);
	if (rel.startsWith('..') || rel.includes(':')) {
		fail(`--admit path must be under knowledge/features/: ${abs}`);
	}
}

runOpaTest();
if (testOnly) {
	console.log('[feature-gate] opa test pass');
	process.exit(0);
}

if (wantsAdmit) {
	if (!admitPath) fail('--admit requires a knowledge/features/F-NNNN-*.yaml path');
	const abs = resolve(ROOT, admitPath);
	if (!existsSync(abs)) fail(`--admit file not found: ${admitPath}`);
	assertUnderFeatures(abs);
	const feature = loadFeature(abs);
	const deny = evalQuery('data.grow.admission.deny', { action: 'admit', feature }) ?? [];
	const allow = evalQuery('data.grow.admission.allow', { action: 'admit', feature });
	if (!allow) fail(`admit denied for ${admitPath}: ${JSON.stringify(deny)}`);
	console.log(`[feature-gate] admit allow ${feature.id}`);
	process.exit(0);
}

const files = featureFiles();
if (files.length === 0) fail('no knowledge/features/F-NNNN-*.yaml (正本が空)');

const ids = new Set();
for (const file of files) {
	const feature = loadFeature(file);
	const deny = evalQuery('data.feature.canon.deny', { feature }) ?? [];
	if (deny.length) fail(`${file}: ${JSON.stringify(deny)}`);
	if (ids.has(feature.id)) fail(`duplicate feature.id ${feature.id}`);
	ids.add(feature.id);
	const base = file.split('/').pop() ?? '';
	if (!base.startsWith(`${feature.id}-`)) {
		fail(`${file}: filename must start with ${feature.id}-`);
	}
}

const paths = diffPaths();
const canonPaths = evalQuery('data.harness.canon.paths', { diff_paths: paths }) ?? [];
const existing = existingAdrs();

if (canonPaths.length > 0) {
	/** @type {string[]} */
	const reports = [];
	for (const p of canonPaths) {
		let covered = false;
		for (const file of files) {
			const feature = loadFeature(file);
			const input = {
				action: 'apply',
				feature,
				diff_paths: paths,
				cover_paths: [p],
				existing_adrs: existing
			};
			const allow = evalQuery('data.grow.admission.allow', input);
			if (allow) {
				covered = true;
				reports.push(`${p} <- ${feature.id}`);
				break;
			}
		}
		if (!covered) {
			const detail = files.map((file) => {
				const feature = loadFeature(file);
				const deny =
					evalQuery('data.grow.admission.deny', {
						action: 'apply',
						feature,
						diff_paths: paths,
						cover_paths: [p],
						existing_adrs: existing
					}) ?? [];
				return `${feature.id}: ${JSON.stringify(deny)}`;
			});
			fail(`canon path ${p} is not covered by any eligible Feature.\n  ${detail.join('\n  ')}`);
		}
	}
	console.log(`[feature-gate] covered:\n  ${reports.join('\n  ')}`);
}

console.log(`[feature-gate] pass (${files.length} feature(s), ${paths.length} diff path(s), ${canonPaths.length} canon)`);
