<!-- Next Session: 10 | Next Task: 25 -->

# Task Log — bitrix24-mcp-server

## Session 1 — 2026-04-09 (19:40–22:26)

### Task 1 — Create `crm-ops` agent skill
- **Time:** 19:40–19:52
- **Spend:** ~12 min
- **Context:** User wanted a reusable skill teaching Claude how to drive Bitrix24 CRM ops (deals, contacts, leads, companies, tasks, timeline comments, activities) via the `bitrix24-mcp-server`. Built generic skill with 8 reference files under progressive-disclosure limits. Skill documents MCP tool usage AND flags the gaps where tools don't exist yet (tasks, timeline comments, activities must fall back to raw `makeRequest`).
- **Status:** committed (`6e39fa7` in goclaw-skills)

### Task 2 — Mirror `crm-ops` skill to goclaw-skills repo
- **Time:** 19:52–19:53
- **Spend:** ~1 min
- **Context:** User asked to also version the skill in the `goclaw-skills` private repo alongside existing skills. Copied + committed; not pushed.
- **Status:** committed (`6e39fa7`)

### Task 3 — Refine skill: use server-side `user.get` filter instead of full-roster fetch
- **Time:** 19:53–20:10
- **Spend:** ~17 min
- **Context:** User questioned whether Claude should fetch all users for name lookup. Confirmed Bitrix24 REST supports `user.get` with `FILTER`/`FIND` params — updated `references/users.md`, `tasks.md`, `workflows.md` in local `~/.claude/skills/crm-ops/` to prefer server-side filtering (don't blast the full roster). Also discussed MCP design for "assign to X" workflows — brutally honest take: tools should accept IDs only, LLM does the disambiguation by calling a separate `bitrix24_find_user` tool first (which doesn't exist yet — flagged as next-step gap).
- **Status:** done (skill only; MCP tool implementation still pending)

### Task 4 — Create EGANY-specific `crm-ops-egany` skill
- **Time:** 20:10–22:26
- **Spend:** ~2h 16m
- **Context:** User shared EGANY project constants (staff IDs for Nhu/Quynh/Cuong/Thanh, primary pipeline C6, Smart Invoice SPA entity type 31, LadiSales integration fields, custom field codes, team chat ID) — plus a real webhook URL with embedded secret token. Flagged the webhook as a secret that must NOT be committed; user confirmed rotation. Chose split-skill approach (Option B): keep base `crm-ops` generic, build `crm-ops-egany` as the private extension with the real constants. New skill covers: constants cheatsheet, Smart Invoice CRUD via `crm.item.*`, multi-installment creation workflow (40-40-20 / 50-50 / etc. with rounding-safe drift absorption), and LadiSales order linkage. Core operational concern: EGANY staff create installment plans for deals and assign to staff — documented as the 8-step primary workflow. Skill lives in both `~/.claude/skills/` (so Claude activates it) and `goclaw-skills/` private repo (for team versioning). Webhook token kept out of all files; reference `$BITRIX24_WEBHOOK_URL` only.
- **Status:** committed (`f26d2f2` in goclaw-skills)

---

## Session 2 — 2026-04-13 (11:05–11:20)

### Task 5 — Brainstorm: check if activity-creation skill/tool exists
- **Time:** 11:05–11:10
- **Spend:** ~5 min
- **Context:** User asked if a skill for creating activities on deals already exists. Found `crm-ops/references/activities.md` covers the REST spec fully, but no native MCP tool exists — only read-only monitoring tools. Gap confirmed.
- **Status:** done

### Task 6 — Plan: add `bitrix24_create_activity` + `bitrix24_update_activity` MCP tools
- **Time:** 11:10–11:20
- **Spend:** ~10 min
- **Context:** Planned two new tools in `src/tools/index.ts`: create (crm.activity.add) and update (crm.activity.update). Single-phase plan — additive change only, no existing code modified. Plan at `plans/260413-1105-add-activity-tools/`.
- **Status:** done

---

## Session 3 — 2026-04-13 (11:21–11:27)

### Task 8 — Add `bitrix24_add_timeline_comment` MCP tool
- **Time:** 11:27–11:31
- **Spend:** ~4 min
- **Context:** Added native timeline comment tool so Claude can post notes directly to deal/contact/lead/company timelines without falling back to raw makeRequest. Supports BBCode. Works for both deal and contact (entityType enum).
- **Status:** done

### Task 7 — Implement `bitrix24_create_activity` + `bitrix24_update_activity` MCP tools
- **Time:** 11:21–11:27
- **Spend:** ~6 min
- **Context:** Added two native MCP tools for activity creation and update. Added public `createActivity`/`updateActivity` methods to `Bitrix24Client` (makeRequest is private). Both tools registered in allTools array and switch cases. Build passes.
- **Status:** done

---

---

## Session 4 — 2026-04-13 (11:33–11:55)

