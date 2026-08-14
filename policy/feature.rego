package feature.canon

import rego.v1

feature := input.feature

kinds := {"harness-grow", "harness-rule", "product", "chore"}

statuses := {"proposed", "admitted", "denied", "in_progress", "done", "rejected"}

sources := {"human", "reflector", "audit"}

review_states := {"approved", "pending", "not_required"}

valid if count(deny) == 0

# ヘルパーは完全ルール。欠落時は not helper が真になる
# （`not (x in set)` 内の未定義参照は hoisting され deny を飛ばす）

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

has_mutates_flag if feature.proposed_change.mutates_canon == true

has_mutates_flag if feature.proposed_change.mutates_canon == false

rule_path_present if {
	some p in feature.proposed_change.paths
	startswith(p, "policy/")
}

deny contains "feature.id は F-NNNN 形式" if not has_id

deny contains "feature.title は必須" if not has_title

deny contains "feature.kind は harness-grow|harness-rule|product|chore" if not has_kind

deny contains "feature.status が不正" if not has_status

deny contains "feature.source は human|reflector|audit" if not has_source

deny contains "feature.learning_refs は空でない配列" if not has_learning_refs

deny contains "learning_ref は knowledge/ で始まる" if {
	has_learning_refs
	not learning_refs_prefixed
}

deny contains "proposed_change.paths は空でない配列" if not has_paths

deny contains "harness-rule は policy/ 配下のパスが必要" if {
	feature.kind == "harness-rule"
	not rule_path_present
}

deny contains "adversarial_review は approved|pending|not_required" if not has_review_state

deny contains "mutates_canon は boolean" if not has_mutates_flag

deny contains "chore は mutates_canon=true にできない" if {
	feature.kind == "chore"
	feature.proposed_change.mutates_canon == true
}
