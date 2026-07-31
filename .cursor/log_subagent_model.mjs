#!/usr/bin/env node
// 一時検証用: subagent 起動時のモデル割当を記録する（検証後に削除）
import { readFileSync, appendFileSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let data = {};
try { data = JSON.parse(raw || '{}'); } catch {}

const line = JSON.stringify({
  subagent_type: data.subagent_type ?? data.subagentType ?? null,
  subagent_model: data.subagent_model ?? data.subagentModel ?? null,
}) + '\n';
try { appendFileSync('.cursor/subagent-model.log', line); } catch {}
process.exit(0);
