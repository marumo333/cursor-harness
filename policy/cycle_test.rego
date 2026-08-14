package cycle.admission_test

import rego.v1

import data.cycle.admission

base := {
	"action": "open_next",
	"current_cycle": {"human_approved": true},
	"open_cycle_pr": false,
	"pending_features": 1,
	"metrics": {"node_skip_rate": 0.25, "edge_skip_rate": 0, "state_integrity": 1},
}

test_allow_open_next_after_approve_with_skips if {
	admission.allow with input as base
}

test_deny_without_human_approved if {
	not admission.allow with input as object.union(base, {"current_cycle": {"human_approved": false}})
}

test_deny_when_cycle_pr_open if {
	not admission.allow with input as object.union(base, {"open_cycle_pr": true})
}

test_deny_when_green_and_idle if {
	not admission.allow with input as object.union(base, {
		"pending_features": 0,
		"metrics": {"node_skip_rate": 0, "edge_skip_rate": 0, "state_integrity": 1},
	})
}

test_deny_when_metrics_green_even_with_pending if {
	not admission.allow with input as object.union(base, {
		"pending_features": 3,
		"metrics": {"node_skip_rate": 0, "edge_skip_rate": 0, "state_integrity": 1},
	})
}

test_deny_when_metrics_missing if {
	not admission.allow with input as {
		"action": "open_next",
		"current_cycle": {"human_approved": true},
		"open_cycle_pr": false,
		"pending_features": 1,
		"metrics": {},
	}
}

test_deny_when_human_approved_missing if {
	not admission.allow with input as {
		"action": "open_next",
		"current_cycle": {},
		"open_cycle_pr": false,
		"pending_features": 1,
		"metrics": {"node_skip_rate": 0.25, "edge_skip_rate": 0, "state_integrity": 1},
	}
}

test_deny_when_open_pr_missing if {
	not admission.allow with input as {
		"action": "open_next",
		"current_cycle": {"human_approved": true},
		"pending_features": 1,
		"metrics": {"node_skip_rate": 0.25, "edge_skip_rate": 0, "state_integrity": 1},
	}
}

test_deny_when_pending_missing if {
	not admission.allow with input as {
		"action": "open_next",
		"current_cycle": {"human_approved": true},
		"open_cycle_pr": false,
		"metrics": {"node_skip_rate": 0.25, "edge_skip_rate": 0, "state_integrity": 1},
	}
}
