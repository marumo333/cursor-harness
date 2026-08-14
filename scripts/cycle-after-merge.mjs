#!/usr/bin/env node
/**
 * 人間が PR をマージしたあと: 承認を記録し、3指標を測り、必要なら次 cycle の PR を開く。
 * エージェントは起動しない（ADR 0033）。上限は policy/cycle.rego。
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
const CYCLE_RE = /^C-\d{4}$/;

const dryRun = process.argv.includes('--dry-run');
const assumeOpenPr = dryRun && process.argv.includes('--assume-open-pr');
const rawMergeSha = String(process.env.MERGE_SHA || '');
if (rawMergeSha && !/^[0-9a-f]{7,40}$/i.test(rawMergeSha)) {
	console.error('[cycle-after-merge] MERGE_SHA は 7〜40 桁の十六進のみ');
	process.exit(1);
}
const mergeSha = rawMergeSha;
const prNumber = String(process.env.PR_NUMBER || '').replace(/[^\d]/g, '');
const humanApproved = process.env.MERGED === 'true';

function events() {
	if (!existsSync(EVENTS)) return [];
	const out = [];
	for (const line of readFileSync(EVENTS, 'utf8').split('\n').filter(Boolean)) {
		try {
			out.push(JSON.parse(line));
		} catch {
			console.error('[cycle-after-merge] events.jsonl に壊れた行がある。書き換えを拒否する');
			process.exit(1);
		}
	}
	return out;
}

function pendingFeatures() {
	if (!existsSync(FEATURES)) return 0;
	return readdirSync(FEATURES).filter((n) => {
		if (!/^F-\d{4}-.+\.ya?ml$/.test(n)) return false;
		const text = readFileSync(join(FEATURES, n), 'utf8');
		return /^\s*status:\s*(proposed|admitted|in_progress)\s*$/m.test(text);
	}).length;
}

function pendingFollowups() {
	if (!existsSync(FEATURES)) return 0;
	return readdirSync(FEATURES).filter((n) => {
		if (!/^F-\d{4}-cycle-followup\.ya?ml$/.test(n)) return false;
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
	const value = JSON.parse(out).result?.[0]?.expressions?.[0]?.value;
	if (!Array.isArray(value)) {
		console.error('[cycle-after-merge] cycle.admission.deny が配列を返さなかった。欠落で通すことを拒否する');
		process.exit(1);
	}
	return value;
}

function openCyclePrExists() {
	if (assumeOpenPr) return true;
	if (dryRun) return false;
	try {
		const out = execFileSync(
			'gh',
			['pr', 'list', '--state', 'open', '--limit', '1000', '--json', 'headRefName'],
			{ encoding: 'utf8', cwd: ROOT }
		);
		const prs = JSON.parse(out);
		return prs.some((p) => String(p.headRefName || '').startsWith('cycle/'));
	} catch {
		return true;
	}
}

const evs = events();
const rawCycle = process.env.CYCLE_ID || latestOpenCycle(evs);
const cycleId = CYCLE_RE.test(rawCycle) ? rawCycle : 'C-0001';
const required = JSON.parse(readFileSync(join(ROOT, 'knowledge/graph/required-cycle.json'), 'utf8'));
const folded = foldCycle(evs, cycleId);
const metrics = computeMetrics(required, folded);
const pending = pendingFeatures();
const followups = pendingFollowups();
const openPr = openCyclePrExists();

const deny = evalDeny({
	action: 'open_next',
	current_cycle: { human_approved: humanApproved },
	open_cycle_pr: openPr,
	pending_features: pending,
	pending_followups: followups,
	metrics: {
		node_skip_rate: metrics.node_skip_rate,
		edge_skip_rate: metrics.edge_skip_rate,
		state_integrity: metrics.state_integrity,
		has_failed: metrics.has_failed
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
console.log(JSON.stringify({ cycle: cycleId, metrics, pending, followups, openPr, deny, recurse }, null, 2));

if (dryRun) process.exit(0);

mkdirSync(dirname(EVENTS), { recursive: true });
const next = [...evs];
if (humanApproved) next.push(rec);

if (!recurse) {
	writeFileSync(EVENTS, `${next.map((e) => JSON.stringify(e)).join('\n')}\n`);
	console.error(`[cycle-after-merge] 再起しない: ${JSON.stringify(deny)}`);
	process.exit(0);
}

const nxt = nextCycleId(cycleId);
if (!CYCLE_RE.test(nxt)) {
	console.error(`[cycle-after-merge] 次 cycle id が不正: ${nxt}`);
	process.exit(1);
}
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
  title: 人間承認後のサイクル続き（${cycleId} から ${nxt}）
  kind: harness-grow
  status: proposed
  source: audit
  created: '${new Date().toISOString().slice(0, 10)}'
  learning_refs:
    - knowledge/learnings.md
  problem: >
    前サイクル ${cycleId} がマージされた（sha ${mergeSha || '不明'}）。
    ノード省略率=${metrics.node_skip_rate} 辺省略率=${metrics.edge_skip_rate}
    状態完全性=${metrics.state_integrity} 失敗あり=${metrics.has_failed}。
    省略または失敗した必須 skill を再実行する。
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
console.error(`[cycle-after-merge] ${slug} を起票し ${nxt} を開いた`);
