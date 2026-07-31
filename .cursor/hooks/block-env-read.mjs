#!/usr/bin/env node
/** Cursor beforeShellExecution / beforeReadFile → 共有ロジックへ委譲。 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const raw = readFileSync(0, 'utf8');
const r = spawnSync(process.execPath, ['.claude/hooks/block_env_read.mjs'], {
	input: raw,
	encoding: 'utf8'
});
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 0);
