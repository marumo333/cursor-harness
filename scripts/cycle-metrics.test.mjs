import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeMetrics, foldCycle, latestOpenCycle, nextCycleId } from './lib/cycle-metrics.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const required = JSON.parse(readFileSync(join(ROOT, 'knowledge/graph/required-cycle.json'), 'utf8'));

test('全部省略なら Feature を起票する', () => {
	const m = computeMetrics(required, {
		nodes: Object.fromEntries(required.nodes.map((n) => [n.id, 'skipped'])),
		edges: Object.fromEntries(required.edges.map((e) => [`${e.from}>${e.to}`, 'skipped']))
	});
	assert.equal(m.node_skip_rate, 1);
	assert.equal(m.edge_skip_rate, 1);
	assert.equal(m.state_integrity, 1);
	assert.equal(m.should_file_feature, true);
});

test('全部使用なら緑', () => {
	const m = computeMetrics(required, {
		nodes: Object.fromEntries(required.nodes.map((n) => [n.id, 'used'])),
		edges: Object.fromEntries(required.edges.map((e) => [`${e.from}>${e.to}`, 'taken']))
	});
	assert.equal(m.node_skip_rate, 0);
	assert.equal(m.edge_skip_rate, 0);
	assert.equal(m.state_integrity, 1);
	assert.equal(m.has_failed, false);
	assert.equal(m.should_file_feature, false);
});

test('全部失敗は緑ではない', () => {
	const m = computeMetrics(required, {
		nodes: Object.fromEntries(required.nodes.map((n) => [n.id, 'failed'])),
		edges: Object.fromEntries(required.edges.map((e) => [`${e.from}>${e.to}`, 'failed']))
	});
	assert.equal(m.has_failed, true);
	assert.equal(m.node_skip_rate, 0);
	assert.equal(m.should_file_feature, true);
});

test('状態欠落は完全性を下げる', () => {
	const m = computeMetrics(required, { nodes: { 'skill:verify': 'used' }, edges: {} });
	assert.ok(m.state_integrity < 1);
	assert.equal(m.should_file_feature, true);
});

test('foldCycle は jsonl を読む', () => {
	const folded = foldCycle(
		[
			{ cycle: 'C-0001', type: 'node_state', node: 'skill:verify', state: 'used' },
			{ cycle: 'C-0001', type: 'edge_state', from: 'skill:verify', to: 'skill:reflect', state: 'skipped' },
			{ cycle: 'C-0001', type: 'human_approved', merge_sha: 'abc' },
			{ cycle: 'C-0002', type: 'node_state', node: 'skill:verify', state: 'skipped' }
		],
		'C-0001'
	);
	assert.equal(folded.nodes['skill:verify'], 'used');
	assert.equal(folded.edges['skill:verify>skill:reflect'], 'skipped');
	assert.equal(folded.human_approved, true);
});

test('latestOpenCycle は承認済み id を飛ばす', () => {
	assert.equal(
		latestOpenCycle([
			{ type: 'cycle_open', cycle: 'C-0001' },
			{ type: 'human_approved', cycle: 'C-0001' },
			{ type: 'cycle_open', cycle: 'C-0002' }
		]),
		'C-0002'
	);
	assert.equal(nextCycleId('C-0002'), 'C-0003');
});