### Task 9 — Brainstorm: what API this MCP can do + lean toolset for AI agent
- **Time:** 11:33–11:45
- **Spend:** ~12 min
- **Context:** Audited full MCP toolset vs Bitrix24 Basic Plan capabilities. Found 6 of 10 monitoring tools are stubs (return "implementation in progress"). Agreed to remove leads (not on Basic Plan), remove stubs, remove redundant convenience tools (getLatest*, dateRange*, filterDealsBy*, *WithUserNames), remove dev/debug tools. Keep 4 real monitoring tools (strip lead-dependent options). Add delete ops + getCRMStatuses + listActivities. Final lean set: ~27 tools for AI agent use.
- **Status:** done

### Task 10 — Plan: Bitrix24 MCP refactor (modularize + lean toolset)
- **Time:** 11:45–11:55
- **Spend:** ~10 min
- **Context:** Created 3-phase implementation plan to split 1644-line tools/index.ts and 1423-line client.ts into per-entity modules, remove all lead code, remove redundant tools, add 5 new tools. Plan at `plans/260413-1133-bitrix24-mcp-refactor/`.
- **Status:** done

---

---

## Session 5 — 2026-04-13 (11:49–)

### Task 11 — Implement: Bitrix24 MCP refactor (modularize + lean toolset)
- **Time:** 11:49–
- **Spend:** —
- **Context:** Executing 3-phase refactor plan. Splitting 1423-line client.ts and 1644-line tools/index.ts into per-entity modules. Removing all lead code + redundant/stub tools. Adding delete ops, getCRMStatuses, listActivities. Target: ~33 tools (plan said 27 but breakdown adds to 33).
- **Status:** committed (`3af38ed`) — build passes, 33 tools exported, zero lead code in src, crm-ops skill updated + committed in goclaw-skills (`f7623b6`)

---

## Session 7 — 2026-04-13 (15:21–16:40)

### Task 14 — Fix: default currency EUR → VND in create_deal
- **Time:** 15:21–15:25
- **Spend:** ~4 min
- **Context:** Trace showed deal 320 created with EUR. Tool was defaulting to EUR, not VND. Fixed default in both schema and handler. Skill updated.
- **Status:** committed (`02480d2`)

### Task 15 — Fix: add companyId/assignedById missing from deal tools + skill rule for always passing assignedById
- **Time:** 15:25–15:35
- **Spend:** ~10 min
- **Context:** Webhook owner = Như (user ID inferred ~1 or 24); omitting assignedById silently assigns deal to Như. Added rule to EGANY skill checklist: always pass assignedById explicitly. Also flagged Như as webhook owner in constants.
- **Status:** committed (`45381c1` in goclaw-skills)

### Task 16 — Fix: email sending forbidden + tạo task rule tightened
- **Time:** 15:35–15:50
- **Spend:** ~15 min
- **Context:** Trace showed crm-ops agent tried to send email via GHL after being asked to create a task. Added explicit "Email sending — STRICTLY FORBIDDEN" section to SKILL.md. Tightened tạo task rule to explicitly list "send email" as prohibited interpretation.
- **Status:** committed (`6d9ead6` in goclaw-skills)

### Task 17 — Fix: deal title vs description split + add UF_CRM_1771896709411
- **Time:** 15:50–16:28
- **Spend:** ~38 min
- **Context:** Agent concatenating deal code + description into TITLE. Two fixes: (1) skill rule added — title = code only, description = UF_CRM_1771896709411; (2) MCP server: added `description` param to create/update deal tools mapping to UF_CRM_1771896709411. Also added `[key: string]: any` index to BitrixDeal type for future custom fields.
- **Status:** committed (`ae52135` MCP, `a899a80` goclaw-skills)

### Task 18 — Diagnose trace 019d8636: deal created but Tú still wrong + title still concatenated
- **Time:** 16:28–16:40
- **Spend:** ~12 min
- **Context:** Trace showed deal 320 created with VND ✅, task linked ✅, no email ✅. But: (1) assignedById=24 (Như) instead of 30 (Tú) — user confirmed they had to manually fix; (2) title still concatenated — new build not yet restarted; (3) description in COMMENTS not UF_CRM_1771896709411 — same reason. Root cause for Tú/Như confusion: crm-ops agent has hardcoded staff table in its own system prompt, separate from the crm-ops-egany skill. Needs to be fixed in agent platform directly.
- **Status:** done (diagnosis only — agent system prompt fix is outside this repo)

---

## Session 6 — 2026-04-13

### Task 13 — Fix: add companyId + assignedById to create/update deal tools
- **Time:** 15:21–15:30
- **Spend:** ~9 min
- **Context:** Agent was using company ID as contact ID when creating deals — `bitrix24_create_deal` had no `companyId` param so agent had no correct way to link a company. Added `companyId` and `assignedById` to both `bitrix24_create_deal` and `bitrix24_update_deal` tools. Build passes.
- **Status:** committed

---

