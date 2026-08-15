#!/usr/bin/env node
/**
 * ピン留めした OPA バイナリを解決する。PATH / 未検証 OPA_BIN / digest 無しキャッシュは使わない。
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.HARNESS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const OPA_VERSION = '1.8.0';
const TOOLS = join(ROOT, '.tools');

/** opa_linux_*_static v1.8.0. arm64 は未ピンのため拒否。 */
const DIGESTS = {
	linux_amd64: '1359b1bff233fc0a290066e864c75b8158e52756319757b6854df467fe7fc146'
};

function sha256(path) {
	return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function archKey() {
	if (process.platform !== 'linux') {
		throw new Error(`[ensure-opa] Linux のみ（実際は ${process.platform}）`);
	}
	if (process.arch === 'x64') return 'linux_amd64';
	throw new Error(`[ensure-opa] 未対応アーキ ${process.arch}。ピン留め digest が無い`);
}

function acceptPinned(bin, expected) {
	const got = sha256(bin);
	if (got !== expected) {
		throw new Error(`[ensure-opa] digest 不一致: 実際 ${got} 期待 ${expected}`);
	}
	const ver = execFileSync(bin, ['version'], { encoding: 'utf8' });
	if (!ver.includes(`Version: ${OPA_VERSION}`)) {
		throw new Error(`[ensure-opa] バイナリを拒否（期待 ${OPA_VERSION}）:\n${ver}`);
	}
	return bin;
}

export function ensureOpa() {
	const key = archKey();
	const expected = DIGESTS[key];
	if (!expected) throw new Error(`[ensure-opa] ${key} のピン留め digest が無い`);
	if (process.env.OPA_BIN) {
		throw new Error('[ensure-opa] OPA_BIN は受け付けない。ピン留めした .tools/opa を使う');
	}
	const local = join(TOOLS, 'opa');
	if (existsSync(local)) {
		try {
			return acceptPinned(local, expected);
		} catch {
			unlinkSync(local);
		}
	}
	mkdirSync(TOOLS, { recursive: true });
	const url = `https://github.com/open-policy-agent/opa/releases/download/v${OPA_VERSION}/opa_linux_amd64_static`;
	execFileSync('curl', ['-fsSL', '-o', local, url], { stdio: 'inherit' });
	chmodSync(local, 0o755);
	return acceptPinned(local, expected);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	console.log(ensureOpa());
}
