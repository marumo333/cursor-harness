#!/usr/bin/env node
/** Append one graph event to knowledge/graph/events.jsonl */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const EVENTS = join(ROOT, 'knowledge', 'graph', 'events.jsonl');

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? process.argv[i + 1] : fallback;
}

const type = arg('type');
const cycle = arg('cycle', 'C-0001');
if (!type) {
	console.error('usage: node scripts/cycle-record.mjs --type node_state|edge_state|human_approved|cycle_open [--cycle C-NNNN] ...');
	process.exit(1);
}

const ev = { t: new Date().toISOString(), type, cycle };
if (type === 'node_state') {
	ev.node = arg('node');
	ev.state = arg('state');
	if (!ev.node || !ev.state) {
		console.error('--node and --state required');
		process.exit(1);
	}
}
if (type === 'edge_state') {
	ev.from = arg('from');
	ev.to = arg('to');
	ev.state = arg('state');
	ev.reason = arg('reason', '');
	if (!ev.from || !ev.to || !ev.state) {
		console.error('--from --to --state required');
		process.exit(1);
	}
}
if (type === 'human_approved') {
	ev.merge_sha = arg('sha', '');
	ev.pr = arg('pr', '');
}

mkdirSync(dirname(EVENTS), { recursive: true });
appendFileSync(EVENTS, `${JSON.stringify(ev)}\n`);
console.error(`[cycle-record] ${type} ${cycle}`);
