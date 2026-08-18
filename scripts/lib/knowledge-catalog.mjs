/**
 * 三層知識の索引カタログ（ADR 0043）。純関数。OPA は呼ばない。
 */
import { closeSync, constants, existsSync, lstatSync, openSync, realpathSync, writeSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

export const FEATURE_NAME = /^F-\d{4}-.+\.ya?ml$/;
export const SCHEMA_VERSION = '1';
const SUMMARY_LIMIT = 80;
export const ID_PATTERN = {
	feature: /^F-\d{4}$/,
	decision: /^ADR-\d{4}$/,
	criterion: /^criterion:[a-z0-9][a-z0-9._-]{0,63}$/,
	skill: /^skill:[A-Za-z0-9._-]{1,64}$/,
	cycle: /^cycle:required$/
};
export const REL_TARGET = {
	cites: /^ADR-\d{4}$/,
	requires: /^skill:[A-Za-z0-9._-]{1,64}$/
};
const STATUS_MAP = { 提案: 'proposed', 受理: 'accepted', 廃止: 'superseded' };
const LAYERS = new Set(['machine', 'index', 'human']);
const KINDS = new Set(['decision', 'feature', 'criterion', 'skill', 'cycle']);
const RELS = new Set(['cites', 'requires']);

export function criterionId(stem) {
	return `criterion:${stem}`;
}

export function codePointSlice(s, n) {
	return Array.from(s).slice(0, n).join('');
}

export function sanitizeSummary(raw) {
	const collapsed = String(raw ?? '').replace(/\s+/g, ' ').trim();
	const cut = codePointSlice(collapsed, SUMMARY_LIMIT);
	if (
		/```/.test(cut) ||
		/~~~/.test(cut) ||
		/https?:\/\//.test(cut) ||
		cut.includes('](') ||
		/\[[^\]]+\]\[[^\]]*\]/.test(cut)
	) {
		return '';
	}
	return cut;
}

export function parseDecisionStatus(line) {
	const m = String(line).match(/^- 状態:\s*(提案|受理|廃止)/);
	return m ? STATUS_MAP[m[1]] : null;
}

export function parseDecisionId(filename) {
	const m = String(filename).match(/^(\d{4})-/);
	return m ? `ADR-${m[1]}` : null;
}

export function extractAdrRefs(text) {
	const ids = [];
	let inRelated = false;
	for (const line of String(text).split('\n')) {
		if (/^- 関連:/.test(line)) inRelated = true;
		else if (inRelated && /^- \S/.test(line)) inRelated = false;
		if (!inRelated) continue;
		for (const m of line.matchAll(/\[\[(\d{4})/g)) ids.push(`ADR-${m[1]}`);
	}
	return [...new Set(ids)];
}

export function parseSkillFrontmatter(text) {
	const src = String(text);
	if (!src.startsWith('---')) return null;
	const end = src.indexOf('\n---', 3);
	if (end < 0) return null;
	const fm = src.slice(4, end);
	const name = fm.match(/^name:\s*(.+)$/m);
	if (!name) return null;
	const desc = fm.match(/^description:\s*(.+)$/m);
	return { name: stripQuote(name[1]), description: desc ? stripQuote(desc[1]) : '' };
}

function stripQuote(s) {
	const t = s.trim();
	if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
		return t.slice(1, -1);
	}
	return t;
}

function firstHashLine(text) {
	const m = String(text).match(/^#\s+(.+)$/m);
	return m ? m[1].trim() : '';
}

function entity(fields) {
	return {
		id: fields.id,
		kind: fields.kind,
		layer: fields.layer,
		path: fields.path,
		rels: sortRels(fields.rels ?? []),
		status: fields.status,
		summary: sanitizeSummary(fields.summary)
	};
}

export function cmpStr(a, b) {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

export function parseCatalogArgs(argv) {
	const rest = argv.filter((a) => a !== '--');
	const known = new Set(['--check', '--write']);
	const unknown = rest.filter((a) => a.startsWith('-') && !known.has(a));
	if (unknown.length) return { ok: false, error: `未知のフラグ: ${unknown.join(' ')}` };
	const check = rest.includes('--check');
	const write = rest.includes('--write');
	if (check === write) return { ok: false, error: '`--check` か `--write` のどちらか一方' };
	return { ok: true, check, write };
}

function sortRels(rels) {
	return [...rels].sort((a, b) => cmpStr(a.rel, b.rel) || cmpStr(a.target, b.target));
}

export function buildCatalog(input) {
	const denials = [];
	const entities = [];

	for (const f of input.features ?? []) {
		if (!f?.id || typeof f.status !== 'string' || typeof f.title !== 'string' || !f.path) {
			denials.push(`feature レコード欠落: ${f?.path ?? f?.id ?? '?'}`);
			continue;
		}
		entities.push(
			entity({
				id: f.id,
				kind: 'feature',
				layer: 'machine',
				path: f.path,
				status: f.status,
				summary: f.title ?? '',
				rels: []
			})
		);
	}

	for (const d of input.decisions ?? []) {
		const id = parseDecisionId(d.filename);
		if (!id) {
			denials.push(`decision ファイル名が ADR 番号ではない: ${d.path}`);
			continue;
		}
		const statusLine = String(d.text).split('\n').find((l) => l.startsWith('- 状態:'));
		const status = statusLine ? parseDecisionStatus(statusLine) : null;
		if (!status) {
			denials.push(`decision 状態が読めない: ${d.path}`);
			continue;
		}
		const heading = String(d.text).match(/^# ADR (\d{4}):\s*(.+)$/m);
		if (!heading) {
			denials.push(`decision 見出しが無い（# ADR NNNN: 題名）: ${d.path}`);
			continue;
		}
		if (`ADR-${heading[1]}` !== id) {
			denials.push(`decision 見出し番号がファイル名と不一致: ${d.path}`);
			continue;
		}
		entities.push(
			entity({
				id,
				kind: 'decision',
				layer: 'human',
				path: d.path,
				status,
				summary: heading[2],
				rels: extractAdrRefs(d.text).map((target) => ({ rel: 'cites', target }))
			})
		);
	}

	for (const c of input.criteria ?? []) {
		entities.push(
			entity({
				id: criterionId(c.stem),
				kind: 'criterion',
				layer: 'machine',
				path: c.path,
				status: 'n/a',
				summary: firstHashLine(c.text) || c.stem,
				rels: []
			})
		);
	}

	for (const s of input.skills ?? []) {
		const fm = parseSkillFrontmatter(s.text);
		if (!fm) {
			denials.push(`skill front matter が無い: ${s.path}`);
			continue;
		}
		const skillId = `skill:${fm.name}`;
		if (!ID_PATTERN.skill.test(skillId)) {
			denials.push(`skill id が不正: ${s.path}`);
			continue;
		}
		entities.push(
			entity({
				id: skillId,
				kind: 'skill',
				layer: 'human',
				path: s.path,
				status: 'n/a',
				summary: fm.description,
				rels: []
			})
		);
	}

	if (input.cycle) {
		const json = input.cycle.json;
		if (!json || !Array.isArray(json.nodes)) {
			denials.push(`cycle JSON が不正: ${input.cycle.path}`);
		} else if (json.optional_nodes != null && !Array.isArray(json.optional_nodes)) {
			denials.push(`cycle optional_nodes が配列ではない: ${input.cycle.path}`);
		} else if (json.nodes.some((n) => !n?.id || !REL_TARGET.requires.test(n.id))) {
			denials.push(`cycle ノード id が不正: ${input.cycle.path}`);
		} else {
			const required = json.nodes.map((n) => n.id);
			const optional = (json.optional_nodes ?? []).length;
			entities.push(
				entity({
					id: 'cycle:required',
					kind: 'cycle',
					layer: 'machine',
					path: input.cycle.path,
					status: 'n/a',
					summary: `required ${required.length} / optional ${optional}`,
					rels: required.map((target) => ({ rel: 'requires', target }))
				})
			);
		}
	}

	if (denials.length) return { ok: false, catalog: null, denials };

	entities.sort((a, b) => cmpStr(a.path, b.path) || cmpStr(a.id, b.id));
	const catalog = {
		advisory: true,
		entities,
		layer: 'index',
		schema_version: SCHEMA_VERSION
	};
	const v = validateCatalog(catalog);
	if (!v.ok) return { ok: false, catalog: null, denials: v.denials };
	return { ok: true, catalog, denials: [] };
}

