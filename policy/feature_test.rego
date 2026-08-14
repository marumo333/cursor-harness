package feature.canon_test

import rego.v1

import data.feature.canon

good_feature := {
	"id": "F-0002",
	"title": "pin a learned invariant",
	"kind": "harness-rule",
	"status": "proposed",
	"source": "reflector",
	"learning_refs": ["knowledge/learnings.md"],
	"proposed_change": {"mutates_canon": true, "paths": ["policy/learned/example.rego"]},
	"evidence": {"adversarial_review": "pending"},
}

test_valid_harness_rule if {
	canon.valid with input as {"feature": good_feature}
}

test_reject_bad_id if {
	"feature.id must match F-NNNN" in canon.deny with input as {"feature": object.union(good_feature, {"id": "feat-1"})}
}

test_reject_empty_learning_refs if {
	"feature.learning_refs must be a non-empty array" in canon.deny with input as {"feature": object.union(good_feature, {"learning_refs": []})}
}

test_reject_harness_rule_without_policy_path if {
	bad := object.union(good_feature, {"proposed_change": {"mutates_canon": true, "paths": [".claude/skills/x/SKILL.md"]}})
	"harness-rule features must include a path under policy/" in canon.deny with input as {"feature": bad}
}

test_reject_chore_mutating_canon if {
	bad := object.union(good_feature, {"kind": "chore", "proposed_change": {"mutates_canon": true, "paths": ["README.md"]}})
	"chore may not set proposed_change.mutates_canon=true" in canon.deny with input as {"feature": bad}
}
