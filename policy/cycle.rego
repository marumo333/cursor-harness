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

has_pending_followups if is_number(input.pending_followups)

has_failed if input.metrics.has_failed == true

has_failed if input.metrics.has_failed == false

has_metrics if {
	is_number(input.metrics.node_skip_rate)
	is_number(input.metrics.edge_skip_rate)
	is_number(input.metrics.state_integrity)
	has_failed
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

deny contains "pending_followups must be a number" if {
	input.action == "open_next"
	not has_pending_followups
}

deny contains "metrics.node_skip_rate/edge_skip_rate/state_integrity/has_failed must be present" if {
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

deny contains "cycle follow-up Feature already pending: do not recurse" if {
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

# skip/fail が無い周は再起しない（空サイクルの integrity=0 で量産しない）。
deny contains "no skipped or failed required skills: do not recurse" if {
	input.action == "open_next"
	has_metrics
	not need_rerun
}