### Task 12 — Fix crm-ops-egany skill: deal creation, tạo task, Tú user ID
- **Time:** session start–
- **Spend:** —
- **Context:** 3 agent skill bugs identified from real usage: (1) deal created with wrong customer — skill lacked dedup/contact-search step; (2) agent couldn't assign Tú — webhook has no `user` scope, ID was unknown; (3) agent drafted email instead of creating Bitrix24 task on "tạo task". Fixed all 3: added mandatory deal creation checklist to SKILL.md, added explicit "tạo task = bitrix24_create_task" rule, resolved Tú's ID = 30 from profile URL. Committed to goclaw-skills (`7a0852a`).
- **Status:** committed (`7a0852a` in goclaw-skills)

---

## Session 7 — 2026-04-14

### Task 19 — Add checklist support to task tools (Option C)
- **Time:** 16:34–16:50
- **Spend:** ~16 min
- **Context:** MCP had no way to create or manage task checklists. Added `checklistItems[]` param to `bitrix24_create_task` (bulk-add on creation) + 5 new tools: `bitrix24_get_checklist`, `bitrix24_add_checklist_item`, `bitrix24_update_checklist_item`, `bitrix24_complete_checklist_item`, `bitrix24_delete_checklist_item`. Maps to Bitrix24 `task.checklistitem.*` REST API family. Includes guard on task creation response and partial-failure surfacing for bulk add.
- **Status:** done

### Task 20 — Add parentId support to create_task (subtask creation)
- **Time:** 16:46–16:48
- **Spend:** ~2 min
- **Context:** Agent couldn't create proper parent→subtask hierarchy — MCP had no `PARENT_ID` param. Added optional `parentId` to `bitrix24_create_task` tool. Agent can now create 1 parent task then N subtasks with `parentId` set, building the correct native Bitrix24 structure.
- **Status:** done

### Task 21 — Update crm-ops + crm-ops-egany skills with checklist/subtask docs
- **Time:** 16:48–16:52
- **Spend:** ~4 min
- **Context:** New MCP tools (checklist CRUD + parentId) wouldn't be used by agents unless skills documented them. Updated `crm-ops/references/tasks.md` with all new tool signatures, PARENT_ID field, subtask workflow pattern, and checklist vs subtask decision table. Added `crm-ops-egany/SKILL.md` Vietnamese workflow section for task cha → subtask creation.
- **Status:** done

---

## Session 8 — 2026-04-16 (14:54–)

### Task 22 — Brainstorm: name card / customer info intake skill
- **Time:** 14:54–15:10
- **Spend:** ~16 min
- **Context:** User wants to update crm-ops skill to handle inbound customer info (name card images, customer details). Workflow: extract info → save contact → assign staff follow-up (activity reminder) → ask smart questions for next action. Agreed: skill-only update to crm-ops-egany, default assignee Quỳnh (ID 1), +1 business day deadline, dedup with user confirmation. Corrected staff IDs.
- **Status:** done

---

## Session 9 — 2026-04-16 (15:17–)

### Task 23 — Implement Customer Intake Workflow for crm-ops-egany
- **Time:** 15:17–15:22
- **Spend:** ~5 min
- **Context:** Auto mode implementation of plan 260416-1454. Fix staff IDs (Quỳnh=1 as webhook owner) + add customer intake workflow (name card OCR → dedup → create contact → activity → smart questions). Added ownerTypeId/activityTypeId reference tables, website field. Code review 8/10.
- **Status:** committed (`266bace` bitrix24-mcp-server, `4c9d7d7` goclaw-skills)

### Task 24 — Add Smart Item tools for invoice creation
- **Time:** 15:51–16:15
- **Spend:** ~24 min
- **Context:** Doanh Doanh couldn't create invoices (phiếu thu) - MCP lacked crm.item.* tools. Added 5 new tools: create/get/list/update/delete smart items. Fixed type consistency (string IDs). Test pass, code review 7.5→fixed.
- **Status:** committed (`b572ab5`)

---

## Next steps / open items

- **MCP server gap:** native tools missing for `bitrix24_find_user`, `bitrix24_log_activity`. ~~`bitrix24_create_invoice`~~ ✅ Added via smart-item-tools. Proposed: add user search tool for staff lookup.
- **EGANY unknowns to confirm** (tagged in skill files):
  1. Initial `DT31_2:*` stage code for new invoices
  2. Deal→invoice link field (`parentId2` vs custom `UF_CRM_*`)
  3. Meaning of `invoice_installment_1: 132` constant
  4. Installment due-date field location
  5. Whether invoices should mirror parent deal's product rows
  6. LadiSales sync direction (one-way vs two-way)
- **Housekeeping:** untracked `plans/reports/brainstorm-260409-1841-bitrix24-mcp-code-mode.md` in main repo — not yet reviewed/committed.
- **Remote push pending:** both `6e39fa7` and `f26d2f2` in `goclaw-skills` are committed locally, not pushed.
