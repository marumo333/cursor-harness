#!/usr/bin/env node
/**
 * Resolve an OPA binary. Downloads a pinned static build into .tools/ when missing.
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OPA_VERSION = '1.8.0';
const TOOLS = join(ROOT, '.tools');

function archTriple() {
	const arch = process.arch;
	if (arch === 'x64') return 'amd64';
	if (arch === 'arm64') return 'arm64';
	throw new Error(`unsupported process.arch for OPA: ${arch}`);
}

function downloadUrl() {
	const arch = archTriple();
	return `https://github.com/open-policy-agent/opa/releases/download/v${OPA_VERSION}/opa_linux_${arch}_static`;
}

export function ensureOpa() {
	if (process.env.OPA_BIN && existsSync(process.env.OPA_BIN)) return process.env.OPA_BIN;
	const local = join(TOOLS, 'opa');
	if (existsSync(local)) return local;
	try {
		const which = execFileSync('which', ['opa'], { encoding: 'utf8' }).trim();
		if (which) return which;
	} catch {
		// not on PATH
	}
	mkdirSync(TOOLS, { recursive: true });
	const url = downloadUrl();
	execFileSync('curl', ['-fsSL', '-o', local, url], { stdio: 'inherit' });
	chmodSync(local, 0o755);
	const ver = execFileSync(local, ['version'], { encoding: 'utf8' });
	if (!ver.includes(OPA_VERSION)) {
		console.error(`[ensure-opa] unexpected version:\n${ver}`);
	}
	return local;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const bin = ensureOpa();
	console.log(bin);
}
