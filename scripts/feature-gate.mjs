#!/usr/bin/env node
/**
 * Feature 正本 + OPA grow 入場ゲート（ADR 0038）。
 * allow 完全ルールは信用しない。判定は deny 集合が空であることだけ。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureOpa } from './ensure-opa.mjs';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const POLICY = process.env.OPA_POLICY_DIR || join(ROOT, 'policy');
const FEATURES = join(ROOT, 'knowledge', 'features');
const LEARNED = join(POLICY, 'learned');
const GIT = ['-c', 'core.quotePath=false'];
const F0001 = 'knowledge/features/F-0001-feature-canon-opa-grow.yaml';
const FEATURE_NAME = /^F-\d{4}-.+\.ya?ml$/;
const FORBIDDEN_LEARNED = /^\s*package\s+(grow\.admission|feature\.canon|harness\.canon|cycle\.admission)\b/m;

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
		if (required) fail(`git ${cmd.join(' ')} failed: ${e.message || e}`);
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
		const value = parsed.result?.[0]?.expressions?.[0]?.value;
		if (value === undefined) {
			if (query === 'data.harness.canon.paths') return [];
			fail(`opa eval returned empty for ${query}`);
		}
		return value;
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
	if (!data || !data.feature) fail(`${path}: top-level feature: mapping is required`);
	return data.feature;
}

function featureFiles() {
	if (!existsSync(FEATURES)) return [];
	return readdirSync(FEATURES)
		.filter((n) => FEATURE_NAME.test(n))
		.map((n) => join(FEATURES, n))
		.sort();
}

function assertLearnedIsolation() {
	if (!existsSync(LEARNED)) return;
	for (const name of readdirSync(LEARNED)) {
		if (!name.endsWith('.rego')) continue;
		const text = readFileSync(join(LEARNED, name), 'utf8');
		if (FORBIDDEN_LEARNED.test(text)) {
			fail(`policy/learned/${name} must not declare package grow.admission|feature.canon|harness.canon|cycle.admission`);
		}
	}
}

function runOpaTest() {
	assertLearnedIsolation();
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

function inMergeBase(mb, path) {
	try {
		execFileSync('git', [...GIT, 'cat-file', '-e', `${mb}:${path}`], {
			cwd: ROOT,
			stdio: 'ignore'
		});
		return true;
	} catch {
		return false;
	}
}

function diffPaths(resolved) {
	const staged = gitLines(['diff', '--cached', '--name-only']);
	const unstaged = gitLines(['diff', '--name-only']);
	const untracked = gitLines(['ls-files', '--others', '--exclude-standard']);
	const against = gitLines(['diff', '--name-only', resolved.mb], { required: true });
	return [...new Set([...staged, ...unstaged, ...untracked, ...against])];
}

function existingAdrs(mb) {
	return gitLines(['ls-tree', '-r', '--name-only', mb, 'knowledge/decisions'], {
		required: true
	}).filter((p) => p.endsWith('.md') && p !== 'knowledge/decisions/README.md');
}

function relFeature(file) {
	return relative(ROOT, file).replaceAll('\\', '/');
}

function isExemptNewProposed(rel, feature, mb) {
	if (!rel.startsWith('knowledge/features/') || !FEATURE_NAME.test(rel.split('/').pop() ?? '')) {
		return false;
	}
	if (inMergeBase(mb, rel)) return false;
	return (
		feature.status === 'proposed' &&
		feature.evidence?.adversarial_review !== 'approved' &&
		feature.bootstrap !== true
	);
}

function admitted(input) {
	const deny = evalQuery('data.grow.admission.deny', input);
	if (!Array.isArray(deny)) fail('grow.admission.deny did not return an array');
	return { ok: deny.length === 0, deny };
}

function assertUnderFeatures(abs) {
	const rel = relative(FEATURES, abs);
	if (rel.startsWith('..') || rel.includes(':')) {
		fail(`--admit path must be under knowledge/features/: ${abs}`);
	}
	if (!FEATURE_NAME.test(rel.split('/').pop() ?? '')) {
		fail(`--admit filename must match F-NNNN-*.yaml`);
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
	const { ok, deny } = admitted({ action: 'admit', feature });
	if (!ok) fail(`admit denied for ${admitPath}: ${JSON.stringify(deny)}`);
	console.log(`[feature-gate] admit allow ${feature.id}`);
	process.exit(0);
}

const resolved = resolveMergeBase();
if (!resolved) fail('cannot resolve merge-base against origin/main or main; refusing fail-open');

const files = featureFiles();
if (files.length === 0) fail('no knowledge/features/F-NNNN-*.yaml (正本が空)');

const loaded = files.map((file) => ({ file, rel: relFeature(file), feature: loadFeature(file) }));
const ids = new Set();
for (const { file, rel, feature } of loaded) {
	const deny = evalQuery('data.feature.canon.deny', { feature });
	if (!Array.isArray(deny) || deny.length) fail(`${file}: ${JSON.stringify(deny)}`);
	if (ids.has(feature.id)) fail(`duplicate feature.id ${feature.id}`);
	ids.add(feature.id);
	if (!rel.split('/').pop()?.startsWith(`${feature.id}-`)) {
		fail(`${file}: filename must start with ${feature.id}-`);
	}
}

const paths = diffPaths(resolved);
const f0001InBase = inMergeBase(resolved.mb, F0001);
const allCanon = evalQuery('data.harness.canon.paths', { diff_paths: paths });
if (!Array.isArray(allCanon)) fail('harness.canon.paths did not return an array');

const canonPaths = allCanon.filter((p) => {
	const hit = loaded.find((x) => x.rel === p);
	if (hit && isExemptNewProposed(hit.rel, hit.feature, resolved.mb)) return false;
	return true;
});

const existing = existingAdrs(resolved.mb);

if (canonPaths.length > 0) {
	/** @type {string[]} */
	const reports = [];
	for (const p of canonPaths) {
		let covered = false;
		for (const { rel, feature } of loaded) {
			const input = {
				action: 'apply',
				feature,
				diff_paths: paths,
				cover_paths: [p],
				existing_adrs: existing,
				f0001_in_merge_base: f0001InBase,
				feature_in_merge_base: inMergeBase(resolved.mb, rel)
			};
			const { ok } = admitted(input);
			if (ok) {
				covered = true;
				reports.push(`${p} <- ${feature.id}`);
				break;
			}
		}
		if (!covered) {
			const detail = loaded.map(({ rel, feature }) => {
				const { deny } = admitted({
					action: 'apply',
					feature,
					diff_paths: paths,
					cover_paths: [p],
					existing_adrs: existing,
					f0001_in_merge_base: f0001InBase,
					feature_in_merge_base: inMergeBase(resolved.mb, rel)
				});
				return `${feature.id}: ${JSON.stringify(deny)}`;
			});
			fail(`canon path ${p} is not covered by any eligible Feature.\n  ${detail.join('\n  ')}`);
		}
	}
	console.log(`[feature-gate] covered:\n  ${reports.join('\n  ')}`);
}

console.log(
	`[feature-gate] pass (${loaded.length} feature(s), ${paths.length} diff path(s), ${canonPaths.length} canon)`
);
