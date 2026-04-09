# Phase 06 — Verification + Smoke Tests

## Context Links
- Brainstorm §7 success metrics
- Phase 03 local curls (repeat against live deploy)
- Phase 01 stdio regression (repeat after full chain)

## Overview
**Priority:** P2
**Status:** pending
End-to-end verification that GoClaw connects, auth works, tools invoke, and stdio regression still holds.

## Key Insights
- Must test against **live** `https://egany-bitrix24-mcp.tose.sh` after deploy, not just localhost.
- `initialize` must include `Accept: application/json, text/event-stream` header per MCP Streamable HTTP spec (some transports require both media types).
- Use one stateless flow per curl; no persistent session id needed.
- GoClaw Test Connection should turn green within seconds (no 15s timeout).

## Requirements
All six smoke checks below must pass:

| # | Check | Expected |
|---|---|---|
| 1 | `curl -s -X POST https://.../mcp -H 'Content-Type: application/json' -d '{}'` | HTTP 401 |
| 2 | `curl -s https://.../health` | HTTP 200, JSON `{status:'ok', …}` |
| 3 | `curl -s -X POST https://.../mcp -H 'Authorization: Bearer $MCP_API_KEY' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'` | HTTP 200 with MCP initialize result |
| 4 | GoClaw Test Connection against new URL | Green, no timeout |
| 5 | GoClaw `tools/list` | Returns all `bitrix24_*` tools |
| 6 | GoClaw invokes `bitrix24_get_current_user` | Returns Bitrix user JSON |
| 7 | Claude Desktop stdio regression | Still lists + invokes tools |

## Related Files
No code changes in this phase. Only verification.

## Implementation Steps
1. Confirm tose.sh deploy succeeded after phase 04 commits (check platform logs).
2. Confirm `MCP_API_KEY` env var set on tose.sh (SECRET flag).
3. Run smoke check #1 (unauth → 401).
4. Run smoke check #2 (`/health` → 200).
5. Export `MCP_API_KEY` locally from password manager; run smoke check #3 (initialize).
6. Open GoClaw, configure per `CLAUDE_REMOTE_SETUP.md`:
   - Transport: Streamable HTTP
   - URL: `https://egany-bitrix24-mcp.tose.sh/mcp`
   - Headers: `Authorization` = `Bearer <paste key>`
7. Click Test Connection → expect green.
8. Inspect tools list in GoClaw → expect all `bitrix24_*` names.
9. Invoke `bitrix24_get_current_user` → expect user JSON.
10. Open Claude Desktop → confirm stdio entry still lists tools (pick any one tool + invoke).
11. Record results in this file's Todo checkboxes + note any deltas.

## Todo List
- [ ] Verify tose.sh deploy green
- [ ] Verify `MCP_API_KEY` env set (SECRET)
- [ ] Smoke #1: unauth → 401
- [ ] Smoke #2: `/health` → 200
- [ ] Smoke #3: authed initialize → 200
- [ ] Smoke #4: GoClaw Test Connection → green
- [ ] Smoke #5: GoClaw tools/list
- [ ] Smoke #6: GoClaw `bitrix24_get_current_user`
- [ ] Smoke #7: Claude Desktop stdio regression
- [ ] Update plan.md status → completed
- [ ] Capture any residual issues as new task entries

## Success Criteria
All 7 smoke checks green. `plan.md` status flipped to `completed`. Brainstorm §7 metrics satisfied.

## Risk Assessment
| Risk | Mitigation |
|---|---|
| GoClaw still times out despite correct config | Check phase 03 stateless wiring; verify `Accept` header handling; inspect server logs for 400/500 |
| Tool call returns Bitrix permission error | Unrelated to this plan — webhook scope issue; document separately |
| `/health` blocked by platform | Confirm tose.sh routes `/health` unauthenticated by default |
| Deploy cache stale | Force redeploy from tose.sh dashboard |
| 401 despite correct key | Verify `.env` → process.env loading path; check base64 padding/whitespace in pasted key |

## Security Considerations
- Do not paste real `MCP_API_KEY` into terminal history on shared machines; use `read -s` or env file
- Rotate key after verification if it was ever displayed on screen during debugging
- Verify no key echoed in server stderr logs during smoke

## Next Steps
- If all green → close plan, archive, commit final summary
- If any fail → diagnose, file fix task, loop back to relevant phase
- Revisit unresolved questions from `plan.md` with captured data (GoClaw header quirks, host consolidation)
