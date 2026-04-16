---
title: "Add Smart Item Tools (Invoice Support)"
description: "Add MCP tools for Smart Process Automation items (crm.item.*) to support invoice creation"
status: complete
priority: P1
effort: 45m
branch: main
tags: [mcp-tools, smart-invoice, crm-item]
created: 2026-04-16
---

# Add Smart Item Tools — Implementation Plan

## Overview

Add native MCP tools for Bitrix24 Smart Process Automation (SPA) items to enable Doanh Doanh to create invoices directly.

**Gap identified:** Agent can plan invoices but can't execute `crm.item.add` without native tool.

## Target Files

| File | Action |
|------|--------|
| `src/tools/smart-item-tools.ts` | Create new |
| `src/tools/index.ts` | Import + register |
| `src/bitrix24/client.ts` | Add helper methods |

## New Tools

| Tool | REST Method | Purpose |
|------|-------------|---------|
| `bitrix24_create_smart_item` | `crm.item.add` | Create invoice/SPA item |
| `bitrix24_get_smart_item` | `crm.item.get` | Get item by ID |
| `bitrix24_list_smart_items` | `crm.item.list` | List items with filter |
| `bitrix24_update_smart_item` | `crm.item.update` | Update item (mark paid, etc.) |
| `bitrix24_delete_smart_item` | `crm.item.delete` | Delete item |

## Key Parameters (create)

```typescript
{
  entityTypeId: number,     // 31 for EGANY invoices
  categoryId?: number,      // 2 for EGANY
  title: string,
  opportunity?: number,     // Amount (numeric)
  currencyId?: string,      // Default: VND
  stageId?: string,         // e.g. DT31_2:NEW
  assignedById?: number,
  contactId?: number,
  companyId?: number,
  parentId2?: number,       // Link to deal (entityType 2)
  // Custom fields via additionalFields object
}
```

## Implementation Steps

1. Create `src/tools/smart-item-tools.ts` with 5 tools
2. Add client methods: `createSmartItem`, `getSmartItem`, `listSmartItems`, `updateSmartItem`, `deleteSmartItem`
3. Register tools in `src/tools/index.ts`
4. Build and test

## Success Criteria

- [x] `bitrix24_create_smart_item` can create invoice with deal link
- [x] `bitrix24_list_smart_items` can filter by deal ID
- [x] `bitrix24_update_smart_item` can mark invoice as paid
- [x] Build passes
- [ ] Doanh Doanh can create 40-40-20 installment invoices (needs live test)

## Notes

- `opportunity` must be numeric, not string
- `categoryId: 2` is mandatory for EGANY invoices
- `currencyId: 'VND'` must be explicit
- `stageId` needs full prefix: `DT31_2:<code>`
