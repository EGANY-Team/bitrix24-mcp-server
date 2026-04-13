---
title: "Bitrix24 MCP Refactor: Modularize + Lean Toolset"
description: "Split oversized client.ts & tools/index.ts into per-entity modules, remove leads + redundant tools, add delete ops and status/activity queries."
status: complete
priority: P1
effort: 3h
branch: main
tags: [refactor, typescript, mcp, bitrix24]
created: 2026-04-13
---

## Goals
1. Modularize `src/bitrix24/client.ts` (1423L) and `src/tools/index.ts` (1644L) into per-entity files (<200L each).
2. Remove all lead-related code (interface, methods, tools).
3. Remove redundant tools (getLatest*, dateRange*, filterDealsBy*, *WithUserNames, resolveUserNames, validateWebhook, diagnosePermissions, checkCRMSettings, testLeadsAPI, trackDealProgression, generateSalesReport, forecastPerformance, monitorSalesActivities, getTeamDashboard, analyzeCustomerEngagement, getUser).
4. Add new tools: `deleteContact`, `deleteDeal`, `deleteCompany`, `getCRMStatuses`, `listActivities`.
5. Strip lead-dependent options from monitoring (`includeConversionRates`, `conversions` metric).

## Final Tool List (27)
- Contacts (5): create, get, list, update, delete
- Deals (7): create, get, list, update, delete, getDealPipelines, getDealStages
- Companies (5): create, get, list, update, delete
- Tasks (4): create, get, list, update
- Activities (4): createActivity, updateActivity, addTimelineComment, listActivities
- Users (2): getCurrentUser, getAllUsers
- Utility (2): getCRMStatuses, searchCRM (no lead)
- Monitoring (4): monitorUserActivities, getUserPerformanceSummary, analyzeAccountPerformance, compareUserPerformance

## Phases
| # | File | Status | Effort |
|---|------|--------|--------|
| 1 | [phase-01-modularize-client.md](./phase-01-modularize-client.md) | complete | 1.25h |
| 2 | [phase-02-modularize-tools-remove-leads.md](./phase-02-modularize-tools-remove-leads.md) | complete | 1.25h |
| 3 | [phase-03-add-new-tools-and-compile.md](./phase-03-add-new-tools-and-compile.md) | complete | 0.5h |

## Key Dependencies
- `src/mcp-server-factory.ts` imports `{ allTools, executeToolCall }` from `./tools/index.js` — must remain exported.
- Singleton `bitrix24Client` must stay importable from `src/bitrix24/client.ts` for backward compatibility (or via re-export).

## Success Criteria
- `npm run build` (or `tsc`) passes with zero errors.
- All 27 tools exported in `allTools`; `executeToolCall` routes all 27.
- Zero occurrences of `lead`/`Lead` in src (except false positives if any — verify with Grep).
- No file in `src/bitrix24/` or `src/tools/` exceeds ~250 lines.
