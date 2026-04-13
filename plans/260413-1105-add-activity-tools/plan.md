---
title: "Add Activity MCP Tools"
description: "Expose crm.activity.add and crm.activity.update as native MCP tools"
status: pending
priority: P2
effort: 1h
branch: main
tags: [bitrix24, mcp, crm, activities]
created: 2026-04-13
---

# Add Activity MCP Tools

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Implement tools | pending | [phase-01-implement-activity-tools.md](./phase-01-implement-activity-tools.md) |

## Dependencies
- `src/tools/index.ts` — tool definitions + `allTools` array + `executeToolCall` switch
- `src/bitrix24/client.ts` — `makeRequest` method
- `~/.claude/skills/crm-ops/references/activities.md` — REST field spec
