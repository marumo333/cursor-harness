import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { packetFileName } from './harness-query.mjs';

const WORKSPACE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ROLE_BY_NODE = {
	'skill:harness-api-budget': 'parent',
	'skill:adversarial-review': 'review',
	'skill:verify': 'gate',
	'skill:reflect': 'gate',
	'skill:plan-confirm': 'gate',
	'skill:harness-grow': 'gate'
};

const EFFORT_ALLOW = {
	parent: ['medium', 'high'],
	implement: ['medium', 'high'],
	gate: ['high'],
	review: ['high'],
	third: ['medium'],
	ceiling: ['high']
};

export function roleFor(node, seat) {
	if (node === 'skill:adversarial-review' && seat === 'muse') return 'third';
	if (node === 'skill:harness-api-budget' && seat === 'opus') return 'parent';
	return ROLE_BY_NODE[node] ?? 'implement';
}

export function effortAllowFor(role) {
	return EFFORT_ALLOW[role] ?? ['high'];
}

export function loadRequiredCycle(root) {
	const abs = join(root, 'knowledge', 'graph', 'required-cycle.json');
	if (!existsSync(abs)) throw new Error('required-cycle.json が無い');
	return JSON.parse(readFileSync(abs, 'utf8'));
}

export function knownNodes(graph) {
	return new Set([...(graph.nodes ?? []).map((n) => n.id), ...(graph.optional_nodes ?? []).map((n) => n.id)]);
}

export function requiredModeFor(graph, node) {
	const all = [...(graph.nodes ?? []), ...(graph.optional_nodes ?? [])];
	const hit = all.find((n) => n.id === node);
	if (!hit) throw new Error(`未知のノード ${node}`);
	if (hit.context_mode !== 'isolated' && hit.context_mode !== 'packet') {
		throw new Error(`ノード ${node} の context_mode が不正`);
	}
	return hit.context_mode;
}

export function buildDispatchPolicyInput({
	packet,
	packet_bytes,
	packet_sha256,
	dispatch,
	required_mode,
	canon_path_count,
	child_keys = []
}) {
	const role = roleFor(dispatch.node, dispatch.seat);
	return {
		packet,
		packet_bytes,
		packet_sha256,
		dispatch: {
			cycle: dispatch.cycle,
			node: dispatch.node,
			seq: dispatch.seq,
			seat: dispatch.seat,
			escalate: dispatch.escalate,
			sha256: dispatch.sha256,
			context_mode: dispatch.context_mode ?? packet.context_mode,
			...(dispatch.effort ? { effort: dispatch.effort } : {})
		},
		writer: 'parent',
		child_keys,
		effort_allow: effortAllowFor(role),
		effort_default: effortAllowFor(role)[0],
		canon_path_count,
		required_mode,
		trio_third: dispatch.node === 'skill:adversarial-review' && dispatch.seat === 'muse',
		ceiling_replaces_gate:
			dispatch.escalate === 'ceiling' && (dispatch.node === 'skill:verify' || dispatch.node === 'skill:reflect'),
		role_swap_to_opus: (role === 'parent' || role === 'implement') && dispatch.seat === 'opus'
	};
}

function opaBin() {
	const pinned = join(WORKSPACE, '.tools', 'opa');
	if (!existsSync(pinned)) throw new Error('OPA が .tools/opa に無い');
	return pinned;
}

export function evalPacketDeny(input, policyDir = join(WORKSPACE, 'policy')) {
	const opa = opaBin();
	const dir = mkdtempSync(join(tmpdir(), 'packet-opa-'));
	const inputFile = join(dir, 'input.json');
	writeFileSync(inputFile, JSON.stringify(input));
	try {
		const out = execFileSync(opa, ['eval', '-f', 'json', '-d', policyDir, '--input', inputFile, 'data.packet.canon.deny'], {
			encoding: 'utf8'
		});
		const parsed = JSON.parse(out);
		const value = parsed.result?.[0]?.expressions?.[0]?.value;
		if (!Array.isArray(value)) throw new Error('packet.canon.deny が配列ではない');
		return value;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

export function assertDispatchPolicy({ root, policyDir, dispatch, canon_path_count, child_keys = [] }) {
	const graph = loadRequiredCycle(root);
	if (!knownNodes(graph).has(dispatch.node)) throw new Error(`未知のノード ${dispatch.node}`);
	const required_mode = requiredModeFor(graph, dispatch.node);
	const rel = `knowledge/graph/packets/${packetFileName(dispatch)}`;
	const abs = join(root, rel);
	if (!existsSync(abs)) throw new Error(`packet が無い: ${rel}`);
	const raw = readFileSync(abs);
	const packet_sha256 = createHash('sha256').update(raw).digest('hex');
	if (packet_sha256 !== dispatch.sha256) throw new Error('sha256 が packet と一致しない');
	const packet = JSON.parse(raw.toString('utf8'));
	const input = buildDispatchPolicyInput({
		packet,
		packet_bytes: raw.length,
		packet_sha256,
		dispatch: { ...dispatch, context_mode: packet.context_mode, cycle: dispatch.cycle ?? packet.cycle },
		required_mode,
		canon_path_count,
		child_keys
	});
	const deny = evalPacketDeny(input, policyDir);
	if (deny.length) throw new Error(`packet.canon deny: ${deny.join('; ')}`);
	return { input, deny, required_mode, packet };
}

export function countCanonPaths(root, policyDir = join(WORKSPACE, 'policy')) {
	let diff = [];
	try {
		diff = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--name-only', 'origin/main'], {
			encoding: 'utf8',
			cwd: root
		})
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
	} catch {
		diff = [];
	}
	if (!diff.length) return 0;
	try {
		const paths = evalHarnessCanonPaths(diff, policyDir);
		return Array.isArray(paths) ? paths.length : diff.length;
	} catch {
		return diff.length;
	}
}

function evalHarnessCanonPaths(diff_paths, policyDir) {
	const opa = opaBin();
	const dir = mkdtempSync(join(tmpdir(), 'canon-opa-'));
	const inputFile = join(dir, 'input.json');
	writeFileSync(inputFile, JSON.stringify({ diff_paths }));
	try {
		const out = execFileSync(opa, ['eval', '-f', 'json', '-d', policyDir, '--input', inputFile, 'data.harness.canon.paths'], {
			encoding: 'utf8'
		});
		const parsed = JSON.parse(out);
		return parsed.result?.[0]?.expressions?.[0]?.value;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
