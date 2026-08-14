package harness.canon_test

import rego.v1

import data.harness.canon

test_scripts_and_hooks_are_canon if {
	canon.canon_path("scripts/feature-gate.mjs")
	canon.canon_path(".claude/hooks/block_secret_write.mjs")
	canon.canon_path(".claude/settings.json")
	canon.canon_path("package.json")
}

test_learnings_and_features_are_not_canon if {
	not canon.canon_path("knowledge/learnings.md")
	not canon.canon_path("knowledge/features/F-0002-x.yaml")
	not canon.canon_path("knowledge/benchmarks/audit-4.json")
}
