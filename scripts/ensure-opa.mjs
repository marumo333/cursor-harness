#!/usr/bin/env node
/**
 * Resolve a pinned OPA binary. Downloads only the expected digest.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OPA_VERSION = '1.8.0';
const TOOLS = join(ROOT, '.tools');

/** Official opa_linux_*_static digests for v1.8.0 */
const DIGESTS = {
	linux_amd64: '1359b1bff233fc0a290066e864c75b8158e52756319757b6854df467fe7fc146',
	linux_arm64: null
};

function sha256(path) {
	return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function assertVersion(bin) {
	const ver = execFileSync(bin, ['version'], { encoding: 'utf8' });
	if (!ver.includes(`Version: ${OPA_VERSION}`)) {
		throw new Error(`[ensure-opa] refused binary (want ${OPA_VERSION}):\n${ver}`);
	}
}

function archKey() {
	if (process.platform !== 'linux') {
		throw new Error(`[ensure-opa] download is linux-only (got ${process.platform}). Set OPA_BIN to opa ${OPA_VERSION}.`);
	}
	if (process.arch === 'x64') return 'linux_amd64';
	if (process.arch === 'arm64') return 'linux_arm64';
	throw new Error(`[ensure-opa] unsupported arch ${process.arch}`);
}

function downloadUrl(key) {
	const arch = key === 'linux_amd64' ? 'amd64' : 'arm64';
	return `https://github.com/open-policy-agent/opa/releases/download/v${OPA_VERSION}/opa_linux_${arch}_static`;
}

function acceptExisting(bin) {
	assertVersion(bin);
	return bin;
}

export function ensureOpa() {
	if (process.env.OPA_BIN) {
		if (!existsSync(process.env.OPA_BIN)) {
			throw new Error(`[ensure-opa] OPA_BIN not found: ${process.env.OPA_BIN}`);
		}
		return acceptExisting(process.env.OPA_BIN);
	}
	const local = join(TOOLS, 'opa');
	if (existsSync(local)) {
		const key = archKey();
		const expected = DIGESTS[key];
		if (expected && sha256(local) !== expected) {
			unlinkSync(local);
		} else {
			return acceptExisting(local);
		}
	}
	const key = archKey();
	const expected = DIGESTS[key];
	if (!expected) {
		throw new Error(`[ensure-opa] no pinned digest for ${key}; set OPA_BIN`);
	}
	mkdirSync(TOOLS, { recursive: true });
	execFileSync('curl', ['-fsSL', '-o', local, downloadUrl(key)], { stdio: 'inherit' });
	const got = sha256(local);
	if (got !== expected) {
		unlinkSync(local);
		throw new Error(`[ensure-opa] digest mismatch: got ${got} want ${expected}`);
	}
	chmodSync(local, 0o755);
	return acceptExisting(local);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	console.log(ensureOpa());
}
