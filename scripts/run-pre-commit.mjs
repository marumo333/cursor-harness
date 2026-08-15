#!/usr/bin/env node
import { runPreCommit } from './lib/run-pre-commit.mjs';

const r = runPreCommit();
if (!r.ok) {
	console.error(r.message);
	process.exit(1);
}
process.exit(0);
