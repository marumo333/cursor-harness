import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPacket, writePacket } from './lib/harness-query.mjs';
import { assertDispatchPolicy, buildDispatchPolicyInput, roleFor } from './lib/packet-policy.mjs';

const WORKSPACE = join(dirname(fileURLToPath(import.meta.url)), '..');

function tmpRoot() {
	const root = mkdtempSync(join(tmpdir(), 'packet-policy-'));
	mkdirSync(join(root, 'knowledge', 'graph', 'packets'), { recursive: true });
	mkdirSync(join(root, 'knowledge', 'graph'), { recursive: true });
	writeFileSync(
		join(root, 'knowledge', 'graph', 'required-cycle.json'),
		JSON.stringify({
			nodes: [
				{ id: 'skill:verify', kind: 'skill', context_mode: 'isolated' },
				{ id: 'skill:adversarial-review', kind: 'skill', context_mode: 'isolated' }
			],
			optional_nodes: []
		})
	);
	return root;
}

test('verify の役割は gate、Muse 第3は adversarial-review だけ', () => {
	assert.equal(roleFor('skill:verify', 'opus'), 'gate');
	assert.equal(roleFor('skill:adversarial-review', 'muse'), 'third');
	assert.equal(roleFor('skill:harness-api-budget', 'opus'), 'parent');
});

test('sha256 不一致と欠落パケットは dispatch を拒否する', () => {
	const root = tmpRoot();
	const packet = buildPacket({
		cycle: 'C-0010',
		node: 'skill:verify',
		seq: 1,
		context_mode: 'isolated',
		feature: 'F-0007',
		diff_stat: '1 file'
	});
	const written = writePacket({ root, packet });
	assert.throws(
		() =>
			assertDispatchPolicy({
				root,
				policyDir: join(WORKSPACE, 'policy'),
				dispatch: {
					cycle: 'C-0010',
					node: 'skill:verify',
					seq: 1,
					seat: 'opus',
					escalate: 'trio',
					sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
				},
				canon_path_count: 1
			}),
		/sha256/
	);
	assert.throws(
		() =>
			assertDispatchPolicy({
				root,
				policyDir: join(WORKSPACE, 'policy'),
				dispatch: {
					cycle: 'C-0010',
					node: 'skill:reflect',
					seq: 1,
					seat: 'opus',
					escalate: 'stay',
					sha256: written.sha256
				},
				canon_path_count: 0
			}),
		/packet|ノード/
	);
	assert.equal(written.bytes > 0, true);
});

test('ゲートに Muse / stay / 下げ effort を同時に置くと deny', () => {
	const root = tmpRoot();
	const packet = buildPacket({
		cycle: 'C-0010',
		node: 'skill:verify',
		seq: 1,
		context_mode: 'isolated',
		feature: 'F-0007',
		diff_stat: '1 file'
	});
	const written = writePacket({ root, packet });
	assert.throws(
		() =>
			assertDispatchPolicy({
				root,
				policyDir: join(WORKSPACE, 'policy'),
				dispatch: {
					cycle: 'C-0010',
					node: 'skill:verify',
					seq: 1,
					seat: 'muse',
					effort: 'medium',
					escalate: 'stay',
					sha256: written.sha256
				},
				canon_path_count: 1
			}),
		/deny|Muse|stay|effort/
	);
});

test('導出 input は自己申告フラグを使わない', () => {
	const input = buildDispatchPolicyInput({
		packet: {
			schema: 'harness-query/v1',
			cycle: 'C-0010',
			node: 'skill:verify',
			seq: 1,
			context_mode: 'isolated'
		},
		packet_bytes: 10,
		packet_sha256: 'aa',
		dispatch: {
			cycle: 'C-0010',
			node: 'skill:verify',
			seq: 1,
			seat: 'muse',
			escalate: 'stay',
			sha256: 'aa',
			context_mode: 'isolated'
		},
		required_mode: 'isolated',
		canon_path_count: 2,
		child_keys: []
	});
	assert.equal(input.trio_third, false);
	assert.deepEqual(input.effort_allow, ['high']);
	assert.equal(input.role_swap_to_opus, false);
});
