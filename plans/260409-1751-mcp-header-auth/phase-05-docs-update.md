# Phase 05 — Docs Update

## Context Links
- `CLAUDE_REMOTE_SETUP.md` — remote client setup guide (primary target)
- `AZURE_DEPLOYMENT_GUIDE.md`, `AZURE_MCP_DEPLOYMENT_GUIDE_ENHANCED.md` — deprecate pending Q1
- `README.md` — top-level overview, remote section
- Brainstorm §5.4 GoClaw config

## Overview
**Priority:** P2
**Status:** pending
Update user-facing docs to reflect: (a) new HTTP entry + StreamableHTTP transport, (b) bearer auth requirement, (c) GoClaw config with Authorization header, (d) deprecation note on Azure guides.

## Key Insights
- Repo has ~30 top-level `.md` files (historical). Only touch the few that users actually follow: `CLAUDE_REMOTE_SETUP.md`, `README.md`, Azure guides.
- GoClaw config is the key new section — precise field values matter.
- Key generation command: `openssl rand -base64 32`. Document but do NOT include sample key in docs.
- Do not create new docs proactively (YAGNI); extend existing.

## Requirements
- `CLAUDE_REMOTE_SETUP.md` updated with new URL + bearer header + stateless note
- `README.md` remote section mentions `MCP_API_KEY` env var, `start:http` script, GoClaw integration
- Azure guides carry a top banner: "DEPRECATED pending host decision — see unresolved Q1" (do not delete content; may revive)
- New GoClaw config subsection with table: Transport / URL / Header / Tool Prefix / Timeout

## Related Code Files
**Modify**
- `CLAUDE_REMOTE_SETUP.md`
- `README.md`
- `AZURE_DEPLOYMENT_GUIDE.md` (deprecation banner only)
- `AZURE_MCP_DEPLOYMENT_GUIDE_ENHANCED.md` (deprecation banner only)

**Do NOT create**
- New `GOCLAW_SETUP.md` (fold into `CLAUDE_REMOTE_SETUP.md` instead — DRY)

## Implementation Steps
1. `CLAUDE_REMOTE_SETUP.md`:
   - Add "Streamable HTTP" section explaining new entry
   - Document `MCP_API_KEY` env var requirement
   - Add GoClaw config table (Transport=Streamable HTTP, URL=`https://egany-bitrix24-mcp.tose.sh/mcp`, Header `Authorization`=`Bearer <key>`, Tool Prefix=`bitrix24_`)
   - Key generation: `openssl rand -base64 32`
   - Remove references to `mcp-proxy.cjs`
2. `README.md`:
   - Update "Remote" section (if exists) to point at new URL
   - Add note: set `MCP_API_KEY` before running `npm run start:http`
   - Add one-liner: `openssl rand -base64 32`
3. `AZURE_DEPLOYMENT_GUIDE.md` + enhanced variant:
   - Add top banner:
     ```
     > **DEPRECATED (2026-04-09):** Primary deployment moved to tose.sh.
     > This guide retained pending host-consolidation decision.
     > See plans/260409-1751-mcp-header-auth/plan.md §Unresolved Questions.
     ```
4. Optional: if any config in `CLAUDE_REMOTE_SETUP.md` shows stdio→proxy pattern, mark stdio path as "local dev only".

## Todo List
- [ ] Update `CLAUDE_REMOTE_SETUP.md` with HTTP + auth + GoClaw section
- [ ] Update `README.md` remote section
- [ ] Add deprecation banner to both Azure guides
- [ ] Remove any `mcp-proxy.cjs` references from docs
- [ ] Search `grep -l mcp-proxy *.md` — clean all hits
- [ ] Commit: `docs: HTTP transport + bearer auth + GoClaw setup`

## Success Criteria
- A new user following `CLAUDE_REMOTE_SETUP.md` can configure GoClaw end-to-end
- No doc still references spawn-per-request `server.js` model
- Azure guides flagged deprecated but not deleted
- No `mcp-proxy.cjs` mentions remain

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Doc drift — user follows old guide | Deprecation banners; README links to canonical guide |
| Accidentally including real key in example | Use `<YOUR_KEY>` placeholder exclusively; review diff before commit |
| Missing references in other `.md` files | `grep -rn "mcp-proxy\|server.js" *.md` sweep |

## Security Considerations
- Placeholder keys only, never real values
- Warn: never commit `.env` or paste key in screenshots
- Document rotation: update env var → redeploy → update GoClaw Headers

## Next Steps
Phase 06 — live smoke tests to confirm docs match reality.
