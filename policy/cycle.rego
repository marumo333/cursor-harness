package cycle.admission

import rego.v1

# ヘルパーは完全ルール。欠落キーは deny（`not (x == …)` 内の未定義は hoisting される）

default allow := false

allow if {
	input.action == "open_next"
	count(deny) == 0
}

has_action if input.action == "open_next"

has_human_approved if input.current_cycle.human_approved == true

has_human_approved if input.current_cycle.human_approved == false

has_open_pr if input.open_cycle_pr == true

has_open_pr if input.open_cycle_pr == false

has_pending if is_number(input.pending_features)

has_pending_followups if is_number(input.pending_followups)

has_failed if input.metrics.has_failed == true

has_failed if input.metrics.has_failed == false

has_metrics if {
	is_number(input.metrics.node_skip_rate)
	is_number(input.metrics.edge_skip_rate)
	is_number(input.metrics.state_integrity)
	has_failed
}

deny contains "action は open_next" if not has_action

deny contains "current_cycle.human_approved は真偽値" if {
	input.action == "open_next"
	not has_human_approved
}

deny contains "open_cycle_pr は真偽値" if {
	input.action == "open_next"
	not has_open_pr
}

deny contains "pending_features は数値" if {
	input.action == "open_next"
	not has_pending
}

deny contains "pending_followups は数値" if {
	input.action == "open_next"
	not has_pending_followups
}

deny contains "metrics の skip/integrity/has_failed が必要" if {
	input.action == "open_next"
	not has_metrics
}

deny contains "現サイクルの human_approved なしでは次周を開けない" if {
	input.action == "open_next"
	has_human_approved
	not input.current_cycle.human_approved == true
}

deny contains "未マージの cycle PR がある間は次周を開けない" if {
	input.action == "open_next"
	input.open_cycle_pr == true
}

deny contains "未処理の cycle-followup Feature があるので再起しない" if {
	input.action == "open_next"
	input.pending_followups > 0
}

need_rerun if {
	has_metrics
	input.metrics.node_skip_rate > 0
}

need_rerun if {
	has_metrics
	input.metrics.edge_skip_rate > 0
}

need_rerun if {
	has_metrics
	input.metrics.has_failed == true
}

# 省略/失敗が無い周は再起しない（空サイクルの integrity=0 で量産しない）。
deny contains "必須 skill の省略/失敗が無いので再起しない" if {
	input.action == "open_next"
	has_metrics
	not need_rerun
}
