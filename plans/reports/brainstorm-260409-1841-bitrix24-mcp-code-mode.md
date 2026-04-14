---
type: brainstorm
date: 2026-04-09 18:41 Asia/Saigon
topic: Convert Bitrix24 MCP server to Code Mode (Cloudflare Workers)
status: awaiting-plan
---

# Brainstorm — Bitrix24 MCP → Code Mode

## 1. Problem statement

Current server exposes **50+ MCP tools** (`src/tools/index.ts`, 1524 lines) wrapping a rich `Bitrix24Client` (`src/bitrix24/client.ts`, 1409 lines). Two pains:

1. **Token bloat** — loading all tool JSON schemas into every LLM context = ~15–25k tokens before any real work.
2. **Round-trip tax** — multi-step workflows (e.g. "find all deals > €5k in pipeline X, bump stage, create follow-up task for each") cost 20+ tool calls. Each call = latency + tokens.

Goal: adopt the **Cloudflare / Anthropic "Code Mode"** pattern — expose the Bitrix24 client as a typed TS API, let the LLM write one code block that runs in an isolate with a pre-bound `bitrix24` global. **Keep the existing 50+ tools for backward compat.**

Constraints (confirmed):
- Runtime target: **Cloudflare Workers + Durable Objects**
- Auth: **single shared webhook** (current `BITRIX24_WEBHOOK_URL` secret)
- Scope: **additive** — new `bitrix24_run_code` tool beside existing tools
- Deploy: **undecided** (user asked for recommendation)

---

## 2. Core design (agreed direction)

```
┌─────────────────┐   POST /mcp    ┌───────────────────────┐
│  MCP client     │──────────────▶ │  Worker (router)      │
│ (Claude, etc.)  │   Bearer auth  │  - existing 50+ tools │
└─────────────────┘                │  - bitrix24_run_code  │
                                   └───────┬───────────────┘
                                           │ RPC
                                   ┌───────▼───────────────┐
                                   │ Durable Object        │
                                   │  - session state      │
                                   │  - rate limiter (2/s) │
                                   │  - code eval sandbox  │
                                   │  - `bitrix24` binding │
                                   └───────┬───────────────┘
                                           │ fetch
                                   ┌───────▼───────────────┐
                                   │  Bitrix24 REST        │
                                   └───────────────────────┘
```

- **Single code-exec tool**: `bitrix24_run_code({ code: string, timeoutMs?: number })`
- **LLM sees a `.d.ts`** for `bitrix24` (generated from `client.ts`), not 50 JSON schemas
- **Execution**: inside a DO, `new AsyncFunction('bitrix24', 'console', code)(sdk, safeConsole)` with dangerous globals shadowed
- **Output**: stdout + last-expression result, capped (e.g. 50KB) to prevent context flooding

---

## 3. Approaches evaluated

### Approach A — **Full migration** (Azure retired, Workers only)
- **Pros**: one runtime, clean ops, best long-term cost, native fetch replaces `node-fetch`
- **Cons**: rewrite `http-server.ts` for Workers, secret migration, DNS cutover, breaks current Azure clients during switch; biggest lift
- **Risk**: migration window + team already invested in Azure (many `AZURE_*.md` guides)

### Approach B — **Parallel runtimes** (Azure legacy + Cloudflare code-mode)
- **Pros**: zero disruption to existing clients; ship code mode fast; revert easy
- **Cons**: two deploys to maintain; **rate-limit coordination hazard** — both runtimes hitting same webhook can exceed 2 req/s; duplicated secret config
- **Mitigation**: rate-limit via Cloudflare DO, Azure calls go through Worker as proxy? Or accept soft overage during migration window.

### Approach C — **Prototype-first** (Workers PoC, decide after benchmarks)
- **Pros**: lowest commitment; validates token/latency claims before infra bets; buys team time
- **Cons**: if PoC stalls, you have a dangling dev deploy
- **Path**: PoC → parallel (B) → eventual full migration (A) if numbers are good

### 🟢 **Recommendation: C → B → A**
1. **Now**: Prototype code mode on Workers with a throwaway subdomain. Measure: tokens saved, latency, correctness on 5 realistic multi-step workflows.
2. **If PoC wins**: Promote to parallel (B). Add `bitrix24_run_code` to both Azure and Worker MCP responses, but **only the Worker actually executes**; Azure proxies to Worker for that one tool.
3. **If ops pain from dual runtime**: migrate fully (A) once Cloudflare proves stable for 30+ days.

This is honest pragmatism: you asked for Workers + DO, but you already have Azure working. Don't break what ships today.

---

## 4. Key technical decisions

### 4.1 Sandbox strategy — **eval inside DO, no real isolate**

Brutal truth: Cloudflare Workers has **no in-worker V8 isolation primitive** for free. Real isolation requires:
- **Workers for Platforms** dispatch namespaces (paid tier, ~$25/mo minimum + per-request)
- **Cloudflare Sandbox / containers** (newer, heavier, slower cold starts)

