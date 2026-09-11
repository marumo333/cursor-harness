import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export const PACKET_MAX_BYTES = 32768;
export const FORBIDDEN_KEYS = new Set([
	'learnings',
	'conversation',
	'decisions',
	'session',
	'effort',
	'escalate',
	'seat'
]);
const CYCLE_RE = /^C-\d{4}$/;
const MODES = new Set(['isolated', 'packet']);

const ADR_RE = /^knowledge\/(decisions|criteria|features)\/[A-Za-z0-9._/-]+$/;

export function assertAdrPaths(root, paths) {
	const knowledge = join(root, 'knowledge');
	for (const p of paths ?? []) {
		const rel = String(p).replaceAll('\\', '/');
		if (rel.includes('..') || rel.startsWith('/') || !ADR_RE.test(rel)) {
			throw new Error('--adr は knowledge/decisions|criteria|features 配下の相対パス');
		}
		const abs = join(root, rel);
		if (!existsSync(abs)) throw new Error(`--adr が存在しない: ${rel}`);
		const st = lstatSync(abs);
		if (st.isSymbolicLink() || st.isDirectory()) {
			throw new Error('--adr は実在する通常ファイルだけ（symlink / ディレクトリは拒否）');
		}
		const real = realpathSync(abs);
		const fromKnowledge = relative(realpathSync(knowledge), real).replaceAll('\\', '/');
		if (fromKnowledge.startsWith('..') || !/^(decisions|criteria|features)\//.test(fromKnowledge)) {
			throw new Error('--adr は knowledge/decisions|criteria|features 配下の相対パス');
		}
	}
}

export function packetFileName({ cycle, node, seq }) {
	const safe = String(node ?? '').replace(/[:/]/g, '-');
	return `${cycle}.${safe}.${seq}.json`;
}

function assertCycle(cycle) {
	if (!CYCLE_RE.test(String(cycle ?? ''))) {
		throw new Error('--cycle は C-NNNN 形式');
	}
}

export function assertNoForbiddenKeys(value, path = '') {
	if (Array.isArray(value)) {
		value.forEach((v, i) => assertNoForbiddenKeys(v, `${path}[${i}]`));
		return;
	}
	if (value && typeof value === 'object') {
		for (const [k, v] of Object.entries(value)) {
			if (FORBIDDEN_KEYS.has(k)) {
				const kind = k === 'effort' || k === 'escalate' || k === 'seat' ? '子キー' : '禁則';
				throw new Error(`${kind}キー ${k} はパケットに置けない`);
			}
			assertNoForbiddenKeys(v, path ? `${path}.${k}` : k);
		}
	}
}

export function hasFacts(packet) {
	if (String(packet.feature ?? '').trim()) return true;
	if (String(packet.diff_stat ?? '').trim()) return true;
	if (packet.metrics && typeof packet.metrics === 'object') {
		if (Object.values(packet.metrics).some((v) => v != null && String(v).trim() !== '')) return true;
	}
	if (
		(packet.catalog_hits ?? []).some(
			(h) => String(h?.id ?? '').trim() && String(h?.path ?? '').trim()
		)
	) {
		return true;
	}
	if ((packet.adr_paths ?? []).some((p) => String(p ?? '').trim())) return true;
	return false;
}

export function queryCatalogHits(catalog, query = {}) {
	let ents = [...(catalog?.entities ?? [])];
	if (query.feature) {
		const id = String(query.feature);
		ents = ents.filter((e) => e.id === id || String(e.path ?? '').includes(id));
	}
	if (query.paths?.length) {
		const set = new Set(query.paths);
		ents = ents.filter((e) => set.has(e.path));
	}
	return ents.slice(0, 20).map((e) => ({ id: e.id, path: e.path }));
}

export function buildPacket(input) {
	assertCycle(input.cycle);
	const node = String(input.node ?? '');
	if (!node) throw new Error('--node が必要');
	const seq = Number(input.seq);
	if (!Number.isInteger(seq) || seq < 1) throw new Error('--seq は 1 以上の整数');
	const context_mode = input.context_mode;
	if (!MODES.has(context_mode)) throw new Error('context_mode は isolated か packet');
	return {
		schema: 'harness-query/v1',
		cycle: input.cycle,
		node,
		seq,
		context_mode,
		feature: input.feature ?? null,
		diff_stat: String(input.diff_stat ?? '').slice(0, 2048),
		metrics: input.metrics ?? null,
		catalog_hits: (input.catalog_hits ?? []).slice(0, 20).map((h) => ({ id: h.id, path: h.path })),
		adr_paths: (input.adr_paths ?? []).slice(0, 12).map(String)
	};
}

export function encodePacket(packet, maxBytes = PACKET_MAX_BYTES) {
	assertNoForbiddenKeys(packet);
	if (packet.schema !== 'harness-query/v1') throw new Error('schema は harness-query/v1');
	assertCycle(packet.cycle);
	if (!hasFacts(packet)) throw new Error('空パケットは書かない');
	const raw = `${JSON.stringify(packet)}\n`;
	const bytes = Buffer.byteLength(raw);
	if (bytes > maxBytes) throw new Error(`パケットが上限 ${maxBytes} バイトを超えた`);
	return raw;
}

export function writePacket({ root, packet }) {
	const raw = encodePacket(packet);
	const rel = `knowledge/graph/packets/${packetFileName(packet)}`;
	const abs = join(root, rel);
	mkdirSync(dirname(abs), { recursive: true });
	try {
		writeFileSync(abs, raw, { flag: 'wx' });
	} catch (e) {
		if (e && e.code === 'EEXIST') throw new Error('既存パケットの上書きは拒否');
		throw e;
	}
	return {
		path: rel,
		bytes: Buffer.byteLength(raw),
		sha256: createHash('sha256').update(raw).digest('hex')
	};
}

export function nextDispatchSeq(events, cycle, node, proposed) {
	let max = 0;
	for (const ev of events ?? []) {
		if (ev.type === 'dispatch' && ev.cycle === cycle && ev.node === node) {
			const n = Number(ev.seq);
			if (Number.isInteger(n) && n > max) max = n;
		}
	}
	const next = max + 1;
	if (proposed != null) {
		const p = Number(proposed);
		if (p !== next) throw new Error(`seq は周内で単調増加（次は ${next}）`);
		return p;
	}
	return next;
}
