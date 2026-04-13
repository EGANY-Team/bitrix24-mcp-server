<!-- Next Session: 4 | Next Task: 9 -->

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

## Next steps / open items

- **MCP server gap:** native tools missing for `bitrix24_find_user`, `bitrix24_log_activity`, `bitrix24_create_task`, `bitrix24_add_timeline_comment`, `bitrix24_create_invoice` (SPA). Without these, skill workflows fall back to in-process `makeRequest` — doesn't work for remote MCP clients. Proposed PR: ~10 new tools, ~300 lines glue code, one PR.
- **EGANY unknowns to confirm** (tagged in skill files):
  1. Initial `DT31_2:*` stage code for new invoices
  2. Deal→invoice link field (`parentId2` vs custom `UF_CRM_*`)
  3. Meaning of `invoice_installment_1: 132` constant
  4. Installment due-date field location
  5. Whether invoices should mirror parent deal's product rows
  6. LadiSales sync direction (one-way vs two-way)
- **Housekeeping:** untracked `plans/reports/brainstorm-260409-1841-bitrix24-mcp-code-mode.md` in main repo — not yet reviewed/committed.
- **Remote push pending:** both `6e39fa7` and `f26d2f2` in `goclaw-skills` are committed locally, not pushed.