For an MVP where the LLM is Claude (trusted-ish) and the blast radius is already "full Bitrix24 access" (same as the existing tools), **eval'd AsyncFunction in a DO is acceptable**. Mitigations:
- Shadow `fetch`, `WebSocket`, `crypto`, `caches`, `globalThis` via function parameter injection
- Hard timeout via `Promise.race` (e.g. 30s)
- Output size cap
- Log every executed code block (audit trail)
- Document threat model explicitly in README

**Upgrade path**: if a future client is untrusted, swap DO eval → Workers for Platforms dispatch. Same `bitrix24` binding contract.

### 4.2 API surface generation

- Source of truth: `src/bitrix24/client.ts` (already a clean class)
- **Don't hand-write the .d.ts**. Run `tsc --declaration --emitDeclarationOnly` on a curated entry file that re-exports only LLM-safe methods
- Strip: `validateWebhook`, internal helpers, anything with side effects on auth/config
- **Ship the generated .d.ts as part of the `bitrix24_run_code` tool description** so LLM sees the API surface without reading source

### 4.3 Rate limiting

- Current: in-process token bucket in `client.ts` (2 req/s)
- Workers: **must move to DO state** — one DO instance per webhook URL, holds the token bucket, all requests from all isolates funnel through it
- Bonus: DO also holds session state (e.g. last-used pipeline, cached user-id→name lookups) across multiple `run_code` invocations in one MCP session

### 4.4 Backward compatibility

- Legacy tools stay byte-for-byte identical
- New tool: `bitrix24_run_code`
- Tool description includes: (a) the `.d.ts` excerpt, (b) 2–3 canonical examples, (c) "prefer this for multi-step operations"
- LLM decides per-task whether to use the single-shot tools or code mode

### 4.5 Token budget comparison (rough)

| | Current | Code mode |
|---|---|---|
| Tool schemas loaded | ~18k tokens | ~3k tokens |
| 10-step workflow call overhead | ~4k tokens | ~500 tokens |
| **Total per complex task** | **~22k** | **~3.5k** |

**~6× reduction** on complex workflows. On simple one-shot tasks, parity.

---

## 5. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sandbox escape via eval | Full Bitrix24 access | Shadow globals, audit log, trusted-client-only posture, upgrade path to WFP |
| Rate-limit violation during parallel deploy | Bitrix24 429s | Proxy Azure→Worker for code-mode only; or migrate fully |
| `node-fetch` → native `fetch` incompatibilities | `client.ts` breaks on Workers | Test every method in PoC phase; `client.ts` already uses standard Request semantics |
| DO cold starts | First `run_code` call slow | Acceptable for MVP; keep-alive pings if needed |
| LLM writes infinite loop | Worker CPU limit hit | Hard timeout via `Promise.race(30s)` + document CPU-ms limits |
| `.d.ts` drift from `client.ts` | LLM calls missing methods | CI step: regenerate `.d.ts` on every build, fail if drift |

---

## 6. Success metrics

Measure on 5 canonical workflows (to define in plan):
1. **Token usage per task** — target ≥3× reduction vs legacy tools
2. **End-to-end latency** — target ≤2× legacy for single-shot, ≤0.5× for multi-step
3. **Correctness** — 100% parity on the 5 canonical workflows
4. **Audit log completeness** — every code execution captured with input/output/duration
5. **Rate-limit incidents** — zero Bitrix24 429s over 7-day bake period

---

## 7. Out of scope (explicit non-goals)

- Multi-tenant auth (per-caller webhook) — confirmed single shared webhook
- Replacing legacy tools — additive only
- Full Azure retirement — deferred to post-PoC decision
- True isolate sandboxing (WFP) — deferred until untrusted client exists
- Stdio transport changes — `src/index.ts` untouched

---

## 8. Next steps (if plan approved)

1. Scaffold Cloudflare Worker project (`wrangler.toml`, DO class, router)
2. Port `Bitrix24Client` to Workers-native fetch, verify via unit tests
3. Build curated `.d.ts` generation pipeline (`scripts/generate-sdk-dts.ts`)
4. Implement `bitrix24_run_code` tool with sandboxed eval + timeout + output cap
5. Define 5 canonical workflows as integration tests (both legacy path and code-mode path)
6. Deploy PoC subdomain, run benchmarks, collect numbers
7. Decision gate: promote to parallel (B) or iterate

---

## 9. Unresolved questions

1. **Sandbox trust posture** — is Claude-the-LLM trusted enough to eval code inside your Worker, or do you want WFP isolate from day one? (Cost: ~$25/mo minimum.)
2. **Cloudflare account** — do you already have one with Workers Paid plan ($5/mo, needed for DO), or starting fresh?
3. **Benchmarks authority** — who decides "PoC wins"? Concrete thresholds or gut feel?
4. **`client.ts` Workers compat** — any known Node-only APIs beyond `node-fetch` (e.g. `process.env` direct access, `Buffer`)? Needs a scan.
5. **Audit log destination** — R2 object? D1 row? Workers Logs? (Impacts cost + query UX.)
6. **Legacy `.md` sprawl** — 30+ markdown guides in repo root. Out of scope here but worth a cleanup sweep later.
