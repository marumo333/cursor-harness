package cycle.admission

import rego.v1

# Helpers are complete rules so missing keys deny (undefined inside `not (x == …)` is hoisted).

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

has_metrics if {
	is_number(input.metrics.node_skip_rate)
	is_number(input.metrics.edge_skip_rate)
	is_number(input.metrics.state_integrity)
}

deny contains "action must be open_next" if not has_action

deny contains "current_cycle.human_approved must be boolean" if {
	input.action == "open_next"
	not has_human_approved
}

deny contains "open_cycle_pr must be boolean" if {
	input.action == "open_next"
	not has_open_pr
}

deny contains "pending_features must be a number" if {
	input.action == "open_next"
	not has_pending
}

deny contains "metrics.node_skip_rate/edge_skip_rate/state_integrity must be numbers" if {
	input.action == "open_next"
	not has_metrics
}

deny contains "cannot open next cycle without human_approved on current cycle" if {
	input.action == "open_next"
	has_human_approved
	not input.current_cycle.human_approved == true
}

deny contains "cannot open next cycle while another cycle PR is open" if {
	input.action == "open_next"
	input.open_cycle_pr == true
}

metrics_green if {
	has_metrics
	input.metrics.node_skip_rate == 0
	input.metrics.edge_skip_rate == 0
	input.metrics.state_integrity == 1
}

# 緑なら止める。未処理 Feature は既にある票で進める（cycle PR の量産をしない）。
deny contains "metrics green: do not recurse" if {
	input.action == "open_next"
	metrics_green
}
