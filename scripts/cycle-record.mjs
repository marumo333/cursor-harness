#!/usr/bin/env node
/** Append one graph event to knowledge/graph/events.jsonl */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const EVENTS = join(ROOT, 'knowledge', 'graph', 'events.jsonl');
const REQUIRED = join(ROOT, 'knowledge', 'graph', 'required-cycle.json');
const CYCLE_RE = /^C-\d{4}$/;
const NODE_STATES = new Set(['used', 'skipped', 'failed', 'approved']);
const EDGE_STATES = new Set(['taken', 'skipped', 'failed']);

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? process.argv[i + 1] : fallback;
}

const type = arg('type');
const cycle = arg('cycle', 'C-0001');
if (!type) {
	console.error('usage: node scripts/cycle-record.mjs --type node_state|edge_state|cycle_open [--cycle C-NNNN] ...');
	process.exit(1);
}
if (type === 'human_approved') {
	console.error('human_approved is written only by cycle-after-merge');
	process.exit(1);
}
if (!CYCLE_RE.test(cycle)) {
	console.error('--cycle must match C-NNNN');
	process.exit(1);
}

const graph = existsSync(REQUIRED) ? JSON.parse(readFileSync(REQUIRED, 'utf8')) : { nodes: [], edges: [], optional_nodes: [] };
const knownNodes = new Set([
	...(graph.nodes ?? []).map((n) => n.id),
	...(graph.optional_nodes ?? []).map((n) => n.id)
]);
const knownEdges = new Set((graph.edges ?? []).map((e) => `${e.from}>${e.to}`));

const ev = { t: new Date().toISOString(), type, cycle };
if (type === 'node_state') {
	ev.node = arg('node');
	ev.state = arg('state');
	if (!ev.node || !NODE_STATES.has(ev.state)) {
		console.error('--node and --state used|skipped|failed|approved required');
		process.exit(1);
	}
	if (!knownNodes.has(ev.node)) {
		console.error(`unknown node ${ev.node}`);
		process.exit(1);
	}
} else if (type === 'edge_state') {
	ev.from = arg('from');
	ev.to = arg('to');
	ev.state = arg('state');
	ev.reason = arg('reason', '');
	if (!ev.from || !ev.to || !EDGE_STATES.has(ev.state)) {
		console.error('--from --to --state taken|skipped|failed required');
		process.exit(1);
	}
	if (!knownEdges.has(`${ev.from}>${ev.to}`)) {
		console.error(`unknown edge ${ev.from}>${ev.to}`);
		process.exit(1);
	}
} else if (type === 'cycle_open') {
	ev.source = arg('source', 'manual');
} else {
	console.error(`unknown --type ${type}`);
	process.exit(1);
}

mkdirSync(dirname(EVENTS), { recursive: true });
appendFileSync(EVENTS, `${JSON.stringify(ev)}\n`);
console.error(`[cycle-record] ${type} ${cycle}`);
