/** コミット主語: conventional prefix + 日本語。機械キーは英語のまま可。 */

export const COMMIT_TYPES = [
	'feat',
	'fix',
	'docs',
	'style',
	'refactor',
	'test',
	'chore',
	'perf',
	'ci',
	'build',
	'revert'
];

const PREFIX = new RegExp(`^(${COMMIT_TYPES.join('|')})(\\([a-z0-9/_-]+\\))?:\\s+(.+)$`);
const JP = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;

export function subjectLine(raw) {
	const text = String(raw ?? '');
	for (const line of text.split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		return t;
	}
	return '';
}

export function lintCommitMessage(raw) {
	const subject = subjectLine(raw);
	const errors = [];
	if (!subject) {
		errors.push('コミットメッセージが空です。');
		return { ok: false, errors };
	}
	if (/^(Merge\b|Revert "|fixup! |squash! )/.test(subject)) {
		return { ok: true, errors: [] };
	}
	const m = subject.match(PREFIX);
	if (!m) {
		errors.push(
			'主語は conventional prefix で始める（feat: / fix: / docs: / style: / refactor: / test: / chore: / perf: / ci: / build: / revert:）。'
		);
		return { ok: false, errors };
	}
	if (!JP.test(m[3])) {
		errors.push('主語（prefix の後ろ）に日本語が必要です。');
	}
	return { ok: errors.length === 0, errors };
}
