---
title: "Header-bearer auth + StreamableHTTP migration for remote MCP"
description: "Migrate bitrix24-mcp-server HTTP transport to StreamableHTTPServerTransport with bearer-token auth, unblock GoClaw."
status: completed
priority: P2
effort: 8-12h
branch: main
tags: [mcp, auth, transport, refactor]
created: 2026-04-09
---

# Plan — MCP Header Auth + StreamableHTTP Migration

## Context
- Brainstorm: `plans/reports/brainstorm-260409-1751-mcp-header-auth.md` (Option C locked)
- SDK research: `reports/sdk-upgrade-research.md`
- Problem: GoClaw times out on `https://egany-bitrix24-mcp.tose.sh/mcp` because `server.js` spawns `node build/index.js` per POST (no SSE, no handshake). Endpoint also unauthenticated.
- Fix: bump SDK 0.4→^1.x, extract factory, new Express `src/http-server.ts` with `StreamableHTTPServerTransport` (stateless) + bearer auth. Delete `mcp-proxy.cjs` and legacy spawn body in `server.js`.

## Goal
GoClaw "Test Connection" green against `/mcp` with `Authorization: Bearer $MCP_API_KEY`; unauth requests 401; stdio entry under Claude Desktop unchanged.

## Phases

| # | Phase | Status | Effort |
|---|---|---|---|
| 01 | [SDK upgrade + stdio regression](phase-01-sdk-upgrade-and-stdio-regression.md) | completed (local) | 2-4h |
| 02 | [Extract `createBitrixMcpServer` factory](phase-02-extract-mcp-server-factory.md) | completed (local) | 1h |
| 03 | [HTTP server + auth + StreamableHTTP](phase-03-http-server-with-auth.md) | completed (local) | 2-3h |
| 04 | [Cleanup + package scripts](phase-04-cleanup-and-package-scripts.md) | completed (local) | 1h |
| 05 | [Docs update](phase-05-docs-update.md) | completed (local) | 1h |
| 06 | [Verification + smoke tests](phase-06-verification-and-smoke-tests.md) | completed (local) | 1-2h |

## Key Dependencies
- Phase 01 blocks all. If SDK breakage budget exceeded → STOP, re-plan.
- Phase 02 depends on 01. Phase 03 depends on 02. Phase 04/05 depend on 03. Phase 06 last.
- tose.sh start command override (phase 04) — may need Procfile/Dockerfile inspection if just `package.json` script doesn't take effect.

## Out of Scope
- OAuth 2.1 / JWT / multi-tenant keys (YAGNI)
- Azure deployment revival (see unresolved Q1)
- Stateful session mode (stateless chosen)

## Unresolved Questions
1. Is tose.sh replacing Azure or parallel? → affects phase 05 deprecation scope.
2. Multi-tenant future? → may obsolete single-key model.
3. GoClaw header encoding quirks? → only surfaces if phase 06 fails.
