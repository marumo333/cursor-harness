package feature.canon_test

import rego.v1

import data.feature.canon

good_feature := {
	"id": "F-0002",
	"title": "学習した不変条件を固定する",
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

test_reject_empty_feature if {
	not canon.valid with input as {"feature": {}}
	count(canon.deny) > 0 with input as {"feature": {}}
}

test_reject_missing_id if {
	"feature.id は F-NNNN 形式" in canon.deny with input as {"feature": object.remove(good_feature, {"id"})}
}

test_reject_missing_kind if {
	"feature.kind は harness-grow|harness-rule|product|chore" in canon.deny with input as {"feature": object.remove(good_feature, {"kind"})}
}

test_reject_missing_review if {
	missing_review := {
		"id": "F-0002",
		"title": "学習した不変条件を固定する",
		"kind": "harness-rule",
		"status": "proposed",
		"source": "reflector",
		"learning_refs": ["knowledge/learnings.md"],
		"proposed_change": {"mutates_canon": true, "paths": ["policy/learned/example.rego"]},
		"evidence": {},
	}
	"adversarial_review は approved|pending|not_required" in canon.deny with input as {"feature": missing_review}
}

test_reject_bad_id if {
	"feature.id は F-NNNN 形式" in canon.deny with input as {"feature": object.union(good_feature, {"id": "feat-1"})}
}

test_reject_empty_learning_refs if {
	"feature.learning_refs は空でない配列" in canon.deny with input as {"feature": object.union(good_feature, {"learning_refs": []})}
}

test_reject_harness_rule_without_policy_path if {
	bad := object.union(good_feature, {"proposed_change": {"mutates_canon": true, "paths": [".claude/skills/x/SKILL.md"]}})
	"harness-rule は policy/ 配下のパスが必要" in canon.deny with input as {"feature": bad}
}

test_reject_missing_mutates_flag if {
	missing_mutates := {
		"id": "F-0002",
		"title": "学習した不変条件を固定する",
		"kind": "harness-rule",
		"status": "proposed",
		"source": "reflector",
		"learning_refs": ["knowledge/learnings.md"],
		"proposed_change": {"paths": ["policy/learned/example.rego"]},
		"evidence": {"adversarial_review": "pending"},
	}
	"mutates_canon は boolean" in canon.deny with input as {"feature": missing_mutates}
}

test_reject_chore_mutating_canon if {
	bad := object.union(good_feature, {"kind": "chore", "proposed_change": {"mutates_canon": true, "paths": ["README.md"]}})
	"chore は mutates_canon=true にできない" in canon.deny with input as {"feature": bad}
}
