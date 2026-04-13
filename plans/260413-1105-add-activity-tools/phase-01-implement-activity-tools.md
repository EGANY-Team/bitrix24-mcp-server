# Phase 01 — Implement Activity Tools

## Context Links
- Parent plan: [plan.md](./plan.md)
- REST spec: `~/.claude/skills/crm-ops/references/activities.md`
- Target file: `src/tools/index.ts`

## Overview
- **Date:** 2026-04-13
- **Priority:** P2
- **Status:** pending

Add two tools to `src/tools/index.ts`:
1. `bitrix24_create_activity` — calls `crm.activity.add`
2. `bitrix24_update_activity` — calls `crm.activity.update`

## Key Insights
- All existing tools follow the same pattern: exported `const xTool: Tool` + entry in `allTools[]` + `case` in `executeToolCall` switch
- `makeRequest` is accessed via `bitrix24Client` (already imported)
- No new client methods needed — both REST calls go directly through `bitrix24Client.makeRequest`
- `allTools` array is at line 916; `executeToolCall` switch starts at line 975; `default` case at line 1514
- File is 1524 lines — adding ~80 lines won't trigger modularization threshold

## Requirements
- Tool 1 `bitrix24_create_activity`: required fields `ownerTypeId`, `ownerId`, `typeId`, `subject`; all others optional
- Tool 2 `bitrix24_update_activity`: required field `id`; all others optional
- Map camelCase → `SCREAMING_SNAKE_CASE` for Bitrix24 REST fields
- Return `activityId` on create, `success: true` on update

## Related Code Files
- **Modify:** `src/tools/index.ts` (3 locations: tool defs, allTools array, switch cases)

## Implementation Steps

### 1. Add tool definitions (after existing tool const exports, before `allTools`)

Insert after the last `export const` tool definition (around line 915, before `export const allTools`):

```ts
// Activity Tools
export const createActivityTool: Tool = {
  name: 'bitrix24_create_activity',
  description: 'Create an activity (call, meeting, email, todo) on a Bitrix24 CRM entity (deal, contact, lead, company)',
  inputSchema: {
    type: 'object',
    properties: {
      ownerTypeId: { type: 'number', description: '1=Lead, 2=Deal, 3=Contact, 4=Company' },
      ownerId: { type: 'number', description: 'ID of the linked CRM entity' },
      typeId: { type: 'number', description: '1=Meeting, 2=Call, 3=Task(activity), 4=Email' },
      subject: { type: 'string', description: 'Activity subject/title' },
      description: { type: 'string', description: 'Activity details/notes' },
      startTime: { type: 'string', description: 'ISO-8601 start time' },
      endTime: { type: 'string', description: 'ISO-8601 end time' },
      deadline: { type: 'string', description: 'ISO-8601 deadline (for todos)' },
      completed: { type: 'boolean', description: 'Mark as completed (default: false)', default: false },
      direction: { type: 'number', description: '1=Incoming, 2=Outgoing' },
      priority: { type: 'number', description: '1=Low, 2=Normal, 3=High' },
      responsibleId: { type: 'number', description: 'Responsible user ID' },
      communications: {
        type: 'array',
        description: 'Communication contacts linked to this activity',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['PHONE', 'EMAIL'] },
            value: { type: 'string' },
            entityId: { type: 'number' },
            entityTypeId: { type: 'number' }
          },
          required: ['type', 'value', 'entityId', 'entityTypeId']
        }
      }
    },
    required: ['ownerTypeId', 'ownerId', 'typeId', 'subject']
  }
};

export const updateActivityTool: Tool = {
  name: 'bitrix24_update_activity',
  description: 'Update an existing Bitrix24 activity (e.g., mark as completed, change subject or responsible)',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Activity ID' },
      completed: { type: 'boolean', description: 'Mark as completed' },
      subject: { type: 'string', description: 'Updated subject' },
      description: { type: 'string', description: 'Updated notes' },
      startTime: { type: 'string', description: 'ISO-8601 start time' },
      endTime: { type: 'string', description: 'ISO-8601 end time' },
      deadline: { type: 'string', description: 'ISO-8601 deadline' },
      responsibleId: { type: 'number', description: 'Responsible user ID' }
    },
    required: ['id']
  }
};
```

