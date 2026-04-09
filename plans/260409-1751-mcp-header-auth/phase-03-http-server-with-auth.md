# Phase 03 — HTTP Server + Auth + StreamableHTTP

## Context Links
- Brainstorm §5.1 architecture, §5.3 auth shape, §5.6 stateless mode decision
- SDK research: `reports/sdk-upgrade-research.md` (stateless wiring, length-safe compare)
- Files: `src/mcp-server-factory.ts` (from phase 02)

## Overview
**Priority:** P2
**Status:** pending
Create `src/http-server.ts`: Express app, unauthenticated `/health`, bearer-auth-gated `POST /mcp` using `StreamableHTTPServerTransport` in stateless mode. Fail fast if `MCP_API_KEY` missing. Also extract auth middleware into a small module if needed (inline if ≤30 LOC).

## Key Insights
- **Stateless per-request instantiation** (from SDK v1.x example `simpleStatelessStreamableHttp.ts`): new `server` + `transport` per POST, `await transport.handleRequest(req, res, req.body)`. Cleanup on `res.on('close')`.
- Express lowercases headers — use `req.headers.authorization` (not `Authorization`).
- Support BOTH `Authorization: Bearer <key>` AND `x-api-key: <key>` per brainstorm risk mitigation.
- `timingSafeEqual` throws on unequal-length buffers → length-prefix guard returns 401 before compare.
- Mount `/health` BEFORE auth middleware path; apply auth only at route level (`app.post('/mcp', requireAuth, handler)`).
- Need `app.use(express.json({ limit: '4mb' }))` before `/mcp` route.
- Boot must `process.exit(1)` if `MCP_API_KEY` unset — silent bypass is unacceptable.

## Requirements
**Functional**
- `GET /health` returns `{status: 'ok', uptime, version}`, HTTP 200, no auth
- `POST /mcp` without `Authorization`/`x-api-key` → 401 JSON `{error: 'unauthorized'}`
- `POST /mcp` with valid bearer + valid MCP `initialize` JSON → 200 with MCP initialize response
- Server listens on `PORT` env var, default `3000`
- Boot banner to stderr; unauthorized access logged (`ip`, `path`, no key echo)
- Graceful `SIGTERM` shutdown

**Non-functional**
- Single file `src/http-server.ts`, target <200 LOC
- Zero impact on stdio entry
- No in-memory session store (stateless)

## Architecture
```
GoClaw ──POST /mcp───┐
                     ▼
              express.json()
                     │
                     ▼
             requireAuth middleware
             (bearer | x-api-key)
                     │ 401 ← mismatch
                     ▼
           /mcp route handler
             │
             ├─ createBitrixMcpServer()     ← fresh per request
             ├─ new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
             ├─ res.on('close', cleanup)
             ├─ server.connect(transport)
             └─ transport.handleRequest(req, res, req.body)
```

## Related Code Files
**Create**
- `src/http-server.ts` — Express bootstrap, routes, handler
- `.env.example` — add `MCP_API_KEY=` placeholder (create if missing)

**Modify**
- None in code (package.json changes in phase 04)

**Depends on**
- `src/mcp-server-factory.ts` (phase 02)

## Implementation Steps
1. Confirm `express` + `@types/express` installable (defer actual install to phase 04 alongside other package changes — or install now and consolidate commits; judgment call).
2. Create `src/http-server.ts`:
   - Imports: `express`, `Request`/`Response` types, `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`, `crypto.timingSafeEqual`, `createBitrixMcpServer`
   - Read `process.env.MCP_API_KEY`; if missing → `console.error` + `process.exit(1)`
   - Pre-compute `expectedBuf = Buffer.from(expected)`
   - Define `requireAuth(req, res, next)` per SDK research snippet (length guard + timingSafeEqual)
   - `const app = express(); app.use(express.json({limit: '4mb'}));`
   - `app.get('/health', ...)` — public, returns `{status:'ok', uptime: process.uptime(), version: '1.0.0'}`
   - `app.post('/mcp', requireAuth, async (req, res) => { ...stateless pattern... })`
   - Error catch: if `!res.headersSent` return 500 JSON; log err to stderr
   - 404 fallback handler
   - `app.listen(PORT, () => console.error(...))`
   - `process.on('SIGTERM', ...)` graceful close
3. `npm run build` — expect `build/http-server.js` emitted.
4. Local manual test (before deploy):
   - `MCP_API_KEY=test123 PORT=3000 node build/http-server.js`
   - `curl -s localhost:3000/health` → expect `{"status":"ok",...}`
   - `curl -s -X POST localhost:3000/mcp -H 'Content-Type: application/json' -d '{}'` → 401
   - `curl -s -X POST localhost:3000/mcp -H 'Authorization: Bearer test123' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'` → expect MCP initialize result

## Todo List
- [ ] Install `express` + `@types/express` (or defer to phase 04)
- [ ] Create `src/http-server.ts` (<200 LOC)
- [ ] Add `.env.example` with `MCP_API_KEY=` placeholder
- [ ] `npm run build` emits `build/http-server.js`
- [ ] Local curl: health OK
- [ ] Local curl: /mcp unauth → 401
- [ ] Local curl: /mcp with bearer → initialize response
- [ ] Local curl: x-api-key header variant → also works
- [ ] Commit: `feat(http): StreamableHTTP server with bearer auth`

## Success Criteria
All 4 local curl checks pass. `build/http-server.js` runs and exits cleanly on SIGTERM. Fails fast with clear message if `MCP_API_KEY` unset.

## Risk Assessment
| Risk | Mitigation |
|---|---|
| `timingSafeEqual` throws on length mismatch | Length-prefix guard returns 401 first |
| Auth middleware applied globally by mistake → `/health` blocked | Apply at route level only (`app.post('/mcp', requireAuth, …)`) |
| Express header case | Use lowercase `req.headers.authorization`, `req.headers['x-api-key']` |
| `sessionIdGenerator: undefined` unsupported in picked SDK version | Verify via example `simpleStatelessStreamableHttp.ts` at install time; fallback = use `randomUUID` stateful mode (minor impact) |
| `req.body` undefined | Ensure `express.json()` mounted before `/mcp` route |
| Large request bodies | `limit: '4mb'` enough for Bitrix payloads |
| Secret leaked in logs | Never log `req.headers.authorization`; log only `req.ip` + `req.path` on 401 |

## Security Considerations
- Constant-time compare: length-guarded `timingSafeEqual`
- Fail-fast on missing env var: no silent bypass
- `/health` deliberately public; contains no sensitive data
- No CORS wildcard needed (GoClaw server-side; skip `Access-Control-Allow-Origin: *`). If a browser client ever calls, revisit.
- HTTPS terminated by tose.sh edge — server speaks plain HTTP internally, fine
- Rate limiting: out of scope (YAGNI, single known client)

## Next Steps
Phase 04 — cleanup obsolete files + finalize package scripts + env example.