export function validateCatalog(catalog) {
	const denials = [];
	if (!catalog || catalog.schema_version !== SCHEMA_VERSION || catalog.layer !== 'index' || catalog.advisory !== true) {
		denials.push('catalog 封筒が不正');
	}
	if (!Array.isArray(catalog?.entities)) {
		return { ok: false, denials: ['entities が配列ではない'] };
	}
	const seen = new Set();
	for (const e of catalog.entities) {
		if (!e.id || !KINDS.has(e.kind) || !LAYERS.has(e.layer) || !e.path) {
			denials.push(`必須キー欠落: ${e.id ?? e.path ?? '?'}`);
		}
		if (e.id && ID_PATTERN[e.kind] && !ID_PATTERN[e.kind].test(e.id)) {
			denials.push(`id が不正: ${e.id}`);
		}
		if (seen.has(e.id)) denials.push(`id 衝突: ${e.id}`);
		seen.add(e.id);
		if (!Array.isArray(e.rels)) denials.push(`rels が配列ではない: ${e.id}`);
		else {
			for (const r of e.rels) {
				if (!RELS.has(r.rel) || !r.target) denials.push(`rel 不正: ${e.id}`);
				else if (REL_TARGET[r.rel] && !REL_TARGET[r.rel].test(r.target)) {
					denials.push(`rel target が不正: ${e.id} ${r.target}`);
				}
			}
		}
		if (typeof e.status !== 'string' || !e.status) denials.push(`status 欠落: ${e.id}`);
		if (typeof e.summary !== 'string' || e.summary.includes('\n')) {
			denials.push(`summary が1行ではない: ${e.id}`);
		}
	}
	return { ok: denials.length === 0, denials };
}

