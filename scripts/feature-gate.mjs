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
const GIT = ['-c', 'core.quotePath=false'];
const F0001 = 'knowledge/features/F-0001-feature-canon-opa-grow.yaml';
const FEATURE_NAME = /^F-\d{4}-.+\.ya?ml$/;
const FORBIDDEN_LEARNED_BUILTIN = /\b(http\.send|opa\.runtime|net\.lookup_ip_addr|io\.jwt)\b/;
const PACKAGE_HOME = {
	'grow.admission': 'grow.rego',
	'grow.admission_test': 'grow_test.rego',
	'feature.canon': 'feature.rego',
	'feature.canon_test': 'feature_test.rego',
	'harness.canon': 'canon.rego',
	'harness.canon_test': 'canon_test.rego',
	'cycle.admission': 'cycle.rego',
	'cycle.admission_test': 'cycle_test.rego'
};

const args = process.argv.slice(2);
const testOnly = args.includes('--test');
const admitIdx = args.indexOf('--admit');
const wantsAdmit = admitIdx >= 0;
const admitPath = wantsAdmit ? args[admitIdx + 1] : null;

const opa = ensureOpa();

function fail(msg) {
	console.error(`[feature-gate] 失敗 ${msg}`);
	process.exit(1);
}

function gitLines(cmd, { required = false } = {}) {
	try {
		return execFileSync('git', [...GIT, ...cmd], { encoding: 'utf8', cwd: ROOT })
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
	} catch (e) {
		if (required) fail(`git ${cmd.join(' ')} が失敗: ${e.message || e}`);
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
			fail(`opa eval が空を返した: ${query}`);
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
		fail(`解析できない ${path}: ${e.message || e}`);
	}
	const data = parsed.result?.[0]?.expressions?.[0]?.value;
	if (!data || !data.feature) fail(`${path}: トップレベル feature: が必要`);
	return data.feature;
}

function featureFiles() {
	if (!existsSync(FEATURES)) return [];
	return readdirSync(FEATURES)
		.filter((n) => FEATURE_NAME.test(n))
		.map((n) => join(FEATURES, n))
		.sort();
}

const PACKAGE_HOME_FILES = new Set(Object.values(PACKAGE_HOME));
const RESOLVED_NS = {
	'data.grow.admission': 'grow.rego',
	'data.grow.admission_test': 'grow_test.rego',
	'data.feature.canon': 'feature.rego',
	'data.feature.canon_test': 'feature_test.rego',
	'data.harness.canon': 'canon.rego',
	'data.harness.canon_test': 'canon_test.rego',
	'data.cycle.admission': 'cycle.rego',
	'data.cycle.admission_test': 'cycle_test.rego'
};

function walkRego(dir, fn) {
	if (!existsSync(dir)) return;
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, ent.name);
		if (ent.isSymbolicLink()) {
			fail(`policy 配下の symlink は拒否: ${relative(POLICY, p)}`);
		}
		if (ent.isDirectory()) walkRego(p, fn);
		else if (ent.name.endsWith('.rego')) fn(p);
	}
}

function fileBase(p) {
	return String(p).replaceAll('\\', '/').split('/').pop();
}

function assertResolvedNamespaces() {
	let parsed;
	try {
		parsed = opaJson(['inspect', '-f', 'json', POLICY]);
	} catch (e) {
		fail(`opa inspect が失敗: ${e.message || e}`);
	}
	const ns = parsed.namespaces || {};
	for (const [name, home] of Object.entries(RESOLVED_NS)) {
		const files = (ns[name] || []).map(fileBase);
		if (files.length !== 1 || files[0] !== home) {
			fail(`名前空間 ${name} の正本は ${home} のみ（実際 ${JSON.stringify(ns[name] || [])}）`);
		}
	}
	for (const [name, files] of Object.entries(ns)) {
		if (name.startsWith('data.learned.')) continue;
		if (RESOLVED_NS[name]) continue;
		fail(`未知の名前空間 ${name}: ${JSON.stringify(files)}`);
	}
}

