# Phase 2: Add Customer Intake Workflow

## Context
- Parent plan: [plan.md](./plan.md)
- Target file: `~/.claude/skills/crm-ops-egany/SKILL.md`
- Depends on: Phase 1 (staff IDs must be correct first)

## Overview
- **Priority:** High
- **Effort:** 25m
- **Status:** complete

Add new "Customer Intake Workflow" section to SKILL.md covering the full flow from receiving customer info to smart follow-up questions.

## Requirements

### Input Handling
- Support name card images (OCR via `ai-multimodal` skill)
- Support text input (user types/pastes customer details)

### Workflow Steps
1. Extract info: Name, Phone, Email, Company, Position
2. Dedup check: Search by phone/email
3. Create or link contact
4. Create activity (follow-up reminder)
5. Ask smart questions

### Defaults
- Assignee: Quỳnh (ID 1)
- Deadline: +1 business day (17:00 VN time)
- Follow-up type: Activity (not Task, unless explicitly requested)

## Implementation Steps

1. Open `~/.claude/skills/crm-ops-egany/SKILL.md`
2. Add new section after "Email sending — STRICTLY FORBIDDEN" section
3. Include workflow diagram (ASCII)
4. Include step-by-step instructions with tool calls
5. Include Vietnamese prompt templates

## Content to Add

```markdown
## Customer Intake Workflow (name card / customer info)

When user sends a name card image or customer info text:

### Step 1: Extract Info
- **Image input** → Use `ai-multimodal` skill to OCR and extract:
  - Name (Họ tên)
  - Phone (Số điện thoại)
  - Email
  - Company (Công ty)
  - Position (Chức vụ)
- **Text input** → Parse directly from user message

### Step 2: Dedup Check (MANDATORY)
Before creating, ALWAYS search for existing contact:
```
bitrix24_search_crm({ query: '<phone or email>' })
```
Or:
```
bitrix24_list_contacts({ filter: { "PHONE": "<phone>" } })
bitrix24_list_contacts({ filter: { "EMAIL": "<email>" } })
```

**If match found** → Ask user:
> "Tìm thấy contact [Name] với [phone/email]. Liên kết với contact này hay tạo mới?"

### Step 3: Create or Link Contact
- **New contact:**
  ```
  bitrix24_create_contact({
    name: "<first name>",
    lastName: "<last name>",
    phone: "<phone>",
    email: "<email>",
    company: "<company>",
    position: "<position>"
  })
  ```
- **Existing contact:** Use the found contact ID for next steps

### Step 4: Create Follow-up Activity (DEFAULT)
Create activity reminder assigned to Quỳnh by default:
```
bitrix24_create_activity({
  ownerTypeId: 3,        // Contact
  ownerId: <contactId>,
  typeId: 3,             // Todo
  subject: "Follow up: <Name>",
  deadline: "<+1 business day, 17:00 VN>",
  responsibleId: 1,      // Quỳnh (default)
  description: "Contact mới từ name card. Thông tin:\n- Phone: ...\n- Email: ...\n- Company: ..."
})
```

**Exception:** Only use `bitrix24_create_task` if user EXPLICITLY says "tạo task" or "create task".

### Step 5: Smart Questions
After saving contact and creating activity, ask user:

1. **Deal creation:**
   > "Tạo deal cho contact này không? (Nếu có, cho biết tên deal và giá trị ước tính)"

2. **Company linking:**
   > "Link vào company nào? (Tìm company có sẵn hoặc tạo mới)"

3. **Customization:**
   > "Cần thay đổi gì không? (Deadline khác, assign cho người khác, thêm ghi chú)"

### Workflow Summary
```
INPUT (image/text)
    ↓
EXTRACT (ai-multimodal / parse)
    ↓
DEDUP (search by phone/email)
    ↓
[If found] → ASK USER: link or create new?
    ↓
CREATE/LINK CONTACT
    ↓
CREATE ACTIVITY (Quỳnh, +1 day)
    ↓
SMART QUESTIONS (deal? company? customize?)
```
```

## Todo

- [ ] Add section header "## Customer Intake Workflow"
- [ ] Add Step 1: Extract Info (image vs text)
- [ ] Add Step 2: Dedup Check with tool calls
- [ ] Add Step 3: Create/Link Contact
- [ ] Add Step 4: Create Activity with defaults
- [ ] Add Step 5: Smart Questions (Vietnamese)
- [ ] Add workflow summary diagram

## Success Criteria

- [ ] Workflow section added to SKILL.md
- [ ] All 5 steps documented with tool calls
- [ ] Vietnamese prompts included
- [ ] Default values clearly specified (Quỳnh=1, +1 day)
- [ ] Exception for task creation documented
