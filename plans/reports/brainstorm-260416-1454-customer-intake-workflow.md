# Brainstorm Report: Customer Intake Workflow

**Date:** 2026-04-16
**Skill:** crm-ops-egany
**Status:** Agreed

---

## Problem Statement

User wants agent to handle inbound customer info (name card images or text) with automated workflow:
1. Extract contact info
2. Save to Bitrix24 (with dedup check)
3. Assign staff follow-up (activity reminder)
4. Ask smart questions for next actions

---

## Final Decisions

| Aspect | Decision |
|--------|----------|
| **Target skill** | `crm-ops-egany` only (not generic crm-ops) |
| **Input types** | Both name card images (via ai-multimodal) and text |
| **Follow-up default** | Activity (reminder); Task only if user explicitly asks |
| **Default assignee** | Quỳnh (user ID 1) |
| **Default deadline** | +1 business day |
| **Dedup behavior** | Search first; if duplicate found, ask user: link or create new? |
| **Smart actions** | Ask about: deal creation, company linking, deadline customization |

---

## Corrected Staff IDs

| Staff | User ID | Notes |
|-------|---------|-------|
| Quỳnh | 1 | Webhook owner, default assignee |
| Cường | 18 | |
| Như | 24 | |
| Tú | 30 | Sales |
| Thành | 34 | |

---

## Workflow Design

```
USER INPUT (name card image or text)
         │
         ▼
┌─────────────────────────────────────┐
│ 1. EXTRACT INFO                     │
│    • Image → ai-multimodal OCR      │
│    • Text → parse from message      │
│    → Name, Phone, Email, Company    │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 2. DEDUP CHECK                      │
│    bitrix24_search_crm(phone/email) │
└────────┬────────────────┬───────────┘
         │ Found          │ Not found
         ▼                ▼
┌─────────────────┐  ┌────────────────┐
│ ASK USER:       │  │ 3. CREATE      │
│ "Link existing  │  │    CONTACT     │
│  or create new?"│  └───────┬────────┘
└────────┬────────┘          │
         │                   │
         └─────────┬─────────┘
                   ▼
┌─────────────────────────────────────┐
│ 4. CREATE ACTIVITY (default)        │
│    ownerTypeId: 3 (Contact)         │
│    typeId: 3 (Todo)                 │
│    responsibleId: 1 (Quỳnh)         │
│    deadline: +1 business day        │
│    subject: "Follow up: [Name]"     │
│                                     │
│    OR: bitrix24_create_task         │
│    (only if user explicitly asks)   │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 5. SMART QUESTIONS                  │
│    • "Tạo deal cho contact này?"    │
│    • "Link vào company nào?"        │
│    • "Deadline/assignee khác?"      │
└─────────────────────────────────────┘
```

---

## Implementation Approach

**Option A: Skill-only update (CHOSEN)**

Update `~/.claude/skills/crm-ops-egany/SKILL.md` and `references/constants.md` with:
1. Corrected staff ID table
2. New "Customer Intake Workflow" section
3. Vietnamese prompt templates for smart questions

**Rationale for skill-only (no MCP tool):**
- Workflow requires mid-flow user interaction (dedup confirmation, smart questions)
- MCP tools run atomically — can't pause for user input
- Image processing uses existing `ai-multimodal` skill
- Easier to maintain (edit markdown vs rebuild server)
- More flexible — agent can adapt flow based on context

---

## Files to Modify

1. `~/.claude/skills/crm-ops-egany/SKILL.md`
   - Fix staff ID table
   - Add "Customer Intake Workflow" section
   
2. `~/.claude/skills/crm-ops-egany/references/constants.md`
   - Correct user IDs (Quỳnh=1, Như=24)

---

## Success Criteria

- [ ] Agent correctly extracts info from name card images
- [ ] Agent searches for duplicates before creating contact
- [ ] Agent asks user when duplicate found
- [ ] Agent creates activity with correct defaults (Quỳnh, +1 day)
- [ ] Agent creates task instead when user explicitly requests
- [ ] Agent asks smart follow-up questions after contact saved
- [ ] Staff IDs in skill match actual Bitrix24 IDs

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OCR quality varies | Agent confirms extracted info with user before saving |
| Agent skips dedup | Explicit checklist in skill with MUST/ALWAYS language |
| Wrong staff ID used | Corrected ID table with clear "Default assignee" label |
| Deadline calculation wrong | Use "next business day 17:00 VN" — explicit, testable |

---

## Next Steps

1. Update skill files (implementation)
2. Test with real name card image
3. Test with text input
4. Verify activity appears in Bitrix24 calendar
