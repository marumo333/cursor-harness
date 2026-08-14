package feature.canon

import rego.v1

feature := input.feature

kinds := {"harness-grow", "harness-rule", "product", "chore"}

statuses := {"proposed", "admitted", "denied", "in_progress", "done", "rejected"}

sources := {"human", "reflector", "audit"}

review_states := {"approved", "pending", "not_required"}

valid if count(deny) == 0

# Helpers are complete rules so `not helper` is true when the field is missing
# (undefined refs inside `not (x in set)` are hoisted and silently skip the deny).

has_id if regex.match(`^F-[0-9]{4}$`, feature.id)

has_title if {
	is_string(feature.title)
	count(trim(feature.title, " \t\n\r")) > 0
}

has_kind if feature.kind in kinds

has_status if feature.status in statuses

has_source if feature.source in sources

has_learning_refs if {
	is_array(feature.learning_refs)
	count(feature.learning_refs) > 0
}

learning_refs_prefixed if {
	has_learning_refs
	every ref in feature.learning_refs {
		startswith(ref, "knowledge/")
	}
}

has_paths if {
	is_array(feature.proposed_change.paths)
	count(feature.proposed_change.paths) > 0
}

has_review_state if feature.evidence.adversarial_review in review_states

rule_path_present if {
	some p in feature.proposed_change.paths
	startswith(p, "policy/")
}

deny contains "feature.id must match F-NNNN" if not has_id

deny contains "feature.title is required" if not has_title

deny contains "feature.kind must be harness-grow|harness-rule|product|chore" if not has_kind

deny contains "feature.status must be a known status" if not has_status

deny contains "feature.source must be human|reflector|audit" if not has_source

deny contains "feature.learning_refs must be a non-empty array" if not has_learning_refs

deny contains "each learning_ref must start with knowledge/" if {
	has_learning_refs
	not learning_refs_prefixed
}

deny contains "feature.proposed_change.paths must be a non-empty array" if not has_paths

deny contains "harness-rule features must include a path under policy/" if {
	feature.kind == "harness-rule"
	not rule_path_present
}

deny contains "feature.evidence.adversarial_review must be approved|pending|not_required" if not has_review_state

deny contains "chore may not set proposed_change.mutates_canon=true" if {
	feature.kind == "chore"
	feature.proposed_change.mutates_canon == true
}
