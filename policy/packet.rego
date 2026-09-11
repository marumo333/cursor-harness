package packet.canon

import rego.v1

# deny 集合が空だけを見る。allow 完全ルールは置かない。

forbidden_keys := {"learnings", "conversation", "decisions", "session", "effort", "escalate"}

modes := {"isolated", "packet"}

escalates := {"stay", "trio", "ceiling", "human"}

has_schema if input.packet.schema == "harness-query/v1"

has_cycle if regex.match(`^C-[0-9]{4}$`, input.packet.cycle)

has_bytes if is_number(input.packet_bytes)

has_mode if input.dispatch.context_mode in modes

has_packet_mode if input.packet.context_mode in modes

has_escalate if input.dispatch.escalate in escalates

effort_ok if input.dispatch.effort in input.effort_allow

is_third if input.trio_third == true

walk_forbidden if {
	some path, value
	walk(input.packet, [path, value])
	count(path) > 0
	path[count(path) - 1] in forbidden_keys
}

deny contains "schema は harness-query/v1" if not has_schema

deny contains "cycle は C-NNNN" if not has_cycle

deny contains "禁則キー" if walk_forbidden

deny contains "packet_bytes が必要" if not has_bytes

deny contains "packet_bytes 上限" if {
	has_bytes
	input.packet_bytes > 32768
}

deny contains "空パケット" if {
	has_bytes
	input.packet_bytes == 0
}

deny contains "context_mode は isolated か packet" if not has_mode

deny contains "packet の context_mode は isolated か packet" if not has_packet_mode

deny contains "escalate が不正" if not has_escalate

child_promotes if "effort" in input.child_keys

child_promotes if "escalate" in input.child_keys

child_promotes if "seat" in input.child_keys

deny contains "子の自己昇格" if child_promotes

deny contains "幅1の effort 上書きは拒否" if {
	input.dispatch.effort_set == true
	count(input.effort_allow) < 2
}

deny contains "effort が許容幅の外" if {
	input.dispatch.effort_set == true
	not effort_ok
}

deny contains "canon 差分がある周で stay は拒否" if {
	input.dispatch.escalate == "stay"
	input.canon_path_count > 0
}

deny contains "ceiling は verifier / reflector の代替ではない" if input.ceiling_replaces_gate == true

deny contains "Muse は trio 第3以外禁止" if {
	input.dispatch.seat == "muse"
	not is_third
}

deny contains "実装席を Opus に付け替えない" if input.role_swap_to_opus == true
