---
type: brainstorm
date: 2026-04-09
slug: mcp-header-auth
status: agreed
---

# Brainstorm — Header Auth for Remote MCP Server

## 1. Problem Statement

GoClaw (internal MCP client) cannot connect to `https://egany-bitrix24-mcp.tose.sh` via Streamable HTTP — times out with `start transport: timeout waiting for endpoint after ~15s`. Also, the `/mcp` endpoint is publicly reachable: anyone with the URL can invoke every Bitrix24 CRM tool against the baked-in webhook.

Two coupled issues:
1. **Transport broken** — `server.js` spawns `node build/index.js` per POST, pipes one JSON line, closes. No SSE `endpoint` event → GoClaw (and any spec-compliant Streamable HTTP client) hangs.
2. **No auth** — no header validation before hitting the MCP pipeline.

Fixing auth on top of the spawn model is pointless; handshake still fails. Must land together.

## 2. Requirements

**Functional**
- GoClaw connects via Streamable HTTP transport (not stdio, not SSE-legacy).
- Server validates an `Authorization: Bearer <key>` header before serving `/mcp`.
- Single shared `MCP_API_KEY` env var, matching existing `ladipage-mcp` pattern on tose.sh.
- `/health` stays unauthenticated (platform probes).
- Local stdio entry (`src/index.ts`) keeps working for Claude Desktop dev.

**Non-functional**
- KISS — no auth server, no JWT, no OAuth.
- Stateful MCP sessions (initialize → tools/list → tools/call) work correctly.
- Rotatable secret (restart deploy = new key, no code change).
- No regression in existing tool set.

## 3. Current State (Scouted)

| File | Role | Problem |
|---|---|---|
| `src/index.ts:66` | stdio MCP server | Fine for local; not exposed remotely |
| `server.js:91` | Azure/tose HTTP wrapper | Spawn-per-request, no auth, no SSE — root of timeout |
| `mcp-proxy.cjs` | stdio→HTTPS bridge | Hardcoded Azure URL, no headers, obsolete once GoClaw connects directly |
| `package.json:26` | `@modelcontextprotocol/sdk ^0.4.0` | Too old — `StreamableHTTPServerTransport` lives in SDK ≥1.10 |

## 4. Options Evaluated

### Opt A — Auth only, keep spawn model
- Add header check to `server.js` before POST body processing.
- **Verdict: rejected.** Does not fix GoClaw timeout. Spec-incompliant transport.

### Opt B — Full OAuth 2.1 / JWT
- MCP 2025-06 spec auth flow, discovery endpoint, issuer.
- **Verdict: rejected.** Overkill for single-tenant internal server. Violates YAGNI.

### Opt C — Migrate to `StreamableHTTPServerTransport` + static bearer token *(chosen)*
- Bump SDK to ^1.10+, rewrite HTTP entry to use SDK transport.
- Simple Express middleware: reject requests whose `Authorization` header does not match `process.env.MCP_API_KEY`.
- Delete `mcp-proxy.cjs` and current `server.js` body.
- Keep `src/index.ts` stdio unchanged for local dev.

### Opt D — Platform-level auth (tose.sh basic auth / IP allowlist)
- **Verdict: rejected.** GoClaw's Headers form sends arbitrary keys, not HTTP Basic. IP allowlist doesn't fit a cloud MCP client. Also couples secret to platform.

## 5. Recommended Solution (Opt C)

### 5.1 Architecture

```
┌────────────┐    HTTPS  POST /mcp                    ┌──────────────────┐
│   GoClaw   │───────────Authorization: Bearer KEY───▶│ http-server.ts   │
└────────────┘                                        │  (Express)       │
                                                      │  ├─ auth mw      │
                                                      │  ├─ /health (pub)│
                                                      │  └─ /mcp (auth'd)│
                                                      │     │            │
                                                      │     ▼            │
                                                      │  StreamableHTTP  │
                                                      │  ServerTransport │
                                                      │     │            │
                                                      │     ▼            │
                                                      │  Bitrix24 MCP    │
                                                      │  Server (SDK)    │
                                                      └──────────────────┘
                                                               │
                                                               ▼
                                                       Bitrix24 webhook
```

Single long-lived MCP `Server` instance. Transport maintains session map keyed by `Mcp-Session-Id` header. No per-request process spawn.

### 5.2 Files to Change

**Create**
- `src/http-server.ts` — Express bootstrap, auth middleware, mount transport. Target <200 LOC.

**Modify**
- `src/index.ts` — extract tool registration into shared `createBitrixMcpServer()` factory consumed by both stdio and http entries.
- `package.json` — bump `@modelcontextprotocol/sdk` to `^1.10` (or latest); add `express`, `@types/express`; add `start:http` script.
- `docs/` — update CLAUDE_REMOTE_SETUP.md, deployment guides.

**Delete**
- `mcp-proxy.cjs` — GoClaw connects directly, proxy obsolete.
- `server.js` spawn logic — replaced by http-server.ts.

