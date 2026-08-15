/**
 * CI / 手元のコミット主語検査が読む git log 引数。
 *
 * `git log HEAD` は先端1件ではなく到達可能な全履歴を出す。
 * 先端だけ見るときは `-1` を付ける。範囲指定はそのまま渡す。
 *
 * @param {string[]} argv
 * @returns {string[]}
 */
export function commitLogArgs(argv = []) {
	const extra = argv.filter((a) => a !== '--');
	if (extra.length === 0 || extra[0] === 'HEAD' || extra[0] === '--tip') {
		return ['log', '-1', '--format=%s'];
	}
	return ['log', ...extra, '--format=%s'];
}
