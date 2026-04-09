# Phase 04 — Cleanup + Package Scripts + Deploy Config

## Context Links
- `package.json` (current scripts `start`, `azure:start` both point to `server.js`)
- `server.js` (spawn-per-request body — obsolete)
- `mcp-proxy.cjs` (stdio→HTTPS bridge — obsolete once GoClaw connects directly)
- Brainstorm §5.2 delete list

## Overview
**Priority:** P2
**Status:** pending
Delete obsolete files, update `package.json` scripts, ensure tose.sh start command points to new HTTP entry. Add `.env.example` if not done in phase 03.

## Key Insights
- `main` field in `package.json` currently `server.js` — change to `build/http-server.js` (or drop since `type: module` ESM).
- `bin` field stays at `./build/index.js` (stdio entry for Claude Desktop via `npx`).
- tose.sh may use `npm start`, or `Procfile`, or explicit start command in platform UI — needs verification. If `npm start` is used, repoint script to HTTP entry.
- `postinstall` currently auto-runs build — leave as-is.
- `mcp-proxy.cjs` safe to delete: GoClaw connects directly; no existing integration depends on proxy.
- `server.js` decision: either delete entirely OR replace with one-liner that re-exports `build/http-server.js`. Delete preferred.

## Requirements
- `npm start` boots HTTP server (not legacy spawn wrapper)
- `npm run start:http` explicit alias
- Stdio entry still accessible via `node build/index.js` and `npx bitrix24-mcp`
- `mcp-proxy.cjs`, `server.js` removed from repo
- `MCP_API_KEY` documented in `.env.example`
- tose.sh deployment start command verified/updated

## Architecture
Deployment topology:
```
tose.sh  ──start cmd──▶  node build/http-server.js  ──:3000──▶  GoClaw
```
No spawn wrapper, no proxy.

## Related Code Files
**Delete**
- `mcp-proxy.cjs`
- `server.js`

**Modify**
- `package.json` — scripts, main, dependencies, devDependencies
- `.env.example` — add `MCP_API_KEY=` (if not done in phase 03)

**Verify (may modify)**
- tose.sh platform config (Procfile, Dockerfile, or platform UI)

## Implementation Steps
1. Edit `package.json`:
   - `"main": "build/http-server.js"` (or remove — non-essential for ESM)
   - `"scripts"`:
     - `"start": "node build/http-server.js"`
     - `"start:http": "node build/http-server.js"`
     - `"start:stdio": "node build/index.js"` (new, for clarity)
     - `"azure:start": "node build/http-server.js"` (update — pending unresolved Q1)
   - `"dependencies"`: ensure `"express": "^4.19.0"` present (install if skipped in phase 03)
   - `"devDependencies"`: `"@types/express": "^4.17.21"`
2. `npm install` to refresh lockfile.
3. `rm mcp-proxy.cjs server.js`.
4. Create/update `.env.example`:
   ```
   BITRIX24_WEBHOOK_URL=https://your-portal.bitrix24.com/rest/1/YOUR_KEY/
   PORT=3000
   MCP_API_KEY=
   ```
5. `npm run build` → expect `build/index.js` + `build/http-server.js` + `build/mcp-server-factory.js`.
6. `npm start` locally with `MCP_API_KEY` set — confirm HTTP boot, `/health` responds.
7. tose.sh deployment config:
   - Check repo for `Procfile`, `Dockerfile`, `web.config` (Azure-specific — leave alone pending Q1)
   - If platform UI sets start command explicitly → update to `node build/http-server.js`
   - If uses `npm start` → already pointing at correct entry after step 1
   - Add `MCP_API_KEY` env var in tose.sh UI with SECRET flag (value from `openssl rand -base64 32`)
8. Commit: `chore: drop legacy server.js + mcp-proxy, wire http entry`

## Todo List
- [ ] Update `package.json` scripts, main, deps
- [ ] `npm install` (lockfile refresh)
- [ ] Delete `mcp-proxy.cjs`
- [ ] Delete `server.js`
- [ ] Create/update `.env.example` with `MCP_API_KEY`
- [ ] `npm run build` emits both entries
- [ ] `npm start` local smoke
- [ ] Inspect tose.sh start config (Procfile / platform UI)
- [ ] Set `MCP_API_KEY` in tose.sh env (SECRET flag)
- [ ] Generate key with `openssl rand -base64 32` and store in password manager
- [ ] Commit cleanup

## Success Criteria
- Repo has no `server.js`, no `mcp-proxy.cjs`
- `npm start` boots HTTP server
- `npm run build` emits `build/http-server.js`, `build/index.js`, `build/mcp-server-factory.js`
- tose.sh env var `MCP_API_KEY` set as SECRET
- Next deploy uses `node build/http-server.js`

## Risk Assessment
| Risk | Mitigation |
|---|---|
| `web.config` still expects `server.js` (Azure IIS) | Leave `web.config` untouched; Azure path deprecated pending Q1 |
| tose.sh cached old start command | Explicit redeploy after config change |
| `npm start` script change breaks existing tooling | Provide `start:stdio` alias; document migration in phase 05 |
| `postinstall` build failure if tsc errors | Already has `try/catch` wrapper in package.json |
| Lockfile conflicts | Commit `package-lock.json` together with `package.json` |

## Security Considerations
- Never commit `.env` (only `.env.example`)
- Generate `MCP_API_KEY` with `openssl rand -base64 32`, not a human string
- Set SECRET flag in tose.sh UI so value masked in dashboard

## Next Steps
Phase 05 — docs. Phase 06 — verification against live deployment.
