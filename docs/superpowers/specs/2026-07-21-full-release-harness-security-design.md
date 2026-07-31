# Design: Full release + harness audit + security (W0–W8)

- Date: 2026-07-21
- Status: Executing (W0)
- Master plan: Cursor plan `Release M3-M5 Master` (expanded full backlog)
- Related: ADR 0013/0016/0018/0028/0029/0030/0033/0034/0035/0036

## Goal

Complete remaining product debt in waves, verify availability and harness loop/HOTL, pass expanded security review, then warm user (C+D) → X announce.

## Locked decisions

- Companion required; spike Bearer **off** in production
- No FastAPI migration; Companion stays Node `.mjs` until Tauri
- Approach 1: friend sees only post–W8 build
- First user: university-friend freelancer; success = pay/recommend (C) + no shame bugs (D)
- Take rate 1.5%; outcome_fee 10 credits (criteria constants)
- Git: feature branch per wave → check/lint/test/arch/build/e2e → PR on explicit request

## Waves

| Wave | Scope                                                                       |
| ---- | --------------------------------------------------------------------------- |
| W0   | Harness/HOTL audit, availability baseline, security baseline (3-family)     |
| W1   | M2 connectors + link_candidates                                             |
| W2   | M3 outcome_events + outcome billing                                         |
| W3   | M4 E2B run_code                                                             |
| W4   | M5 Stripe Link/webhook/Checkout                                             |
| W5   | Invoice math, email/share, Obsidian projection, KV rate limit, long_run min |
| W6   | M6 flywheel + M7 self-evolution                                             |
| W7   | Seat V4, Tavily, Tauri, payout intro links                                  |
| W8   | Availability re-measure + security sign-off → warm user → X                 |

## Dual loops

- Harness: plan-confirm → TDD → adversarial-review → verify → reflect → grow
- Product: mining HITL → graph → outcome_events (reward) → (M7) evolution

## TDD

Behavior-change: red evidence (vitest or e2e-runner) before green. Critical: auth/billing/ports/RLS/webhook. UX contracts: hermetic Playwright. Real rails: HOTL.

## Security threat model (W0/W8 + high-risk PRs)

Cookie theft/forgery, CSRF, XSS/CSP, SQLi, SSRF, prompt injection, IDOR/RLS, secrets.

## Harness seats

Parent Grok; Fable named gates; Sol only review_trio #3.

## Out of automated scope

Unattended W0→X; paid pen-test; 24/7 synthetic monitoring beyond CF logs + manual probes.