function assertPolicyIsolation() {
	walkRego(POLICY, (abs) => {
		const rel = relative(POLICY, abs).replaceAll('\\', '/');
		const text = readFileSync(abs, 'utf8');
		if (FORBIDDEN_LEARNED_BUILTIN.test(text)) {
			fail(`policy/${rel} は http.send / opa.runtime / net.lookup_ip_addr / io.jwt を使えない`);
		}
		if (!rel.startsWith('learned/') && !PACKAGE_HOME_FILES.has(rel)) {
			fail(`policy/${rel} は許可された正本ファイルではない`);
		}
	});
	assertResolvedNamespaces();
}

function runOpaTest() {
	assertPolicyIsolation();
	try {
		execFileSync(opa, ['test', POLICY, '-v'], { stdio: 'inherit', cwd: ROOT });
	} catch (e) {
		fail(`opa test が失敗（終了コード ${e.status ?? '不明'}）`);
	}
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
			// 次の基準ブランチを試す
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
	if (!Array.isArray(deny)) fail('grow.admission.deny が配列を返さなかった');
	return { ok: deny.length === 0, deny };
}

function assertUnderFeatures(abs) {
	const rel = relative(FEATURES, abs);
	if (rel.startsWith('..') || rel.includes(':')) {
		fail(`--admit のパスは knowledge/features/ 配下: ${abs}`);
	}
	if (!FEATURE_NAME.test(rel.split('/').pop() ?? '')) {
		fail(`--admit のファイル名は F-NNNN-*.yaml`);
	}
}

runOpaTest();
if (testOnly) {
	console.log('[feature-gate] opa test 成功');
	process.exit(0);
}

if (wantsAdmit) {
	if (!admitPath) fail('--admit には knowledge/features/F-NNNN-*.yaml が必要');
	const abs = resolve(ROOT, admitPath);
	if (!existsSync(abs)) fail(`--admit のファイルが無い: ${admitPath}`);
	assertUnderFeatures(abs);
	const feature = loadFeature(abs);
	const resolved = resolveMergeBase();
	if (!resolved) fail('origin/main または main との merge-base が解けない。欠落で通すことを拒否する');
	const rel = relative(ROOT, abs).replaceAll('\\', '/');
	const { ok, deny } = admitted({
		action: 'admit',
		feature,
		feature_in_merge_base: inMergeBase(resolved.mb, rel),
		f0001_in_merge_base: inMergeBase(resolved.mb, F0001)
	});
	if (!ok) fail(`入場拒否 ${admitPath}: ${JSON.stringify(deny)}`);
	console.log(`[feature-gate] 入場許可 ${feature.id}`);
	process.exit(0);
}

const resolved = resolveMergeBase();
if (!resolved) fail('origin/main または main との merge-base が解けない。欠落で通すことを拒否する');

const files = featureFiles();
if (files.length === 0) fail('knowledge/features/F-NNNN-*.yaml が無い（正本が空）');

const loaded = files.map((file) => ({ file, rel: relFeature(file), feature: loadFeature(file) }));
const ids = new Set();
for (const { file, rel, feature } of loaded) {
	const deny = evalQuery('data.feature.canon.deny', { feature });
	if (!Array.isArray(deny) || deny.length) fail(`${file}: ${JSON.stringify(deny)}`);
	if (ids.has(feature.id)) fail(`feature.id が重複 ${feature.id}`);
	ids.add(feature.id);
	if (!rel.split('/').pop()?.startsWith(`${feature.id}-`)) {
		fail(`${file}: ファイル名は ${feature.id}- で始める`);
	}
}

const paths = diffPaths(resolved);
const f0001InBase = inMergeBase(resolved.mb, F0001);
const allCanon = evalQuery('data.harness.canon.paths', { diff_paths: paths });
if (!Array.isArray(allCanon)) fail('harness.canon.paths が配列を返さなかった');

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
			fail(`canon パス ${p} を被覆する入場可能な Feature が無い。\n  ${detail.join('\n  ')}`);
		}
	}
	console.log(`[feature-gate] 被覆:\n  ${reports.join('\n  ')}`);
}

console.log(
	`[feature-gate] 成功（Feature ${loaded.length}、差分 ${paths.length}、canon ${canonPaths.length}）`
);
