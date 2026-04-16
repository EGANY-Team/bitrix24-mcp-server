---
title: "Customer Intake Workflow for crm-ops-egany"
description: "Add name card/customer info intake workflow to EGANY skill with corrected staff IDs"
status: complete
priority: P2
effort: 30m
branch: main
tags: [skill-update, crm-ops-egany, workflow]
created: 2026-04-16
---

# Customer Intake Workflow — Implementation Plan

## Overview

Update `crm-ops-egany` skill to handle inbound customer info (name card images or text) with automated workflow: extract → dedup → save contact → create follow-up activity → ask smart questions.

**Brainstorm Report:** [brainstorm-260416-1454-customer-intake-workflow.md](../reports/brainstorm-260416-1454-customer-intake-workflow.md)

## Target Files

| File | Action |
|------|--------|
| `~/.claude/skills/crm-ops-egany/references/constants.md` | Fix staff IDs |
| `~/.claude/skills/crm-ops-egany/SKILL.md` | Add workflow section |

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Fix Staff ID Table](./phase-01-fix-staff-ids.md) | complete | 5m |
| 2 | [Add Customer Intake Workflow](./phase-02-add-intake-workflow.md) | complete | 25m |

## Key Changes

### Staff ID Corrections
| Staff | Old ID | New ID | Notes |
|-------|--------|--------|-------|
| Quỳnh | 20 | **1** | Webhook owner, DEFAULT assignee |
| Như | 24 (webhook owner) | 24 | NOT webhook owner |

### New Workflow Features
- Name card OCR via `ai-multimodal` skill
- Dedup check before contact creation
- Activity creation with smart defaults
- Vietnamese prompts for follow-up questions

## Success Criteria

- [x] Staff IDs match actual Bitrix24 user IDs
- [x] Quỳnh (1) marked as webhook owner and default assignee
- [x] Customer Intake Workflow section added to SKILL.md
- [x] Workflow covers: extract → dedup → create → activity → questions

## Dependencies

- `ai-multimodal` skill for image OCR
- Existing MCP tools: `bitrix24_search_crm`, `bitrix24_create_contact`, `bitrix24_create_activity`
