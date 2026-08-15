import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBlockedEnvPath } from './blocked-env.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function runPreCommit() {
	try {
		const staged = execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf8' })
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		const badEnv = staged.find(isBlockedEnvPath);
		if (badEnv) {
			return { ok: false, message: `[pre-commit] 規約1: 実 .env(${badEnv}) をステージしています。除外してください。` };
		}
	} catch (e) {
		return { ok: false, message: `[pre-commit] staged 一覧に失敗: ${String(e && e.message)}` };
	}

	if (existsSync(join(ROOT, 'node_modules')) && existsSync(join(ROOT, 'package.json')) && existsSync(join(ROOT, 'src'))) {
		try {
			execSync('pnpm run check', { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
		} catch (e) {
			return {
				ok: false,
				message:
					'[pre-commit] 規約6: 型チェック(pnpm run check)が失敗。緑にしてから commit してください。\n' +
					String((e && (e.stdout || e.message)) || '').slice(0, 2000)
			};
		}
	}

	try {
		execSync('node scripts/feature-gate.mjs', {
			cwd: ROOT,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		});
	} catch (e) {
		return {
			ok: false,
			message:
				'[pre-commit] feature-gate が失敗。canon 変更は Feature + OPA allow が必要。\n' +
				String((e && (e.stderr || e.stdout || e.message)) || '').slice(0, 4000)
		};
	}
	return { ok: true, message: '' };
}
