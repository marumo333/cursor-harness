#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeMetrics, foldCycle } from './lib/cycle-metrics.mjs';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const cycleId = process.argv.includes('--cycle')
	? process.argv[process.argv.indexOf('--cycle') + 1]
	: 'C-0001';

const required = JSON.parse(readFileSync(join(ROOT, 'knowledge/graph/required-cycle.json'), 'utf8'));
const raw = readFileSync(join(ROOT, 'knowledge/graph/events.jsonl'), 'utf8')
	.split('\n')
	.filter(Boolean)
	.map((l) => JSON.parse(l));
const metrics = computeMetrics(required, foldCycle(raw, cycleId));
console.log(JSON.stringify({ cycle: cycleId, ...metrics }, null, 2));
