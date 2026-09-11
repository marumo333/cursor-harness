import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeMetrics, foldCycle } from './lib/cycle-metrics.mjs';
import {
	PACKET_MAX_BYTES,
	assertAdrPaths,
	buildPacket,
	encodePacket,
	nextDispatchSeq,
	packetFileName,
	queryCatalogHits,
	writePacket
} from './lib/harness-query.mjs';

function tmpRoot() {
	const root = mkdtempSync(join(tmpdir(), 'harness-query-'));
	mkdirSync(join(root, 'knowledge', 'graph', 'packets'), { recursive: true });
	return root;
}

test('ファイル名は C-NNNN.<node>.<seq>.json でコロンを置換する', () => {
	assert.equal(packetFileName({ cycle: 'C-0010', node: 'skill:verify', seq: 1 }), 'C-0010.skill-verify.1.json');
});

test('cycle が C-NNNN 以外なら組まない', () => {
	assert.throws(
		() =>
			buildPacket({
				cycle: 'cycle-1',
				node: 'skill:verify',
				seq: 1,
				context_mode: 'isolated',
				feature: 'F-0007',
				diff_stat: '1 file'
			}),
		/C-NNNN/
	);
});

test('禁則キー learnings / conversation / decisions / session を拒否する', () => {
	for (const key of ['learnings', 'conversation', 'decisions', 'session']) {
		assert.throws(
			() =>
				encodePacket({
					schema: 'harness-query/v1',
					cycle: 'C-0010',
					node: 'skill:verify',
					seq: 1,
					context_mode: 'isolated',
					feature: 'F-0007',
					diff_stat: 'ok',
					metrics: null,
					catalog_hits: [],
					adr_paths: [],
					[key]: 'no'
				}),
			/禁則/
		);
	}
});

test('入れ子の禁則キーも拒否する', () => {
	assert.throws(
		() =>
			encodePacket({
				schema: 'harness-query/v1',
				cycle: 'C-0010',
				node: 'skill:verify',
				seq: 1,
				context_mode: 'isolated',
				feature: 'F-0007',
				diff_stat: 'ok',
				metrics: { learnings: 'no' },
				catalog_hits: [],
				adr_paths: []
			}),
		/禁則/
	);
});

test('effort / escalate を packet に載せない', () => {
	assert.throws(
		() =>
			encodePacket({
				schema: 'harness-query/v1',
				cycle: 'C-0010',
				node: 'skill:verify',
				seq: 1,
				context_mode: 'isolated',
				feature: 'F-0007',
				diff_stat: 'ok',
				metrics: null,
				catalog_hits: [],
				adr_paths: [],
				effort: 'high'
			}),
		/子キー|effort/
	);
});

test('事実の無い空パケットは書かない', () => {
	assert.throws(
		() =>
			encodePacket(
				buildPacket({
					cycle: 'C-0010',
					node: 'skill:verify',
					seq: 1,
					context_mode: 'isolated'
				})
			),
		/空/
	);
});

test('上限超過は truncate せず失敗する', () => {
	const packet = buildPacket({
		cycle: 'C-0010',
		node: 'skill:verify',
		seq: 1,
		context_mode: 'isolated',
		metrics: { pad: 'x'.repeat(PACKET_MAX_BYTES) }
	});
	assert.throws(() => encodePacket(packet), /上限/);
});

test('正当なパケットを書き sha256 を返す', () => {
	const root = tmpRoot();
	const packet = buildPacket({
		cycle: 'C-0010',
		node: 'skill:verify',
		seq: 1,
		context_mode: 'isolated',
		feature: 'F-0007',
		diff_stat: '1 file changed',
		catalog_hits: [{ id: 'ADR-0045', path: 'knowledge/decisions/0045-dispatch-context-packet.md' }],
		adr_paths: ['knowledge/decisions/0045-dispatch-context-packet.md']
	});
	const written = writePacket({ root, packet });
	const rel = 'knowledge/graph/packets/C-0010.skill-verify.1.json';
	assert.equal(written.path, rel);
	assert.equal(existsSync(join(root, rel)), true);
	const raw = readFileSync(join(root, rel));
	assert.equal(written.bytes, raw.length);
	assert.ok(written.bytes <= PACKET_MAX_BYTES);
	assert.equal(written.sha256, createHash('sha256').update(raw).digest('hex'));
	const parsed = JSON.parse(raw.toString('utf8'));
	assert.equal(parsed.schema, 'harness-query/v1');
	assert.equal(parsed.feature, 'F-0007');
	assert.ok(!('learnings' in parsed));
	assert.ok(!('effort' in parsed));
});

test('catalog_hits は最大20件、adr_paths は最大12件', () => {
	const hits = queryCatalogHits(
		{
			entities: Array.from({ length: 30 }, (_, i) => ({
				id: `E-${i}`,
				path: `knowledge/decisions/${String(i).padStart(4, '0')}.md`
			}))
		},
		{}
	);
	assert.equal(hits.length, 20);
	const packet = buildPacket({
		cycle: 'C-0010',
		node: 'skill:reflect',
		seq: 2,
		context_mode: 'packet',
		feature: 'F-0007',
		catalog_hits: hits,
		adr_paths: Array.from({ length: 20 }, (_, i) => `knowledge/decisions/${i}.md`)
	});
	assert.equal(packet.catalog_hits.length, 20);
	assert.equal(packet.adr_paths.length, 12);
});

test('dispatch seq は周内で単調増加する', () => {
	const events = [
		{ type: 'dispatch', cycle: 'C-0010', node: 'skill:verify', seq: 1 },
		{ type: 'dispatch', cycle: 'C-0010', node: 'skill:verify', seq: 2 },
		{ type: 'dispatch', cycle: 'C-0009', node: 'skill:verify', seq: 9 }
	];
	assert.equal(nextDispatchSeq(events, 'C-0010', 'skill:verify'), 3);
	assert.equal(nextDispatchSeq([], 'C-0010', 'skill:verify'), 1);
	assert.throws(() => nextDispatchSeq(events, 'C-0010', 'skill:verify', 2), /単調/);
});

test('既存 packet は上書きしない', () => {
	const root = tmpRoot();
	const packet = buildPacket({
		cycle: 'C-0010',
		node: 'skill:verify',
		seq: 1,
		context_mode: 'isolated',
		feature: 'F-0007',
		diff_stat: 'first'
	});
	writePacket({ root, packet });
	assert.throws(
		() => writePacket({ root, packet: { ...packet, diff_stat: 'SECOND' } }),
		/上書き/
	);
});

test('--adr は knowledge 配下の実在パスだけ', () => {
	const root = tmpRoot();
	mkdirSync(join(root, 'knowledge', 'decisions'), { recursive: true });
	writeFileSync(join(root, 'knowledge', 'decisions', '0045-dispatch-context-packet.md'), 'x');
	assert.throws(() => assertAdrPaths(root, ['/etc/passwd']), /knowledge/);
	assert.throws(() => assertAdrPaths(root, ['knowledge/learnings.md']), /decisions|criteria|features/);
	assertAdrPaths(root, ['knowledge/decisions/0045-dispatch-context-packet.md']);
	symlinkSync(
		join(root, 'knowledge', 'decisions', '0045-dispatch-context-packet.md'),
		join(root, 'knowledge', 'decisions', 'evil.md')
	);
	assert.throws(() => assertAdrPaths(root, ['knowledge/decisions/evil.md']), /symlink/);
});
