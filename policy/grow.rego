package grow.admission

import rego.v1

import data.feature.canon

feature := input.feature

default allow := false

allow if {
	input.action == "admit"
	count(deny) == 0
}

allow if {
	input.action == "apply"
	count(deny) == 0
}

deny contains msg if {
	some msg in canon.deny
}

deny contains "action must be admit or apply" if {
	not (input.action in {"admit", "apply"})
}

bootstrap_ok if {
	feature.bootstrap == true
	feature.id == "F-0001"
	feature.source == "human"
}

deny contains "bootstrap is one-shot and only valid on F-0001 from a human" if {
	feature.bootstrap == true
	not bootstrap_ok
}

mutates if feature.proposed_change.mutates_canon == true

review_ok if bootstrap_ok

review_ok if {
	not mutates
	feature.evidence.adversarial_review == "not_required"
}

review_ok if feature.evidence.adversarial_review == "approved"

deny contains "canon-mutating grow requires adversarial_review=approved (or F-0001 bootstrap)" if {
	mutates
	not review_ok
}

deny contains "apply requires status admitted|in_progress|done" if {
	input.action == "apply"
	not (feature.status in {"admitted", "in_progress", "done"})
	not bootstrap_ok
}

canon_path(p) if startswith(p, ".claude/skills/")

canon_path(p) if startswith(p, ".claude/agents/")

canon_path(p) if p == ".claude/CLAUDE.md"

canon_path(p) if p == ".claude/AGENTS.md"

canon_path(p) if startswith(p, "knowledge/decisions/")

canon_path(p) if startswith(p, "knowledge/criteria/")

canon_path(p) if startswith(p, "policy/")

canon_diff_paths contains p if {
	some p in input.diff_paths
	canon_path(p)
}

covered(p) if {
	some root in feature.proposed_change.paths
	path_covered(p, root)
}

path_covered(p, root) if p == root

path_covered(p, root) if {
	endswith(root, "/")
	startswith(p, root)
}

path_covered(p, root) if {
	not endswith(root, "/")
	startswith(p, sprintf("%s/", [root]))
}

deny contains sprintf("diff path %q is not covered by feature.proposed_change.paths", [p]) if {
	input.action == "apply"
	some p in canon_diff_paths
	not covered(p)
}

deny contains sprintf("in-place ADR rewrite %q requires constraints.supersede_adr=true", [p]) if {
	input.action == "apply"
	some p in input.diff_paths
	some existing in input.existing_adrs
	p == existing
	not feature.constraints.supersede_adr == true
}
