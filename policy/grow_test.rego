package grow.admission_test

import rego.v1

import data.grow.admission

base := {
	"id": "F-0002",
	"title": "promote a skill",
	"kind": "harness-grow",
	"status": "admitted",
	"source": "reflector",
	"learning_refs": ["knowledge/learnings.md"],
	"proposed_change": {"mutates_canon": true, "paths": [".claude/skills/example/"]},
	"evidence": {"adversarial_review": "approved"},
	"constraints": {"supersede_adr": false},
}

test_admit_allow_after_review if {
	admission.allow with input as {"action": "admit", "feature": base}
}

test_apply_allow_when_paths_covered if {
	admission.allow with input as {
		"action": "apply",
		"feature": base,
		"diff_paths": [".claude/skills/example/SKILL.md"],
		"existing_adrs": [],
	}
}

test_deny_apply_without_review if {
	pending := object.union(base, {"evidence": {"adversarial_review": "pending"}})
	not admission.allow with input as {
		"action": "apply",
		"feature": pending,
		"diff_paths": [".claude/skills/example/SKILL.md"],
		"existing_adrs": [],
	}
}

test_deny_uncovered_canon_path if {
	not admission.allow with input as {
		"action": "apply",
		"feature": base,
		"diff_paths": [".claude/skills/example/SKILL.md", "knowledge/criteria/code-quality.yaml"],
		"existing_adrs": [],
	}
}

test_deny_apply_while_proposed if {
	proposed := object.union(base, {"status": "proposed"})
	not admission.allow with input as {
		"action": "apply",
		"feature": proposed,
		"diff_paths": [".claude/skills/example/SKILL.md"],
		"existing_adrs": [],
	}
}

test_deny_silent_adr_rewrite if {
	not admission.allow with input as {
		"action": "apply",
		"feature": object.union(base, {"proposed_change": {"mutates_canon": true, "paths": ["knowledge/decisions/"]}}),
		"diff_paths": ["knowledge/decisions/0016-definition-of-done.md"],
		"existing_adrs": ["knowledge/decisions/0016-definition-of-done.md"],
	}
}

test_allow_adr_amend_when_flagged if {
	feat := object.union(base, {
		"proposed_change": {"mutates_canon": true, "paths": ["knowledge/decisions/"]},
		"constraints": {"supersede_adr": true},
	})
	admission.allow with input as {
		"action": "apply",
		"feature": feat,
		"diff_paths": ["knowledge/decisions/0016-definition-of-done.md"],
		"existing_adrs": ["knowledge/decisions/0016-definition-of-done.md"],
	}
}

test_bootstrap_f0001_human_allows_apply if {
	boot := {
		"id": "F-0001",
		"title": "introduce the gate",
		"kind": "harness-grow",
		"status": "in_progress",
		"source": "human",
		"bootstrap": true,
		"learning_refs": ["knowledge/learnings.md"],
		"proposed_change": {"mutates_canon": true, "paths": ["policy/", ".claude/skills/"]},
		"evidence": {"adversarial_review": "pending"},
		"constraints": {"supersede_adr": true},
	}
	admission.allow with input as {
		"action": "apply",
		"feature": boot,
		"diff_paths": ["policy/grow.rego", ".claude/skills/harness-grow/SKILL.md"],
		"existing_adrs": [],
	}
}

test_bootstrap_other_id_denied if {
	boot := object.union(base, {"id": "F-0003", "bootstrap": true, "source": "human"})
	not admission.allow with input as {"action": "admit", "feature": boot}
}
