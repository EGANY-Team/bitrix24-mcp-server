# Phase 2: Modularize `src/tools/index.ts` + Remove Leads & Redundant Tools

## Overview
- Priority: P1
- Status: pending
- Depends on: Phase 1
- Split 1644-line `tools/index.ts` into per-entity modules; drop all removed tools.

## Key Insights
- Current `index.ts` has definitions (~lines 1-1047) then `executeToolCall` switch (line 1048+).
- Factory imports `{ allTools, executeToolCall }` — names MUST be preserved.
- Each per-entity module owns both definitions AND a handler function; `index.ts` composes.

## Architecture
```
src/tools/
  index.ts              # imports * as, exports allTools = [...], executeToolCall dispatcher
  contact-tools.ts      # contactTools: Tool[], handleContactTool(name, args)
  deal-tools.ts
  company-tools.ts
  task-tools.ts
  user-tools.ts
  activity-tools.ts
  monitoring-tools.ts
  utility-tools.ts      # searchCRM, getCRMStatuses (+ handler)
```

Handler pattern (DRY):
```ts
export async function handleContactTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_contact': return bitrix24Client.createContact(args);
    // ...
    default: return null; // signal not-handled
  }
}
```

`index.ts` dispatcher tries each handler; throws `McpError` if none match.

## Tools to REMOVE (from current file)
- `bitrix24_get_latest_contacts`
- `bitrix24_get_latest_deals`, `bitrix24_get_deals_from_date_range`
- `bitrix24_create_lead`, `bitrix24_get_lead`, `bitrix24_list_leads`, `bitrix24_get_latest_leads`, `bitrix24_get_leads_from_date_range`, `bitrix24_update_lead`
- `bitrix24_get_latest_companies`, `bitrix24_get_companies_from_date_range`
- `bitrix24_validate_webhook`, `bitrix24_diagnose_permissions`, `bitrix24_check_crm_settings`, `bitrix24_test_leads_api`
- `bitrix24_filter_deals_by_pipeline`, `bitrix24_filter_deals_by_budget`, `bitrix24_filter_deals_by_status`
- `bitrix24_track_deal_progression`, `bitrix24_monitor_sales_activities`, `bitrix24_generate_sales_report`, `bitrix24_get_team_dashboard`, `bitrix24_analyze_customer_engagement`, `bitrix24_forecast_performance`
- `bitrix24_get_user`, `bitrix24_resolve_user_names`
- `bitrix24_get_contacts_with_user_names`, `bitrix24_get_deals_with_user_names`, `bitrix24_get_leads_with_user_names`, `bitrix24_get_companies_with_user_names`

## Tools to KEEP (per module)
- **contact-tools.ts**: bitrix24_create_contact, _get_contact, _list_contacts, _update_contact, _delete_contact (new)
- **deal-tools.ts**: _create_deal, _get_deal, _list_deals, _update_deal, _delete_deal (new), _get_deal_pipelines, _get_deal_stages
- **company-tools.ts**: _create_company, _get_company, _list_companies, _update_company, _delete_company (new)
- **task-tools.ts**: _create_task, _get_task, _list_tasks, _update_task  *(verify current tool names exist; add if missing)*
- **activity-tools.ts**: _create_activity, _update_activity, _add_timeline_comment, _list_activities (new)
- **user-tools.ts**: _get_current_user, _get_all_users
- **utility-tools.ts**: _search_crm (no lead in entityTypes), _get_crm_statuses (new)
- **monitoring-tools.ts**: _monitor_user_activities, _get_user_performance_summary, _analyze_account_performance, _compare_user_performance
  - Remove `includeConversionRates` from `_get_user_performance_summary` schema.
  - Remove `'conversions'` from `_compare_user_performance` metric enum/description.

## Related Code Files
**Modify:** `src/tools/index.ts` (becomes thin aggregator).
**Create:** 8 files in `src/tools/`.

## Implementation Steps
1. Create `contact-tools.ts`: copy 5 tool defs + handler.
2. Create `deal-tools.ts`: copy 7 tool defs (no filter*/date range/latest) + handler.
3. Create `company-tools.ts`: 5 defs + handler.
4. Check if task tools exist in old `index.ts` — if not (they aren't in grep output above!), add them now per spec. **UNRESOLVED: verify task tool definitions currently exist.**
5. Create `activity-tools.ts`: 4 defs (create, update, addTimelineComment, listActivities) + handler.
6. Create `user-tools.ts`: 2 defs + handler.
7. Create `utility-tools.ts`: searchCRM (strip lead from entityTypes param default/enum), getCRMStatuses + handler.
8. Create `monitoring-tools.ts`: 4 defs (lead options removed) + handler.
9. Rewrite `index.ts`:
   ```ts
   import { contactTools, handleContactTool } from './contact-tools.js';
   // ...
   export const allTools = [...contactTools, ...dealTools, ...companyTools, ...taskTools, ...activityTools, ...userTools, ...utilityTools, ...monitoringTools];
   export async function executeToolCall(name: string, args: any): Promise<any> {
     const handlers = [handleContactTool, handleDealTool, handleCompanyTool, handleTaskTool, handleActivityTool, handleUserTool, handleUtilityTool, handleMonitoringTool];
     for (const h of handlers) {
       const r = await h(name, args);
       if (r !== undefined) return r;
     }
     throw new Error(`Unknown tool: ${name}`);
   }
   ```
10. Confirm `allTools.length === 27`.

## Todo
- [ ] contact-tools.ts (incl delete)
- [ ] deal-tools.ts (incl delete, no filter/date/latest)
- [ ] company-tools.ts (incl delete)
- [ ] task-tools.ts
- [ ] activity-tools.ts (incl listActivities)
- [ ] user-tools.ts
- [ ] utility-tools.ts (searchCRM no lead, getCRMStatuses)
- [ ] monitoring-tools.ts (lead options stripped)
- [ ] index.ts rewritten as aggregator
- [ ] Verify 27 tools
- [ ] `tsc --noEmit` passes

## Success Criteria
- `allTools` has exactly 27 entries.
- Each tool file < 250 lines; `index.ts` < 80 lines.
- No `lead` references in `src/tools/`.

## Risks
- Handler dispatcher returning `undefined` vs `null` — use `undefined` sentinel consistently.
- Task tools may not exist currently; need definitions from scratch.
