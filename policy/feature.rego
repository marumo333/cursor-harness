package feature.canon

import rego.v1

feature := input.feature

kinds := {"harness-grow", "harness-rule", "product", "chore"}

statuses := {"proposed", "admitted", "denied", "in_progress", "done", "rejected"}

sources := {"human", "reflector", "audit"}

review_states := {"approved", "pending", "not_required"}

valid if count(deny) == 0

is_nonempty_string(x) if {
	is_string(x)
	count(x) > 0
}

deny contains "feature.id must match F-NNNN" if {
	not regex.match(`^F-[0-9]{4}$`, feature.id)
}

deny contains "feature.title is required" if {
	not is_nonempty_string(feature.title)
}

deny contains "feature.kind must be harness-grow|harness-rule|product|chore" if {
	not (feature.kind in kinds)
}

deny contains "feature.status must be a known status" if {
	not (feature.status in statuses)
}

deny contains "feature.source must be human|reflector|audit" if {
	not (feature.source in sources)
}

deny contains "feature.learning_refs must be a non-empty array" if {
	not is_array(feature.learning_refs)
}

deny contains "feature.learning_refs must be a non-empty array" if {
	is_array(feature.learning_refs)
	count(feature.learning_refs) == 0
}

deny contains "each learning_ref must start with knowledge/" if {
	some ref in feature.learning_refs
	not startswith(ref, "knowledge/")
}

deny contains "feature.proposed_change.paths must be a non-empty array" if {
	not is_array(feature.proposed_change.paths)
}

deny contains "feature.proposed_change.paths must be a non-empty array" if {
	is_array(feature.proposed_change.paths)
	count(feature.proposed_change.paths) == 0
}

deny contains "harness-rule features must include a path under policy/" if {
	feature.kind == "harness-rule"
	not rule_path_present
}

rule_path_present if {
	some p in feature.proposed_change.paths
	startswith(p, "policy/")
}

deny contains "feature.evidence.adversarial_review must be approved|pending|not_required" if {
	not (feature.evidence.adversarial_review in review_states)
}

deny contains "chore may not set proposed_change.mutates_canon=true" if {
	feature.kind == "chore"
	feature.proposed_change.mutates_canon == true
}
