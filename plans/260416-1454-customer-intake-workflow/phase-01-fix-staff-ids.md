# Phase 1: Fix Staff ID Table

## Context
- Parent plan: [plan.md](./plan.md)
- Target file: `~/.claude/skills/crm-ops-egany/references/constants.md`

## Overview
- **Priority:** High
- **Effort:** 5m
- **Status:** complete

Fix incorrect staff user IDs in constants.md. Critical: Quỳnh is user ID 1 (not 20), and is the webhook owner.

## Key Changes

### Current (WRONG)
```markdown
| Name  | ID |
|-------|----|
| Như   | 24 ⚠️ webhook owner |
| Quỳnh | 20 |
| Cường | 18 |
| Thành | 34 |
| Tú    | 30 |
```

### Corrected
```markdown
| Name  | ID | Notes |
|-------|----|-------|
| Quỳnh | 1  | ⚠️ Webhook owner, DEFAULT assignee for new contacts |
| Cường | 18 | |
| Như   | 24 | |
| Tú    | 30 | Sales |
| Thành | 34 | |
```

## Implementation Steps

1. Open `~/.claude/skills/crm-ops-egany/references/constants.md`
2. Find the "Staff user IDs" section
3. Replace the table with corrected IDs
4. Update the usage note to reflect Quỳnh as webhook owner

## Todo

- [ ] Fix Quỳnh ID: 20 → 1
- [ ] Mark Quỳnh as webhook owner (not Như)
- [ ] Add "DEFAULT assignee" note to Quỳnh
- [ ] Add "Sales" note to Tú
- [ ] Update usage note paragraph

## Success Criteria

- [ ] Quỳnh = 1 with webhook owner note
- [ ] All other IDs verified correct
- [ ] Usage note updated