### 5.3 Auth Middleware Shape (illustrative only — no implementation in this phase)

```ts
// Bearer token check. Single shared secret. Constant-time compare.
const expected = process.env.MCP_API_KEY;
if (!expected) throw new Error('MCP_API_KEY not set');

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const provided = header.replace(/^Bearer\s+/i, '');
  if (!provided || !timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}
```

Apply to `/mcp` only. `/health` stays open.

### 5.4 GoClaw Config

| Field | Value |
|---|---|
| Transport | Streamable HTTP |
| URL | `https://egany-bitrix24-mcp.tose.sh/mcp` |
| Headers | `Authorization` = `Bearer <paste MCP_API_KEY>` |
| Tool Prefix | `bitrix24_` (already matches) |
| Timeout | 60s ok |

### 5.5 Secret Storage — Advice

You asked which store to use. Advice:

- **tose.sh (primary, matches ladipage-mcp screenshot)**: use the platform Env var UI with `SECRET` flag, exactly like the ladipage MCP_API_KEY row. KISS, no extra infra, rotates via redeploy. ✅ Recommended.
- **Azure App Service (if still deploying there)**: plain App Service Configuration env var is fine for single-tenant shared secret — same class of secret as `BITRIX24_WEBHOOK_URL` already stored there. Key Vault only pays off if (a) multiple apps share the key, (b) you need audit logs on secret reads, or (c) compliance requires it. Neither applies here.
- **Generate the key** with `openssl rand -base64 32` — not a human-chosen string.
- **Rotation**: change env var → redeploy → paste new value into GoClaw Headers. No code path needed.

### 5.6 Session Handling

`StreamableHTTPServerTransport` supports two modes:
- **Stateful** (default): server issues `Mcp-Session-Id` on initialize, clients echo it. Required for tools that accumulate state across calls.
- **Stateless**: new session per request. Simpler but breaks any tool relying on initialize-time state.

Bitrix24 tools are request-scoped (each call hits REST API directly, no cached state). **Recommendation: stateless mode** to simplify session lifecycle and avoid memory leaks from abandoned sessions. Revisit if we later add cached auth tokens or pagination cursors.

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SDK bump 0.4→1.x has breaking API changes (Tool registration, Server ctor) | Budget time for migration. Use SDK changelog. Smoke-test stdio entry first. |
| Auth middleware order wrong → leaks `/mcp` before check | Apply middleware at route level `app.post('/mcp', requireAuth, handler)`, not global. Add e2e test: POST without header → 401. |
| Constant-time compare missed → timing oracle | Use `crypto.timingSafeEqual` with equal-length buffers, else return 401 before compare. |
| `MCP_API_KEY` unset in prod → silent bypass | Fail fast at boot if env var missing. |
| Health probe gets blocked | Mount `/health` before auth-protected routes; explicit test. |
| GoClaw sends header differently (`x-api-key` vs `Authorization`) | Support both on server side: `req.headers.authorization ?? req.headers['x-api-key']`. Low cost, avoids a config mismatch incident. |
| Secret in docs/screenshots leaks to git | `.env.example` placeholder only; README warns never paste real key. |

## 7. Success Metrics

- GoClaw "Test Connection" returns green (no timeout) against new URL.
- `curl -X POST https://.../mcp` without header → HTTP 401.
- `curl -X POST https://.../mcp` with correct `Authorization: Bearer $MCP_API_KEY` + valid initialize payload → HTTP 200 + MCP initialize response.
- Existing stdio entry still works: `node build/index.js` under Claude Desktop lists tools.
- At least one end-to-end tool call from GoClaw (e.g. `bitrix24_get_current_user`) succeeds.

## 8. Next Steps / Dependencies

1. Decide final host (tose.sh only, or keep Azure parallel?) — see unresolved questions.
2. Plan phase: SDK upgrade audit (0.4 → 1.x breaking changes in tool registration).
3. Implement `createBitrixMcpServer()` factory.
4. Implement `src/http-server.ts` with auth + StreamableHTTPServerTransport.
5. Delete obsolete files (`mcp-proxy.cjs`, legacy `server.js`).
6. Update `package.json` scripts + deployment env.
7. Update `docs/` deployment + setup guides.
8. Smoke test → configure GoClaw → verify.

## 9. Unresolved Questions

- **Host consolidation**: Is `tose.sh` replacing Azure entirely, or do both deployments stay? Affects how many `MCP_API_KEY` secrets to manage and which deployment docs to keep.
- **Multi-tenant future**: Any chance multiple teams/users will need separate Bitrix24 webhooks through this server? If yes, single-key model breaks down and we need to revisit — but YAGNI says defer.
- **GoClaw's exact header behavior**: Does GoClaw URL-encode header values, trim whitespace, or support multi-line values? Only matters if we hit a weird parsing bug — likely fine, flag if "Test Connection" still fails after auth lands.
