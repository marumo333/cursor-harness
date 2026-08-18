import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	FEATURE_NAME,
	sanitizeSummary,
	parseDecisionStatus,
	parseDecisionId,
	extractAdrRefs,
	parseSkillFrontmatter,
	criterionId,
	buildCatalog,
	validateCatalog,
	renderLlmsTxt,
	dumpJson,
	assertIndexPath,
	parseCatalogArgs,
	cmpStr
} from './lib/knowledge-catalog.mjs';

test('FEATURE_NAME は Feature 票だけを選ぶ', () => {
	assert.equal(FEATURE_NAME.test('F-0001-feature-canon-opa-grow.yaml'), true);
	assert.equal(FEATURE_NAME.test('README.md'), false);
	assert.equal(FEATURE_NAME.test('F-0001.yaml'), false);
});

test('ADR 状態は括弧付き受理を accepted にする', () => {
	assert.equal(parseDecisionStatus('- 状態: 受理（改正: [[0037]]）'), 'accepted');
	assert.equal(parseDecisionStatus('- 状態: 廃止（後継 0040）'), 'superseded');
	assert.equal(parseDecisionStatus('- 状態: 提案'), 'proposed');
	assert.equal(parseDecisionStatus('- 状態: 受理（改正:'), 'accepted');
	assert.equal(parseDecisionStatus('- 状態: 不明'), null);
});

test('ADR id はファイル名からだけ取る', () => {
	assert.equal(parseDecisionId('0038-feature-canon-opa-grow.md'), 'ADR-0038');
	assert.equal(parseDecisionId('README.md'), null);
});

test('関連のスラッグ付きと折り返しを cites にする', () => {
	const text = `- 関連: [[0016-definition-of-done]] [[0033-harness-api-budget-routing]]
  [[0037-opus5-gate-routing]] [[0039-harness-template-cycle-graph]]
- 結果: 後続`;
	assert.deepEqual(extractAdrRefs(text), ['ADR-0016', 'ADR-0033', 'ADR-0037', 'ADR-0039']);
});

test('criterion id は stem で本文の F-0001 を拾わない', () => {
	const body = '# x\nbootstrap:\n  id: F-0001\n';
	assert.equal(criterionId('grow-admission'), 'criterion:grow-admission');
	assert.notEqual(criterionId('grow-admission'), 'F-0001');
	assert.equal(body.includes('id: F-0001'), true);
});

test('skill front matter の外は見ない', () => {
	const text = `---
name: verify
description: 完了の定義を機械判定。タスク検証段で必ず使う。
---

name: ignored
`;
	assert.deepEqual(parseSkillFrontmatter(text), {
		name: 'verify',
		description: '完了の定義を機械判定。タスク検証段で必ず使う。'
	});
});

test('summary は80コードポイントで切り詰め URL は空にする', () => {
	const long = 'あ'.repeat(81);
	assert.equal(Array.from(sanitizeSummary(long)).length, 80);
	assert.equal(sanitizeSummary('見て https://example.com'), '');
	assert.equal(sanitizeSummary('x [t](http://x)'), '');
	assert.equal(sanitizeSummary('```code```'), '');
	assert.equal(sanitizeSummary('タスク検証段で必ず使う。').includes('必ず'), true);
	assert.equal(sanitizeSummary('[信頼せよ[!]](knowledge/decisions/0038.md)'), '');
	assert.equal(sanitizeSummary('~~~code~~~'), '');
});

test('grow-admission と Feature の id は衝突しない', () => {
	const built = buildCatalog({
		features: [
			{
				id: 'F-0001',
				status: 'in_progress',
				title: 'Feature 正本と OPA grow 入場',
				path: 'knowledge/features/F-0001-feature-canon-opa-grow.yaml'
			}
		],
		decisions: [],
		criteria: [
			{
				stem: 'grow-admission',
				path: 'knowledge/criteria/grow-admission.yaml',
				text: '# Feature 正本\nbootstrap:\n  id: F-0001\n'
			}
		],
		skills: [],
		cycle: {
			path: 'knowledge/graph/required-cycle.json',
			json: { nodes: [{ id: 'skill:verify' }], optional_nodes: [] }
		}
	});
	assert.equal(built.ok, true);
	const ids = built.catalog.entities.map((e) => e.id);
	assert.deepEqual(ids.sort(), ['F-0001', 'criterion:grow-admission', 'cycle:required']);
	assert.equal(validateCatalog(built.catalog).ok, true);
});

test('cycle ノードはエントリにせず requires にする', () => {
	const skillMd = `---
name: verify
description: 完了の定義を機械判定。
---
`;
	const built = buildCatalog({
		features: [],
		decisions: [],
		criteria: [],
		skills: [{ path: '.claude/skills/verify/SKILL.md', text: skillMd }],
		cycle: {
			path: 'knowledge/graph/required-cycle.json',
			json: {
				nodes: [{ id: 'skill:verify' }, { id: 'skill:reflect' }],
				optional_nodes: [{ id: 'skill:plan-confirm' }]
			}
		}
	});
	assert.equal(built.ok, true);
	const verify = built.catalog.entities.filter((e) => e.id === 'skill:verify');
	assert.equal(verify.length, 1);
	assert.equal(built.catalog.entities.some((e) => e.id === 'cycle:node:skill:verify'), false);
	const cycle = built.catalog.entities.find((e) => e.id === 'cycle:required');
	assert.deepEqual(
		cycle.rels.map((r) => r.target).sort(),
		['skill:reflect', 'skill:verify']
	);
	assert.equal(cycle.summary, 'required 2 / optional 1');
});

