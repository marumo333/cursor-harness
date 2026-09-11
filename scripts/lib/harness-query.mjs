import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const PACKET_MAX_BYTES = 32768;
export const FORBIDDEN_KEYS = new Set([
	'learnings',
	'conversation',
	'decisions',
	'session',
	'effort',
	'escalate'
]);
const CYCLE_RE = /^C-\d{4}$/;
const MODES = new Set(['isolated', 'packet']);

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
				const kind = k === 'effort' || k === 'escalate' ? '子キー' : '禁則';
				throw new Error(`${kind}キー ${k} はパケットに置けない`);
			}
			assertNoForbiddenKeys(v, path ? `${path}.${k}` : k);
		}
	}
}

function hasFacts(packet) {
	if (packet.feature) return true;
	if (String(packet.diff_stat ?? '').trim()) return true;
	if (packet.metrics && typeof packet.metrics === 'object' && Object.keys(packet.metrics).length > 0) {
		return true;
	}
	if ((packet.catalog_hits ?? []).length > 0) return true;
	if ((packet.adr_paths ?? []).length > 0) return true;
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
		diff_stat: input.diff_stat ?? '',
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
	writeFileSync(abs, raw);
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
