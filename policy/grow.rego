package grow.admission

import rego.v1

import data.feature.canon
import data.harness.canon as hcanon

feature := input.feature

bootstrap_feature_path := "knowledge/features/F-0001-feature-canon-opa-grow.yaml"

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

has_action if input.action in {"admit", "apply"}

deny contains "action must be admit or apply" if not has_action

bootstrap_ok if {
	feature.bootstrap == true
	feature.id == "F-0001"
	feature.source == "human"
	input.action == "admit"
}

bootstrap_ok if {
	feature.bootstrap == true
	feature.id == "F-0001"
	feature.source == "human"
	input.action == "apply"
	bootstrap_feature_path in input.diff_paths
}

deny contains "bootstrap is one-shot and only valid on F-0001 from a human" if {
	feature.bootstrap == true
	not bootstrap_ok
}

canon_diff_paths contains p if {
	some p in hcanon.paths
}

# Coverage can be narrowed to cover_paths for union-of-features evaluation.
need_cover contains p if {
	some p in object.get(input, "cover_paths", canon_diff_paths)
	hcanon.canon_path(p)
}

# Actual mutation is derived from the diff, not the ticket's self-report.
mutates if {
	input.action == "apply"
	count(canon_diff_paths) > 0
}

mutates if {
	input.action == "admit"
	feature.proposed_change.mutates_canon == true
}

deny contains "mutates_canon=false but canon paths are in the diff" if {
	input.action == "apply"
	count(canon_diff_paths) > 0
	feature.proposed_change.mutates_canon == false
}

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

apply_status_ok if feature.status in {"admitted", "in_progress"}

apply_status_ok if bootstrap_ok

deny contains "apply requires status admitted|in_progress" if {
	input.action == "apply"
	not apply_status_ok
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
	some p in need_cover
	not covered(p)
}

deny contains sprintf("in-place ADR rewrite %q requires constraints.supersede_adr=true", [p]) if {
	input.action == "apply"
	some p in input.diff_paths
	some existing in input.existing_adrs
	p == existing
	not feature.constraints.supersede_adr == true
}
