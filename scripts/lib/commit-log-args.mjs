/**
 * CI / 手元のコミット主語検査が読む git log 引数。
 *
 * `git log HEAD` は先端1件ではなく到達可能な全履歴を出す。
 * 先端だけ見るときは `-1` を付ける。
 * pull_request の merge commit を tip にしない（head SHA を渡す）。
 * 主語と親 SHA を取り、手書き Merge を免除しない。
 *
 * git log に任意 argv を渡さない（`--output` 等でファイルを書ける）。
 */

const REV = /^(?:HEAD(?:[~^][0-9]*)?|[0-9a-fA-F]{7,40}|origin\/[A-Za-z0-9._\/-]+)$/;
const JP = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;
const RECORD_FORMAT = '%s%x00%P';

function isRev(value) {
	return typeof value === 'string' && !value.includes('..') && REV.test(value);
}

function isRange(value) {
	if (typeof value !== 'string' || value.startsWith('-')) return false;
	const parts = value.split('..');
	return parts.length === 2 && isRev(parts[0]) && isRev(parts[1]);
}

/**
 * @param {string} subject
 * @param {'tip' | 'range'} mode
 */
export function shouldSkipLegacyJa(subject, mode) {
	if (mode !== 'range') return false;
	return JP.test(subject) && !/^[a-z]+(\([^)]+\))?:/.test(subject);
}

/**
 * @param {string} log
 * @returns {{ subject: string, parentCount: number }[]}
 */
export function parseCommitLogRecords(log) {
	const raw = String(log ?? '');
	const text = raw.endsWith('\n') ? raw.slice(0, -1) : raw;
	if (!text) return [];
	return text.split('\n').map((line) => {
		const [subject = '', parentLine = ''] = line.split('\0');
		const parentCount = parentLine.trim().split(/\s+/).filter(Boolean).length;
		return { subject: subject.trim(), parentCount };
	});
}

/**
 * @param {string[]} argv
 * @returns {{ ok: true, args: string[], mode: 'tip' | 'range' } | { ok: false, reason: string }}
 */
export function parseCommitLogRequest(argv = []) {
	const extra = argv.filter((a) => a !== '--');
	if (extra.some((a) => a.startsWith('-') && a !== '--tip')) {
		return { ok: false, reason: 'git log の任意オプションは拒否する。' };
	}
	if (extra.length === 0 || (extra.length === 1 && extra[0] === 'HEAD')) {
		return { ok: true, args: ['log', '-1', `--format=${RECORD_FORMAT}`, '--'], mode: 'tip' };
	}
	if (extra[0] === '--tip') {
		if (extra.length === 1) {
			return { ok: true, args: ['log', '-1', `--format=${RECORD_FORMAT}`, '--'], mode: 'tip' };
		}
		if (extra.length === 2 && isRev(extra[1])) {
			return { ok: true, args: ['log', '-1', `--format=${RECORD_FORMAT}`, '--', extra[1]], mode: 'tip' };
		}
		return { ok: false, reason: '--tip には revision 1件だけを付ける。' };
	}
	if (extra.length === 1 && isRange(extra[0])) {
		return { ok: true, args: ['log', `--format=${RECORD_FORMAT}`, extra[0]], mode: 'range' };
	}
	return { ok: false, reason: '引数は --tip [rev] か <rev>..<rev> だけ。' };
}

/**
 * @param {string[]} argv
 * @returns {string[]}
 */
export function commitLogArgs(argv = []) {
	const parsed = parseCommitLogRequest(argv);
	if (!parsed.ok) throw new Error(parsed.reason);
	return parsed.args;
}
