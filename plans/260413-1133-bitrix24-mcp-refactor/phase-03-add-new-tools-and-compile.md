# Phase 3: New Tools Wiring + Compile Check

## Overview
- Priority: P1
- Status: pending
- Depends on: Phase 1, 2
- Wire new tools end-to-end, verify factory integration, run compile.

## Key Insights
- New tools (`deleteContact`, `deleteDeal`, `deleteCompany`, `getCRMStatuses`, `listActivities`) should already be added in phases 1-2; this phase verifies wiring & fills gaps.
- `mcp-server-factory.ts` imports `{ allTools, executeToolCall }` — no changes expected.

## Bitrix24 REST Methods for New Ops
| Tool | REST |
|------|------|
| deleteContact | `crm.contact.delete` {id} |
| deleteDeal | `crm.deal.delete` {id} |
| deleteCompany | `crm.company.delete` {id} |
| getCRMStatuses | `crm.status.list` {filter:{ENTITY_ID}} |
| listActivities | `crm.activity.list` {filter, select, order, start} |

## Implementation Steps
1. Verify each new client method exists and returns sensible shape (`boolean` for delete, arrays for list/status).
2. Verify tool defs include proper input schemas:
   - delete*: `{ id: string }`
   - getCRMStatuses: `{ entityId?: string }` (e.g. `DEAL_STAGE`, `CONTACT_TYPE`)
   - listActivities: `{ filter?: object, start?: number, limit?: number, order?: object }`
3. Verify `searchCRM` entity types default to `['contact','company','deal']` (no `'lead'`).
4. Verify `getUserPerformanceSummary` schema no longer has `includeConversionRates`.
5. Verify `compareUserPerformance` metric enum excludes `conversions`.
6. Run `npx tsc --noEmit` — fix any type errors.
7. Run `npm run build` if defined — fix errors.
8. Smoke grep: `grep -ri "lead" src/` should return zero hits (or only comment-style false positives).
9. Count tools: assert `allTools.length === 27`.

## Todo
- [ ] Verify all 5 new tools fully wired (client + def + handler)
- [ ] Input schemas correct
- [ ] searchCRM entity types cleaned
- [ ] Monitoring schemas stripped of lead options
- [ ] `tsc --noEmit` clean
- [ ] `npm run build` clean (if script exists)
- [ ] Zero lead references in `src/`
- [ ] `allTools.length === 27`

## Success Criteria
- Build passes.
- MCP server starts (stdio) and lists 27 tools without errors.
- No lead artifacts remain.

## Risks
- Bitrix24 REST may return different shapes for `crm.activity.list` than `listDeals` — handle `result` vs `result.items`.
- `crm.status.list` filter syntax — confirm via docs-seeker if errors.

## Unresolved Questions
1. Do task tool definitions currently exist in `src/tools/index.ts`? Grep shows none — need to create from scratch in phase 2 if confirmed missing.
2. Is there a `package.json` build script? Assumed `npx tsc --noEmit` fallback.
3. Should `Bitrix24Client` keep flat delegator methods forever, or migrate tools to use `bitrix24Client.contacts.create(...)` namespace in a follow-up? Current plan keeps flat for minimal churn.
