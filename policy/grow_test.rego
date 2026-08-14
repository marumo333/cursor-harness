package grow.admission_test

import rego.v1

import data.grow.admission

base := {
	"id": "F-0002",
	"title": "skill を昇格する",
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

test_deny_empty_feature_apply if {
	not admission.allow with input as {
		"action": "apply",
		"feature": {},
		"diff_paths": [".claude/CLAUDE.md"],
		"existing_adrs": [],
	}
}

test_deny_missing_status_apply if {
	not admission.allow with input as {
		"action": "apply",
		"feature": object.remove(base, {"status"}),
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

test_deny_self_reported_non_mutate if {
	chore := object.union(base, {
		"kind": "chore",
		"proposed_change": {"mutates_canon": false, "paths": [".claude/", "policy/"]},
		"evidence": {"adversarial_review": "not_required"},
	})
	not admission.allow with input as {
		"action": "apply",
		"feature": chore,
		"diff_paths": [".claude/CLAUDE.md", "policy/learned/backdoor.rego"],
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

test_cover_paths_allows_partial_feature if {
	admission.allow with input as {
		"action": "apply",
		"feature": base,
		"diff_paths": [".claude/skills/example/SKILL.md", "knowledge/criteria/code-quality.yaml"],
		"cover_paths": [".claude/skills/example/SKILL.md"],
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

test_deny_apply_when_done if {
	done := object.union(base, {"status": "done"})
	not admission.allow with input as {
		"action": "apply",
		"feature": done,
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

f0001 := {
	"id": "F-0001",
	"title": "ゲートを導入する",
	"kind": "harness-grow",
	"status": "in_progress",
	"source": "human",
	"bootstrap": true,
	"learning_refs": ["knowledge/learnings.md"],
	"proposed_change": {"mutates_canon": true, "paths": ["policy/", ".claude/skills/", "scripts/", "knowledge/features/"]},
	"evidence": {"adversarial_review": "pending"},
	"constraints": {"supersede_adr": true},
}

test_bootstrap_f0001_only_while_introducing if {
	admission.allow with input as {
		"action": "apply",
		"feature": f0001,
		"f0001_in_merge_base": false,
		"diff_paths": [
			"knowledge/features/F-0001-feature-canon-opa-grow.yaml",
			"policy/grow.rego",
			".claude/skills/harness-grow/SKILL.md",
		],
		"existing_adrs": [],
	}
}

test_bootstrap_without_intro_file_denied if {
	not admission.allow with input as {
		"action": "apply",
		"feature": f0001,
		"f0001_in_merge_base": false,
		"diff_paths": ["policy/grow.rego", ".claude/skills/harness-grow/SKILL.md"],
		"existing_adrs": [],
	}
}

test_bootstrap_after_merge_denied if {
	not admission.allow with input as {
		"action": "apply",
		"feature": f0001,
		"f0001_in_merge_base": true,
		"diff_paths": [
			"knowledge/features/F-0001-feature-canon-opa-grow.yaml",
			"policy/learned/backdoor.rego",
		],
		"existing_adrs": [],
	}
}

test_bootstrap_other_id_denied if {
	boot := object.union(base, {"id": "F-0003", "bootstrap": true, "source": "human"})
	not admission.allow with input as {"action": "admit", "feature": boot}
}

test_omit_mutates_canon_denied if {
	omit_pc := {
		"id": "F-0002",
		"title": "skill を昇格する",
		"kind": "harness-grow",
		"status": "admitted",
		"source": "reflector",
		"learning_refs": ["knowledge/learnings.md"],
		"proposed_change": {"paths": [".claude/skills/example/"]},
		"evidence": {"adversarial_review": "approved"},
		"constraints": {"supersede_adr": false},
	}
	not admission.allow with input as {
		"action": "apply",
		"feature": omit_pc,
		"diff_paths": [".claude/skills/example/SKILL.md"],
		"existing_adrs": [],
	}
}

test_new_feature_cannot_be_born_approved if {
	not admission.allow with input as {
		"action": "apply",
		"feature": base,
		"feature_in_merge_base": false,
		"diff_paths": [".claude/skills/example/SKILL.md"],
		"existing_adrs": [],
	}
}

test_empty_cover_paths_denied if {
	not admission.allow with input as {
		"action": "apply",
		"feature": base,
		"diff_paths": [".claude/skills/example/SKILL.md"],
		"cover_paths": [],
		"existing_adrs": [],
	}
}

test_c3_bypass_ticket_denied if {
	bypass := {
		"id": "F-0099",
		"title": "迂回",
		"kind": "chore",
		"status": "admitted",
		"source": "human",
		"learning_refs": ["knowledge/learnings.md"],
		"proposed_change": {"mutates_canon": false, "paths": [".claude/", "policy/"]},
		"evidence": {"adversarial_review": "not_required"},
	}
	not admission.allow with input as {
		"action": "apply",
		"feature": bypass,
		"diff_paths": [".claude/CLAUDE.md", "policy/learned/backdoor.rego"],
		"existing_adrs": [],
	}
}
