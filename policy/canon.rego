package harness.canon

import rego.v1

# Single source of canon paths (ADR 0038). JS gate must query this package.

canon_path(p) if startswith(p, ".claude/skills/")

canon_path(p) if startswith(p, ".claude/agents/")

canon_path(p) if startswith(p, ".claude/hooks/")

canon_path(p) if p == ".claude/CLAUDE.md"

canon_path(p) if p == ".claude/AGENTS.md"

canon_path(p) if p == ".claude/settings.json"

canon_path(p) if startswith(p, "knowledge/decisions/")

canon_path(p) if startswith(p, "knowledge/criteria/")

canon_path(p) if startswith(p, "policy/")

canon_path(p) if startswith(p, "scripts/")

canon_path(p) if p == "package.json"

paths contains p if {
	some p in input.diff_paths
	canon_path(p)
}
