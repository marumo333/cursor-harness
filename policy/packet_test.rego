package packet.canon_test

import rego.v1

import data.packet.canon

ok_packet := {
	"schema": "harness-query/v1",
	"cycle": "C-0010",
	"node": "skill:verify",
	"seq": 1,
	"context_mode": "isolated",
	"feature": "F-0007",
	"diff_stat": "1 file",
	"metrics": null,
	"catalog_hits": [],
	"adr_paths": ["knowledge/decisions/0045-dispatch-context-packet.md"],
}

ok_dispatch := {
	"node": "skill:verify",
	"seq": 1,
	"seat": "opus",
	"escalate": "stay",
	"sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	"context_mode": "isolated",
	"effort_set": false,
}

ok_input := {
	"packet": ok_packet,
	"packet_bytes": 200,
	"dispatch": ok_dispatch,
	"writer": "parent",
	"child_keys": [],
	"effort_allow": ["high"],
	"effort_default": "high",
	"canon_path_count": 0,
	"trio_third": false,
	"ceiling_replaces_gate": false,
	"role_swap_to_opus": false,
}

test_deny_empty_when_valid if {
	count(canon.deny) == 0 with input as ok_input
}

test_deny_forbidden_key if {
	p := object.union(ok_packet, {"learnings": "no"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"packet": p})
}

test_deny_oversize if {
	count(canon.deny) > 0 with input as object.union(ok_input, {"packet_bytes": 32769})
}

test_deny_empty_bytes if {
	count(canon.deny) > 0 with input as object.union(ok_input, {"packet_bytes": 0})
}

test_deny_bad_context_mode if {
	d := object.union(ok_dispatch, {"context_mode": "fork"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"dispatch": d})
}

test_deny_child_self_promote if {
	count(canon.deny) > 0 with input as object.union(ok_input, {"child_keys": ["effort"]})
}

test_deny_width1_effort_override if {
	d := object.union(ok_dispatch, {"effort_set": true, "effort": "high"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"dispatch": d, "effort_allow": ["high"]})
}

test_allow_width2_effort_override if {
	d := object.union(ok_dispatch, {"effort_set": true, "effort": "high"})
	count(canon.deny) == 0 with input as object.union(ok_input, {
		"dispatch": d,
		"effort_allow": ["medium", "high"],
		"effort_default": "medium",
	})
}

test_deny_effort_outside_allow if {
	d := object.union(ok_dispatch, {"effort_set": true, "effort": "low"})
	count(canon.deny) > 0 with input as object.union(ok_input, {
		"dispatch": d,
		"effort_allow": ["medium", "high"],
		"effort_default": "medium",
	})
}

test_deny_stay_when_canon_paths if {
	d := object.union(ok_dispatch, {"escalate": "stay"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"dispatch": d, "canon_path_count": 1})
}

test_allow_trio_when_canon_paths if {
	d := object.union(ok_dispatch, {"escalate": "trio"})
	count(canon.deny) == 0 with input as object.union(ok_input, {"dispatch": d, "canon_path_count": 2})
}

test_deny_ceiling_replaces_gate if {
	d := object.union(ok_dispatch, {"escalate": "ceiling"})
	count(canon.deny) > 0 with input as object.union(ok_input, {
		"dispatch": d,
		"ceiling_replaces_gate": true,
	})
}

test_deny_muse_outside_third if {
	d := object.union(ok_dispatch, {"seat": "muse"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"dispatch": d, "trio_third": false})
}

test_allow_muse_as_third if {
	d := object.union(ok_dispatch, {"seat": "muse", "escalate": "trio"})
	count(canon.deny) == 0 with input as object.union(ok_input, {
		"dispatch": d,
		"trio_third": true,
		"canon_path_count": 1,
	})
}

test_deny_implement_to_opus if {
	count(canon.deny) > 0 with input as object.union(ok_input, {"role_swap_to_opus": true})
}

test_deny_bad_schema if {
	p := object.union(ok_packet, {"schema": "fork/v1"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"packet": p})
}

test_deny_packet_effort_key if {
	p := object.union(ok_packet, {"effort": "high"})
	count(canon.deny) > 0 with input as object.union(ok_input, {"packet": p})
}
