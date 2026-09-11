#!/usr/bin/env node
import { runCodeMode } from './lib/code-mode.mjs';

function stepsFromArgv(argv) {
	const steps = [];
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--step' && argv[i + 1]) {
			steps.push(argv[++i]);
		}
	}
	return steps;
}

const steps = stepsFromArgv(process.argv.slice(2));
try {
	const r = runCodeMode({ steps, cwd: process.cwd() });
	process.stdout.write(`${JSON.stringify(r)}\n`);
	process.exit(r.ok ? 0 : 1);
} catch (e) {
	process.stderr.write(`${e.message}\n`);
	process.exit(1);
}