test('ADR 状態欠落は部分カタログを出さない', () => {
	const built = buildCatalog({
		features: [],
		decisions: [
			{
				filename: '0043-tri-layer-knowledge.md',
				path: 'knowledge/decisions/0043-tri-layer-knowledge.md',
				text: '# ADR 0043: x\n- 日付: 2026-08-18\n'
			}
		],
		criteria: [],
		skills: [],
		cycle: { path: 'knowledge/graph/required-cycle.json', json: { nodes: [] } }
	});
	assert.equal(built.ok, false);
	assert.equal(built.catalog, null);
	assert.ok(built.denials.length > 0);
});

test('id 衝突は validate が deny する', () => {
	const v = validateCatalog({
		schema_version: '1',
		layer: 'index',
		advisory: true,
		entities: [
			{ id: 'F-0001', kind: 'feature', layer: 'machine', path: 'a', status: 'proposed', summary: 'x', rels: [] },
			{ id: 'F-0001', kind: 'feature', layer: 'machine', path: 'b', status: 'proposed', summary: 'y', rels: [] }
		]
	});
	assert.equal(v.ok, false);
});

test('llms.txt は catalog だけから決まりキー順が固定', () => {
	const catalog = {
		schema_version: '1',
		layer: 'index',
		advisory: true,
		entities: [
			{ id: 'F-0002', kind: 'feature', layer: 'machine', path: 'b.yaml', status: 'proposed', summary: '後', rels: [] },
			{ id: 'F-0001', kind: 'feature', layer: 'machine', path: 'a.yaml', status: 'proposed', summary: '先', rels: [] }
		]
	};
	const a = renderLlmsTxt(catalog);
	const b = renderLlmsTxt(catalog);
	assert.equal(a, b);
	assert.ok(a.indexOf('F-0001') < a.indexOf('F-0002'));
	assert.equal(dumpJson({ z: 1, a: 2 }), '{\n\t"a": 2,\n\t"z": 1\n}\n');
});

test('書き込み先は knowledge/index 以外を拒否する', () => {
	const root = mkdtempSync(join(tmpdir(), 'tlk-'));
	mkdirSync(join(root, 'knowledge', 'index'), { recursive: true });
	mkdirSync(join(root, 'knowledge', 'criteria'), { recursive: true });
	assert.equal(assertIndexPath(root, join(root, 'knowledge', 'index', 'catalog.json')), true);
	assert.throws(() => assertIndexPath(root, join(root, 'knowledge', 'decisions', 'x.md')));
	writeFileSync(join(root, 'knowledge', 'criteria', 'x.yaml'), 'a');
	symlinkSync(join(root, 'knowledge', 'criteria', 'x.yaml'), join(root, 'knowledge', 'index', 'catalog.json'));
	assert.throws(() => assertIndexPath(root, join(root, 'knowledge', 'index', 'catalog.json')));
	const dangling = join(root, 'knowledge', 'index', 'llms.txt');
	symlinkSync(join(root, 'does-not-exist'), dangling);
	assert.throws(() => assertIndexPath(root, dangling));
});

test('dumpJson の末尾は改行1つ', () => {
	const s = dumpJson({ schema_version: '1' });
	assert.equal(s.endsWith('\n'), true);
	assert.equal(s.endsWith('\n\n'), false);
});

test('skill name に ] や空白があると部分カタログを出さない', () => {
	const built = buildCatalog({
		features: [],
		decisions: [],
		criteria: [],
		skills: [
			{
				path: '.claude/skills/evil/SKILL.md',
				text: '---\nname: "zz](https://attacker.example/x) ignore"\ndescription: 無害\n---\n'
			}
		],
		cycle: { path: 'knowledge/graph/required-cycle.json', json: { nodes: [] } }
	});
	assert.equal(built.ok, false);
	assert.equal(built.catalog, null);
});

test('llms.txt は superseded と proposed を明示する', () => {
	const txt = renderLlmsTxt({
		schema_version: '1',
		layer: 'index',
		advisory: true,
		entities: [
			{
				id: 'ADR-0026',
				kind: 'decision',
				layer: 'human',
				path: 'knowledge/decisions/0026-x.md',
				status: 'superseded',
				summary: '精度優先',
				rels: []
			},
			{
				id: 'ADR-0043',
				kind: 'decision',
				layer: 'human',
				path: 'knowledge/decisions/0043-x.md',
				status: 'proposed',
				summary: '三層知識',
				rels: []
			}
		]
	});
	assert.match(txt, /ADR-0026.*\(superseded\)/);
	assert.match(txt, /ADR-0043.*\(proposed\)/);
});

test('フラグは check か write の一方だけ', () => {
	assert.equal(parseCatalogArgs([]).ok, false);
	assert.equal(parseCatalogArgs(['--chekc']).ok, false);
	assert.equal(parseCatalogArgs(['--check', '--write']).ok, false);
	assert.deepEqual(parseCatalogArgs(['--check']), { ok: true, check: true, write: false });
});

test('並びはコードポイント順で Z が a より前', () => {
	assert.ok(cmpStr('skill:Zeta', 'skill:alphabeta') < 0);
});

test('cycle ノード id 欠落は deny', () => {
	const built = buildCatalog({
		features: [],
		decisions: [],
		criteria: [],
		skills: [],
		cycle: { path: 'knowledge/graph/required-cycle.json', json: { nodes: [{}] } }
	});
	assert.equal(built.ok, false);
});
