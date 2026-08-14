#!/usr/bin/env node
/**
 * After a human merges a PR: record approval, measure 3 metrics, maybe open the next cycle PR.
 * Does not start an agent (ADR 0033). Bounded by policy/cycle.rego.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureOpa } from './ensure-opa.mjs';
import { computeMetrics, foldCycle, latestOpenCycle, nextCycleId } from './lib/cycle-metrics.mjs';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const FEATURES = join(ROOT, 'knowledge', 'features');
const EVENTS = join(ROOT, 'knowledge', 'graph', 'events.jsonl');
const POLICY = process.env.OPA_POLICY_DIR || join(ROOT, 'policy');

const dryRun = process.argv.includes('--dry-run');
const assumeOpenPr = process.argv.includes('--assume-open-pr');
const assumeNoOpenPr = process.argv.includes('--assume-no-open-pr');
const mergeSha = process.env.MERGE_SHA || '';
const prNumber = process.env.PR_NUMBER || '';

function events() {
	if (!existsSync(EVENTS)) return [];
	return readFileSync(EVENTS, 'utf8')
		.split('\n')
		.filter(Boolean)
		.map((l) => JSON.parse(l));
}

function pendingFeatures() {
	if (!existsSync(FEATURES)) return 0;
	return readdirSync(FEATURES).filter((n) => {
		if (!/^F-\d{4}-.+\.ya?ml$/.test(n)) return false;
		const text = readFileSync(join(FEATURES, n), 'utf8');
		return /^\s*status:\s*(proposed|admitted|in_progress)\s*$/m.test(text);
	}).length;
}

function nextFeatureId() {
	const ids = existsSync(FEATURES)
		? readdirSync(FEATURES)
				.map((n) => n.match(/^F-(\d{4})-/))
				.filter(Boolean)
				.map((m) => Number(m[1]))
		: [];
	const n = (ids.length ? Math.max(...ids) : 0) + 1;
	return `F-${String(n).padStart(4, '0')}`;
}

function evalDeny(input) {
	const opa = ensureOpa();
	const dir = join(ROOT, '.tools');
	mkdirSync(dir, { recursive: true });
	const inputFile = join(dir, 'cycle-input.json');
	writeFileSync(inputFile, JSON.stringify(input));
	const out = execFileSync(opa, ['eval', '-f', 'json', '-d', POLICY, '--input', inputFile, 'data.cycle.admission.deny'], {
		encoding: 'utf8'
	});
	return JSON.parse(out).result?.[0]?.expressions?.[0]?.value ?? [];
}

function openCyclePrExists() {
	if (assumeOpenPr) return true;
	if (assumeNoOpenPr || dryRun) return false;
	try {
		const out = execFileSync('gh', ['pr', 'list', '--state', 'open', '--json', 'headRefName'], {
			encoding: 'utf8',
			cwd: ROOT
		});
		const prs = JSON.parse(out);
		return prs.some((p) => String(p.headRefName || '').startsWith('cycle/'));
	} catch {
		// fail closed: cannot prove there is no open cycle PR
		return true;
	}
}

const evs = events();
const cycleId = process.env.CYCLE_ID || latestOpenCycle(evs);
const required = JSON.parse(readFileSync(join(ROOT, 'knowledge/graph/required-cycle.json'), 'utf8'));
const folded = foldCycle(evs, cycleId);
folded.human_approved = true;
const metrics = computeMetrics(required, folded);
const pending = pendingFeatures();
const openPr = openCyclePrExists();

const deny = evalDeny({
	action: 'open_next',
	current_cycle: { human_approved: true },
	open_cycle_pr: openPr,
	pending_features: pending,
	metrics: {
		node_skip_rate: metrics.node_skip_rate,
		edge_skip_rate: metrics.edge_skip_rate,
		state_integrity: metrics.state_integrity
	}
});

const rec = {
	t: new Date().toISOString(),
	type: 'human_approved',
	cycle: cycleId,
	merge_sha: mergeSha,
	pr: prNumber
};

const recurse = deny.length === 0;
console.log(JSON.stringify({ cycle: cycleId, metrics, pending, openPr, deny, recurse }, null, 2));

if (dryRun) process.exit(0);

mkdirSync(dirname(EVENTS), { recursive: true });
const next = [];
next.push(...evs, rec);

if (!recurse) {
	writeFileSync(EVENTS, `${next.map((e) => JSON.stringify(e)).join('\n')}\n`);
	console.error(`[cycle-after-merge] no recurse: ${JSON.stringify(deny)}`);
	process.exit(0);
}

const nxt = nextCycleId(cycleId);
next.push({
	t: new Date().toISOString(),
	type: 'cycle_open',
	cycle: nxt,
	source: 'after-merge',
	from: cycleId
});
writeFileSync(EVENTS, `${next.map((e) => JSON.stringify(e)).join('\n')}\n`);

const id = nextFeatureId();
const slug = `${id}-cycle-followup.yaml`;
const body = `feature:
  id: ${id}
  title: Cycle follow-up after human approve (${cycleId} → ${nxt})
  kind: harness-grow
  status: proposed
  source: audit
  created: '${new Date().toISOString().slice(0, 10)}'
  learning_refs:
    - knowledge/learnings.md
  problem: >
    Previous cycle ${cycleId} was merged (sha ${mergeSha || 'unknown'}) with
    node_skip_rate=${metrics.node_skip_rate} edge_skip_rate=${metrics.edge_skip_rate}
    state_integrity=${metrics.state_integrity}. Re-run skipped required skills.
  proposed_change:
    mutates_canon: false
    paths:
      - knowledge/graph/
      - knowledge/learnings.md
  evidence:
    adversarial_review: not_required
    review_agent: none
    verification: pending
    opa_decision: pending
  constraints:
    supersede_adr: false
    no_jp_code_merge_write: true
    supersedes: []
`;
writeFileSync(join(FEATURES, slug), body);
console.error(`[cycle-after-merge] filed ${slug} and opened ${nxt}`);
