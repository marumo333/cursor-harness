/** Pure 3-metric calculator for harness cycles (ADR 0039). */

const TERMINAL = new Set(['used', 'skipped', 'failed', 'approved']);

/**
 * @param {{ nodes: {id:string}[], edges: {from:string,to:string}[] }} required
 * @param {{ nodes?: Record<string,string>, edges?: Record<string,string>, human_approved?: boolean }} cycle
 */
export function computeMetrics(required, cycle) {
	const nodeStates = cycle.nodes ?? {};
	const edgeStates = cycle.edges ?? {};
	const nodes = required.nodes ?? [];
	const edges = required.edges ?? [];

	let nodeSkipped = 0;
	let nodeFailed = 0;
	let nodeTerminal = 0;
	for (const n of nodes) {
		const st = nodeStates[n.id];
		if (st === 'skipped') nodeSkipped += 1;
		if (st === 'failed') nodeFailed += 1;
		if (TERMINAL.has(st)) nodeTerminal += 1;
	}

	let edgeSkipped = 0;
	let edgeFailed = 0;
	for (const e of edges) {
		const key = `${e.from}>${e.to}`;
		if (edgeStates[key] === 'skipped') edgeSkipped += 1;
		if (edgeStates[key] === 'failed') edgeFailed += 1;
	}

	const node_skip_rate = nodes.length === 0 ? 0 : nodeSkipped / nodes.length;
	const edge_skip_rate = edges.length === 0 ? 0 : edgeSkipped / edges.length;
	const state_integrity = nodes.length === 0 ? 1 : nodeTerminal / nodes.length;
	const has_failed = nodeFailed > 0 || edgeFailed > 0;

	return {
		node_skip_rate,
		edge_skip_rate,
		state_integrity,
		has_failed,
		human_approved: cycle.human_approved === true,
		should_file_feature: node_skip_rate > 0 || edge_skip_rate > 0 || has_failed || state_integrity < 1
	};
}

/**
 * Fold events.jsonl objects into a cycle snapshot.
 * @param {object[]} events
 * @param {string} cycleId
 */
export function foldCycle(events, cycleId) {
	/** @type {{ nodes: Record<string,string>, edges: Record<string,string>, human_approved: boolean }} */
	const cycle = { nodes: {}, edges: {}, human_approved: false };
	for (const ev of events) {
		if (ev.cycle !== cycleId) continue;
		if (ev.type === 'node_state' && ev.node && ev.state) cycle.nodes[ev.node] = ev.state;
		if (ev.type === 'edge_state' && ev.from && ev.to && ev.state) {
			cycle.edges[`${ev.from}>${ev.to}`] = ev.state;
		}
		if (ev.type === 'human_approved') cycle.human_approved = true;
	}
	return cycle;
}

/** Latest cycle_open that has no human_approved yet. */
export function latestOpenCycle(events, fallback = 'C-0001') {
	const opens = [];
	const approved = new Set();
	for (const ev of events) {
		if (ev.type === 'cycle_open' && ev.cycle) opens.push(ev.cycle);
		if (ev.type === 'human_approved' && ev.cycle) approved.add(ev.cycle);
	}
	for (let i = opens.length - 1; i >= 0; i -= 1) {
		if (!approved.has(opens[i])) return opens[i];
	}
	return opens[opens.length - 1] || fallback;
}

export function nextCycleId(id) {
	const m = String(id).match(/(\d+)/);
	const n = m ? Number(m[1]) + 1 : 1;
	return `C-${String(n).padStart(4, '0')}`;
}