export function renderLlmsTxt(catalog) {
	const byLayer = { machine: [], human: [], index: [] };
	for (const e of [...catalog.entities].sort((a, b) => cmpStr(a.id, b.id))) {
		(byLayer[e.layer] ?? byLayer.index).push(e);
	}
	const lines = [
		'# cursor-harness',
		'',
		'> 三層知識の地図。index は派生でありデータ。入場は Feature / criteria / policy の原文。',
		''
	];
	for (const layer of ['machine', 'index', 'human']) {
		if (!byLayer[layer].length) continue;
		lines.push(`## ${layer}`, '');
		for (const e of byLayer[layer]) {
			const note = e.summary ? `: ${e.summary}` : '';
			lines.push(`- [${e.id}](${e.path}) (${e.status})${note}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

export function sortKeys(value) {
	if (Array.isArray(value)) return value.map(sortKeys);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((k) => [k, sortKeys(value[k])])
		);
	}
	return value;
}

export function dumpJson(obj) {
	return `${JSON.stringify(sortKeys(obj), null, '\t')}\n`;
}

export function assertIndexPath(root, dest) {
	const knowledge = resolve(root, 'knowledge');
	const indexDir = resolve(root, 'knowledge', 'index');
	const knowledgeReal = existsSync(knowledge) ? realpathSync(knowledge) : knowledge;
	const expectedIndex = join(knowledgeReal, 'index');
	if (existsSync(indexDir) && realpathSync(indexDir) !== expectedIndex) {
		throw new Error('knowledge/index の実体がずれている');
	}
	const destAbs = resolve(dest);
	const destStat = lstatOrNull(destAbs);
	if (destStat?.isSymbolicLink()) throw new Error(`書き込み先が symlink: ${dest}`);
	if (destStat && destStat.nlink > 1) throw new Error(`書き込み先がハードリンク: ${dest}`);
	const parent = dirname(destAbs);
	const parentReal = existsSync(parent) ? realpathSync(parent) : parent;
	const absDest = join(parentReal, basename(destAbs));
	const rel = relative(expectedIndex, absDest);
	if (!rel || rel.startsWith('..') || rel.startsWith('/') || rel.split(/[\\/]/).includes('..')) {
		throw new Error(`書き込み先は knowledge/index/ のみ: ${dest}`);
	}
	return true;
}

function lstatOrNull(p) {
	try {
		return lstatSync(p);
	} catch (e) {
		if (e.code === 'ENOENT') return null;
		throw e;
	}
}

export function writeIndexFile(path, text) {
	const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW;
	let fd;
	try {
		fd = openSync(path, flags, 0o644);
		writeSync(fd, text);
	} catch (e) {
		if (e.code === 'ELOOP') throw new Error(`書き込み先が symlink: ${path}`);
		throw e;
	} finally {
		if (fd !== undefined) closeSync(fd);
	}
}

export const INDEX_FILES = new Set(['README.md', 'layer.schema.json', 'catalog.json', 'llms.txt']);

export function assertIndexListing(names) {
	const extra = [...names].filter((n) => !INDEX_FILES.has(n));
	if (extra.length) throw new Error(`index に想定外のファイル: ${extra.join(' ')}`);
	return true;
}
