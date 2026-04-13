# Phase 1: Modularize `src/bitrix24/client.ts`

## Overview
- Priority: P1
- Status: pending
- Split 1423-line `client.ts` into a thin base + per-entity client modules.

## Key Insights
- Current class `Bitrix24Client` has: rate limiter, `makeRequest`, entity CRUD (contact/deal/lead/company/task), user ops, search, diagnostics, 4 monitoring methods (830-1382), activity/timeline helpers (1408+).
- `BitrixLead` interface and all lead methods MUST be removed.
- Singleton `bitrix24Client` instance is consumed across tools.
- Monitoring methods are long (~150 lines each) — keep them together in `monitoring-client.ts`.

## Architecture
```
src/bitrix24/
  client.ts              # BaseBitrixClient (makeRequest, rate limiter, types re-export, singleton)
  types.ts               # BitrixContact, BitrixDeal, BitrixCompany, BitrixTask (NO BitrixLead)
  contact-client.ts      # ContactClient extends BaseBitrixClient
  deal-client.ts         # DealClient
  company-client.ts      # CompanyClient
  task-client.ts         # TaskClient
  user-client.ts         # UserClient (getCurrentUser, getAllUsers only)
  activity-client.ts     # ActivityClient (createActivity, updateActivity, addTimelineComment, listActivities, getCRMStatuses, searchCRM)
  monitoring-client.ts   # MonitoringClient (monitorUserActivities, getUserPerformanceSummary, analyzeAccountPerformance, compareUserPerformance)
```

### Composition Strategy (KISS)
Use a facade: `client.ts` exports `Bitrix24Client` that composes all sub-clients via mixin OR simple delegation. Prefer delegation — create one shared `BaseBitrixClient` with `makeRequest`/rate limiter; each sub-client takes the base in its constructor.

```ts
// client.ts
export class Bitrix24Client {
  private base: BaseBitrixClient;
  public contacts: ContactClient;
  public deals: DealClient;
  // ...
  constructor() {
    this.base = new BaseBitrixClient();
    this.contacts = new ContactClient(this.base);
    // ...
  }
}
export const bitrix24Client = new Bitrix24Client();
```

**Decision point:** Tools currently call `bitrix24Client.createContact(...)`. To avoid touching every tool call site in phase 1, keep flat methods on `Bitrix24Client` as thin delegators: `createContact(x) { return this.contacts.create(x); }`. OR migrate tool call sites in phase 2. **Chosen: flat delegators** — tools code changes stay scoped to modularization + removal in phase 2.

## Related Code Files
**Read:**
- `src/bitrix24/client.ts` (full)
- `src/tools/index.ts` (to verify call sites)

**Create:**
- `src/bitrix24/types.ts`
- `src/bitrix24/base-client.ts` (or keep in client.ts)
- `src/bitrix24/contact-client.ts`
- `src/bitrix24/deal-client.ts`
- `src/bitrix24/company-client.ts`
- `src/bitrix24/task-client.ts`
- `src/bitrix24/user-client.ts`
- `src/bitrix24/activity-client.ts`
- `src/bitrix24/monitoring-client.ts`

**Modify:**
- `src/bitrix24/client.ts` — becomes thin facade + singleton.

## Implementation Steps
1. Create `types.ts`; move `BitrixContact`, `BitrixDeal`, `BitrixCompany`, `BitrixTask`. DELETE `BitrixLead`.
2. Extract `BaseBitrixClient` (rate limiter state, `makeRequest`, constructor with webhook URL) into `base-client.ts`.
3. Create `contact-client.ts` with `create/get/update/delete/list`. Implement `deleteContact` via `crm.contact.delete`.
4. Create `deal-client.ts` with `create/get/update/delete/list/getDealPipelines/getDealStages`. Implement `deleteDeal`.
5. Create `company-client.ts` with `create/get/update/delete/list`. Implement `deleteCompany`.
6. Create `task-client.ts` with `create/get/update/list` (NO delete per spec).
7. Create `user-client.ts` with `getCurrentUser`, `getAllUsers` ONLY. Drop `getUser`, `getUsersByIds`, `resolveUserNames`.
8. Create `activity-client.ts` with `createActivity`, `updateActivity`, `addTimelineComment`, `listActivities` (new — `crm.activity.list`), `getCRMStatuses` (new — `crm.status.list`), `searchCRM` (strip `'lead'` from default entity types).
9. Create `monitoring-client.ts`. Copy `monitorUserActivities`, `getUserPerformanceSummary`, `analyzeAccountPerformance`, `compareUserPerformance`. **Remove** any lead branches, `includeConversionRates` option logic, `conversions` metric handling.
10. Rewrite `client.ts` → exports `Bitrix24Client` facade with flat delegator methods mirroring old public API (minus removed methods) + `bitrix24Client` singleton.
11. Remove methods not in final tool list: `getLatestContacts`, `getLatestDeals`, `getDealsFromDateRange`, all lead methods, `getLatestCompanies`, `getCompaniesFromDateRange`, `resolveUserNames`, `validateWebhook`, `diagnosePermissions`, `checkCRMSettings`, `testLeadsAPI`, `monitorSalesActivities`, `getTeamDashboard`, `analyzeCustomerEngagement`, `getUser`, `getUsersByIds`.

## Todo
- [ ] Create `types.ts` (no lead)
- [ ] Create `base-client.ts`
- [ ] Create `contact-client.ts` with deleteContact
- [ ] Create `deal-client.ts` with deleteDeal
- [ ] Create `company-client.ts` with deleteCompany
- [ ] Create `task-client.ts`
- [ ] Create `user-client.ts`
- [ ] Create `activity-client.ts` with listActivities + getCRMStatuses
- [ ] Create `monitoring-client.ts` (no lead/conversion logic)
- [ ] Rewrite `client.ts` as facade
- [ ] `npx tsc --noEmit` passes

## Success Criteria
- Each new file < 250 lines.
- `client.ts` < 200 lines.
- `grep -i lead src/bitrix24/` returns nothing.
- TypeScript compiles.

## Risks
- Monitoring methods may reference lead fields deep inside — must scrub carefully.
- Flat delegator API must match old signatures exactly to keep phase 2 diff small.
