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

deny contains "action は admit または apply" if not has_action

# True one-shot: merge-base に F-0001 がまだ無い導入コミットだけ。
bootstrap_ok if {
	feature.bootstrap == true
	feature.id == "F-0001"
	feature.source == "human"
	input.f0001_in_merge_base == false
	input.action == "admit"
}

bootstrap_ok if {
	feature.bootstrap == true
	feature.id == "F-0001"
	feature.source == "human"
	input.f0001_in_merge_base == false
	input.action == "apply"
	bootstrap_feature_path in input.diff_paths
}

deny contains "bootstrap は人間起票の F-0001 の一回限り" if {
	feature.bootstrap == true
	not bootstrap_ok
}

canon_diff_paths contains p if {
	some p in hcanon.paths
}

cover_requested if {
	is_array(input.cover_paths)
	count(input.cover_paths) > 0
}

need_cover contains p if {
	cover_requested
	some p in input.cover_paths
	hcanon.canon_path(p)
}

need_cover contains p if {
	not cover_requested
	some p in canon_diff_paths
}

deny contains "cover_paths は canon 差分の空でない部分集合" if {
	is_array(input.cover_paths)
	count(input.cover_paths) == 0
}

deny contains "cover_paths は canon 差分の空でない部分集合" if {
	cover_requested
	some p in input.cover_paths
	not p in canon_diff_paths
}

# 実際の変更は票の自己申告ではなく差分から導出する。
mutates if {
	input.action == "apply"
	count(canon_diff_paths) > 0
}

mutates if {
	input.action == "admit"
	feature.proposed_change.mutates_canon == true
}

deny contains "canon 差分があるとき mutates_canon は true" if {
	input.action == "apply"
	count(canon_diff_paths) > 0
	not feature.proposed_change.mutates_canon == true
}

deny contains "新規 Feature を admitted またはレビュー承認済みで生ませない" if {
	input.feature_in_merge_base == false
	not bootstrap_ok
	feature.status in {"admitted", "in_progress", "done"}
}

deny contains "新規 Feature を admitted またはレビュー承認済みで生ませない" if {
	input.feature_in_merge_base == false
	not bootstrap_ok
	feature.evidence.adversarial_review == "approved"
}

review_ok if bootstrap_ok

review_ok if {
	not mutates
	feature.evidence.adversarial_review == "not_required"
}

review_ok if feature.evidence.adversarial_review == "approved"

deny contains "canon 変更の grow は adversarial_review=approved（または F-0001 bootstrap）" if {
	mutates
	not review_ok
}

apply_status_ok if feature.status in {"admitted", "in_progress"}

apply_status_ok if bootstrap_ok

deny contains "apply は status が admitted|in_progress" if {
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

deny contains sprintf("差分パス %q は proposed_change.paths に含まれない", [p]) if {
	input.action == "apply"
	some p in need_cover
	not covered(p)
}

deny contains sprintf("既存 ADR %q の上書きには constraints.supersede_adr=true が必要", [p]) if {
	input.action == "apply"
	some p in input.diff_paths
	some existing in input.existing_adrs
	p == existing
	not feature.constraints.supersede_adr == true
}
