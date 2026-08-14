package harness.canon

import rego.v1

# canon パスの正本（ADR 0038）。JS ゲートはこのパッケージを問い合わせる。

canon_path(p) if startswith(p, ".claude/skills/")

canon_path(p) if startswith(p, ".claude/agents/")

canon_path(p) if startswith(p, ".claude/hooks/")

canon_path(p) if p == ".cursor/hooks.json"

canon_path(p) if startswith(p, ".cursor/hooks/")

canon_path(p) if p == ".cursor/log_subagent_model.mjs"

canon_path(p) if startswith(p, "knowledge/features/")

# events.jsonl は追記ログ（状態）。正本は必須集合だけ。
canon_path(p) if p == "knowledge/graph/required-cycle.json"

canon_path(p) if p == ".claude/CLAUDE.md"

canon_path(p) if p == ".claude/AGENTS.md"

canon_path(p) if p == ".claude/settings.json"

canon_path(p) if startswith(p, "knowledge/decisions/")

canon_path(p) if startswith(p, "knowledge/criteria/")

canon_path(p) if startswith(p, "policy/")

canon_path(p) if startswith(p, "scripts/")

canon_path(p) if p == "package.json"

canon_path(p) if startswith(p, ".github/workflows/")

paths contains p if {
	some p in input.diff_paths
	canon_path(p)
}
