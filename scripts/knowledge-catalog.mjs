#!/usr/bin/env node
/**
 * 三層知識の catalog.json / llms.txt を生成する（ADR 0043）。
 * 起動点は CLI と CI のみ。hooks からは呼ばない。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureOpa } from './ensure-opa.mjs';
import { loadFeatureViaOpa } from './lib/feature-opa.mjs';
import {
	FEATURE_NAME,
	assertIndexPath,
	buildCatalog,
	dumpJson,
	renderLlmsTxt
} from './lib/knowledge-catalog.mjs';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'knowledge', 'index');
const CATALOG_PATH = join(INDEX, 'catalog.json');
const LLMS_PATH = join(INDEX, 'llms.txt');

function fail(msg) {
	console.error(`[knowledge-catalog] 失敗 ${msg}`);
	process.exit(1);
}

function rel(abs) {
	return relative(ROOT, abs).replaceAll('\\', '/');
}

function listFiles(dir, pred) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter(pred)
		.sort()
		.map((n) => join(dir, n));
}

function loadFeatures() {
	const dir = join(ROOT, 'knowledge', 'features');
	const files = listFiles(dir, (n) => FEATURE_NAME.test(n));
	if (!files.length) fail('Feature 票が無い');
	let opa;
	try {
		opa = ensureOpa();
	} catch (e) {
		fail(`OPA を解決できない（Feature 抜きの catalog は書かない）: ${e.message || e}`);
	}
	return files.map((p) => {
		try {
			const f = loadFeatureViaOpa(opa, p);
			return { id: f.id, status: f.status, title: f.title, path: rel(p) };
		} catch (e) {
			fail(`Feature を読めない ${rel(p)}: ${e.message || e}`);
		}
	});
}

function collect() {
	const decisions = listFiles(join(ROOT, 'knowledge', 'decisions'), (n) => /^\d{4}-.+\.md$/.test(n)).map((p) => ({
		filename: p.split(/[\\/]/).pop(),
		path: rel(p),
		text: readFileSync(p, 'utf8')
	}));
	const criteria = listFiles(join(ROOT, 'knowledge', 'criteria'), (n) => n.endsWith('.yaml')).map((p) => ({
		stem: p.split(/[\\/]/).pop().replace(/\.ya?ml$/, ''),
		path: rel(p),
		text: readFileSync(p, 'utf8')
	}));
	const skillRoot = join(ROOT, '.claude', 'skills');
	const skills = existsSync(skillRoot)
		? readdirSync(skillRoot)
				.sort()
				.map((n) => join(skillRoot, n, 'SKILL.md'))
				.filter((p) => existsSync(p))
				.map((p) => ({ path: rel(p), text: readFileSync(p, 'utf8') }))
		: [];
	const cyclePath = join(ROOT, 'knowledge', 'graph', 'required-cycle.json');
	if (!existsSync(cyclePath)) fail('required-cycle.json が無い');
	return {
		features: loadFeatures(),
		decisions,
		criteria,
		skills,
		cycle: { path: rel(cyclePath), json: JSON.parse(readFileSync(cyclePath, 'utf8')) }
	};
}

function generate() {
	const built = buildCatalog(collect());
	if (!built.ok) fail(built.denials.join('; '));
	return {
		catalogText: dumpJson(built.catalog),
		llmsText: renderLlmsTxt(built.catalog)
	};
}

const check = process.argv.includes('--check');
const write = process.argv.includes('--write') || !check;

try {
	assertIndexPath(ROOT, CATALOG_PATH);
	assertIndexPath(ROOT, LLMS_PATH);
} catch (e) {
	fail(e.message);
}

const { catalogText, llmsText } = generate();

if (check) {
	if (!existsSync(CATALOG_PATH) || !existsSync(LLMS_PATH)) fail('生成物が無い');
	const catOk = readFileSync(CATALOG_PATH, 'utf8') === catalogText;
	const llmsOk = readFileSync(LLMS_PATH, 'utf8') === llmsText;
	if (!catOk || !llmsOk) fail('catalog.json / llms.txt が再生成結果と一致しない');
	console.log('[knowledge-catalog] check ok');
	process.exit(0);
}

if (write) {
	mkdirSync(INDEX, { recursive: true });
	writeFileSync(CATALOG_PATH, catalogText);
	writeFileSync(LLMS_PATH, llmsText);
	console.log('[knowledge-catalog] wrote knowledge/index/catalog.json knowledge/index/llms.txt');
}
