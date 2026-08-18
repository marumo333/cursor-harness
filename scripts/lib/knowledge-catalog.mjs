/**
 * 三層知識の索引カタログ（ADR 0043）。純関数。OPA は呼ばない。
 */
import { relative, resolve } from 'node:path';

export const FEATURE_NAME = /^F-\d{4}-.+\.ya?ml$/;
export const SCHEMA_VERSION = '1';
const SUMMARY_LIMIT = 80;
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
	if (/```/.test(cut) || /https?:\/\//.test(cut) || /\[[^\]]*\]\([^)]+\)/.test(cut)) {
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

function sortRels(rels) {
	return [...rels].sort((a, b) => a.rel.localeCompare(b.rel) || a.target.localeCompare(b.target));
}

export function buildCatalog(input) {
	const denials = [];
	const entities = [];

	for (const f of input.features ?? []) {
		if (!f?.id || !f.status || !f.path) {
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
		if (!heading || `ADR-${heading[1]}` !== id) {
			denials.push(`decision 見出しがファイル名と不一致: ${d.path}`);
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
		entities.push(
			entity({
				id: `skill:${fm.name}`,
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
		} else {
			const required = json.nodes.map((n) => n.id).filter(Boolean);
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

	entities.sort((a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id));
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
		if (seen.has(e.id)) denials.push(`id 衝突: ${e.id}`);
		seen.add(e.id);
		if (!Array.isArray(e.rels)) denials.push(`rels が配列ではない: ${e.id}`);
		else {
			for (const r of e.rels) {
				if (!RELS.has(r.rel) || !r.target) denials.push(`rel 不正: ${e.id}`);
			}
		}
		if (typeof e.summary !== 'string' || e.summary.includes('\n')) {
			denials.push(`summary が1行ではない: ${e.id}`);
		}
	}
	return { ok: denials.length === 0, denials };
}

export function renderLlmsTxt(catalog) {
	const byLayer = { machine: [], human: [], index: [] };
	for (const e of [...catalog.entities].sort((a, b) => a.id.localeCompare(b.id))) {
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
			lines.push(`- [${e.id}](${e.path})${note}`);
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
	const indexDir = resolve(root, 'knowledge', 'index');
	const abs = resolve(dest);
	const rel = relative(indexDir, abs);
	if (!rel || rel.startsWith('..') || rel.startsWith('/') || rel.split(/[\\/]/).includes('..')) {
		throw new Error(`書き込み先は knowledge/index/ のみ: ${dest}`);
	}
	return true;
}