### 2. Add to `allTools` array (line ~969, before closing `]`)

```ts
  // Activity Tools
  createActivityTool,
  updateActivityTool,
```

### 3. Add switch cases in `executeToolCall` (before `default` case at line 1514)

```ts
      case 'bitrix24_create_activity': {
        const fields: Record<string, any> = {
          OWNER_TYPE_ID: args.ownerTypeId,
          OWNER_ID: args.ownerId,
          TYPE_ID: args.typeId,
          SUBJECT: args.subject,
        };
        if (args.description !== undefined) fields.DESCRIPTION = args.description;
        if (args.startTime !== undefined) fields.START_TIME = args.startTime;
        if (args.endTime !== undefined) fields.END_TIME = args.endTime;
        if (args.deadline !== undefined) fields.DEADLINE = args.deadline;
        if (args.completed !== undefined) fields.COMPLETED = args.completed ? 'Y' : 'N';
        if (args.direction !== undefined) fields.DIRECTION = args.direction;
        if (args.priority !== undefined) fields.PRIORITY = args.priority;
        if (args.responsibleId !== undefined) fields.RESPONSIBLE_ID = args.responsibleId;
        if (args.communications !== undefined) {
          fields.COMMUNICATIONS = args.communications.map((c: any) => ({
            TYPE: c.type,
            VALUE: c.value,
            ENTITY_ID: c.entityId,
            ENTITY_TYPE_ID: c.entityTypeId
          }));
        }
        const activityResult = await bitrix24Client.makeRequest('crm.activity.add', { fields });
        return { success: true, activityId: activityResult, message: `Activity created with ID: ${activityResult}` };
      }

      case 'bitrix24_update_activity': {
        const updateFields: Record<string, any> = {};
        if (args.completed !== undefined) updateFields.COMPLETED = args.completed ? 'Y' : 'N';
        if (args.subject !== undefined) updateFields.SUBJECT = args.subject;
        if (args.description !== undefined) updateFields.DESCRIPTION = args.description;
        if (args.startTime !== undefined) updateFields.START_TIME = args.startTime;
        if (args.endTime !== undefined) updateFields.END_TIME = args.endTime;
        if (args.deadline !== undefined) updateFields.DEADLINE = args.deadline;
        if (args.responsibleId !== undefined) updateFields.RESPONSIBLE_ID = args.responsibleId;
        await bitrix24Client.makeRequest('crm.activity.update', { id: args.id, fields: updateFields });
        return { success: true, message: `Activity ${args.id} updated` };
      }
```

## Todo List
- [ ] Insert `createActivityTool` + `updateActivityTool` const definitions before `allTools`
- [ ] Add both to `allTools` array
- [ ] Add `case 'bitrix24_create_activity'` handler in switch
- [ ] Add `case 'bitrix24_update_activity'` handler in switch
- [ ] Build project and verify no compile errors

## Success Criteria
- `npm run build` (or `tsc`) completes with no errors
- Both tools appear in `allTools` export
- `bitrix24_create_activity` maps all camelCase args to correct Bitrix24 SCREAMING_SNAKE_CASE fields
- `bitrix24_update_activity` sends only provided fields (no undefined bleed)

## Risk Assessment
- Low risk — additive change only, no existing code modified
- `makeRequest` return type for `crm.activity.add` is the new activity ID (number) — verify via test call

## Security Considerations
- No new auth surface — uses existing webhook credentials
- No user input passed to shell/eval; all goes through REST API body

## Next Steps
- After implementation, update `crm-ops` skill `activities.md` to note tools now exist natively
