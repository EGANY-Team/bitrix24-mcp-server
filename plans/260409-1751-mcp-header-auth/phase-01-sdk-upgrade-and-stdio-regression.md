# Phase 01 — SDK Upgrade + Stdio Regression

## Context Links
- Brainstorm: `../reports/brainstorm-260409-1751-mcp-header-auth.md` §3 SDK 0.4 gap
- SDK research: `reports/sdk-upgrade-research.md` (import paths, ctor changes, capabilities arg)
- Files: `src/index.ts:3-11,14-20` (Server ctor, imports), `src/tools/index.ts:1,916,973` (Tool type, allTools, executeToolCall)

## Overview
**Priority:** P2 — blocks everything else
**Status:** pending
Bump `@modelcontextprotocol/sdk` from `^0.4.0` to latest `^1.x` (≥1.10). Audit breaking changes, fix typecheck + runtime. Verify stdio entry still lists tools under Claude Desktop before touching HTTP. **Highest-risk phase.** If breakage cannot be resolved in ~3h budget, STOP, re-scope.

## Key Insights
- v1.x keeps low-level `setRequestHandler(ListToolsRequestSchema, …)` pattern — no forced migration to `McpServer`/`registerTool`. Minimal diff.
- Likely only change: `Server` ctor takes `(info, options)` two-arg form; current code stuffs everything into one arg.
- All type imports (`Tool`, `McpError`, `ErrorCode`, request schemas) stay at `@modelcontextprotocol/sdk/types.js`.
- Transport import stays at `server/stdio.js`.
- Check `Tool` type compatibility — `src/tools/index.ts` uses `Tool` from types.js on many exports.

## Requirements
**Functional**
- `npm run build` passes with zero `tsc` errors.
- `node build/index.js` boots without crash, responds to stdin `{"jsonrpc":"2.0","id":1,"method":"tools/list"}` with full tool list.
- Claude Desktop config using stdio path continues to list all `bitrix24_*` tools.

**Non-functional**
- No changes to tool business logic or `src/bitrix24/client.ts`.
- No new runtime deps in this phase (defer `express` to phase 03).

## Architecture
Unchanged at runtime: stdio → Server → tool handlers → bitrix24 client. Only import paths, types, and ctor call site may shift.

## Related Code Files
**Modify**
- `package.json` — bump `@modelcontextprotocol/sdk` to `^1.10.0`
- `src/index.ts` — fix `Server` ctor to 2-arg form if tsc complains; update imports if renamed
- `src/tools/index.ts` — only if `Tool` type shape changed (unlikely)

**Read-only reference**
- `src/bitrix24/client.ts` (1409 lines) — untouched
- `src/config/`, `src/utils/` — untouched

## Implementation Steps
1. `npm view @modelcontextprotocol/sdk version` — record exact latest.
2. Edit `package.json`: set `@modelcontextprotocol/sdk` to `^1.10.0` (or newer pin). Run `npm install`.
3. `npm run build`. Capture tsc errors.
4. For each error:
   - If `Server` ctor signature mismatch → split into `new Server({name, version}, {capabilities: {tools: {}}})`.
   - If schema import renamed → update path. (Expect no change.)
   - If `Tool` type field missing → adjust to new required fields (expect none for simple tools).
5. Rebuild until green.
6. Runtime smoke: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js` — expect JSON response with tools array on stdout, banner on stderr.
7. Claude Desktop regression: point existing `claude_desktop_config.json` stdio entry at new build; restart Claude Desktop; verify `bitrix24_*` tools appear and one trivial call works (e.g. `bitrix24_get_current_user`).

## Todo List
- [ ] Query + record latest SDK version
- [ ] Bump `package.json`, `npm install`
- [ ] Fix `src/index.ts` Server ctor (2-arg form)
- [ ] Fix any residual tsc errors
- [ ] `npm run build` green
- [ ] Stdio stdin smoke test returns tools list
- [ ] Claude Desktop manual regression
- [ ] Commit checkpoint: `chore(sdk): bump @modelcontextprotocol/sdk to ^1.10`

## Success Criteria
- `npm run build` exits 0
- Stdin smoke test lists all tools
- Claude Desktop lists + invokes at least one tool end-to-end
- No changes beyond `package.json`, `package-lock.json`, `src/index.ts` (ideal)

## Risk Assessment
| Risk | Likelihood | Mitigation |
|---|---|---|
| Tool handler request shape changed | Low | SDK keeps v1 compat for low-level API; fix per error message |
| Capabilities declaration format differs | Med | Swap to 2-arg ctor per research doc |
| `Tool` type gained required field (e.g. `outputSchema`) | Low | Make optional fields explicit; grep all `: Tool =` declarations |
| `node-fetch` incompat with new SDK peer | Low | node-fetch already v3 ESM, unrelated |
| Budget blown (>3h) | Med | STOP. Escalate. Consider pinning to specific 1.x minor that matches SDK changelog with smallest delta |

## Security Considerations
None new in this phase. Auth lands in phase 03.

## Next Steps
- On success → phase 02 (factory extraction).
- On failure → re-plan, possibly stage SDK upgrade separately or pin intermediate version.
