# W0: Harness / availability / security baseline

> Parent Grok executes audit + docs. Security trio = Fable Task ×3. HOTL availability needs human credential HITL.

## Goal

Produce three artifacts with pass/fail, unblock W1 only if Critical security = 0 (or waived with human ack).

## Artifacts

1. `docs/superpowers/specs/2026-07-21-harness-loop-hotl-audit.md`
2. `knowledge/product/availability-baseline-2026-07.md` (HITL pending sections allowed)
3. `docs/superpowers/specs/2026-07-21-security-baseline.md`
4. `knowledge/benchmarks/audit-2.json` (harness-audit score)

## Tasks

### Task 1: Design + branch

- [x] Spec `2026-07-21-full-release-harness-security-design.md`
- [x] Branch `feat/w0-harness-avail-security`

### Task 2: Harness loop / HOTL audit

- [x] Inventory skills/agents/hooks vs model-routing.yaml
- [x] Confirm loop evidence in learnings (recent plan→review→verify→reflect)
- [x] HOTL: parent-owned, no ops-runner, .env deny intact
- [x] Write audit md YES/NO table

### Task 3: Availability baseline

- [x] Document probe procedure (auth → Companion → normal → brain → balance)
- [x] Mark live numbers `pending_human` until HOTL credentials provided
- [x] Draft SLO targets

### Task 4: Security baseline trio

- [x] Fable: PI + XSS/CSP + correctness
- [x] Grok: IDOR/RLS + CSRF + cookies
- [x] Sol: secrets + SQLi + SSRF
- [x] Integrate → security-baseline.md; Critical blocks W1

### Task 5: harness-audit score

- [x] Write `audit-2.json` vs `audit-1.json`

### Task 6: PR (on user request)

- [ ] check/lint/test/arch/build; commit; push; gh pr create
