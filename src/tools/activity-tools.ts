import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client } from '../bitrix24/client.js';

export const activityTools: Tool[] = [
  {
    name: 'bitrix24_create_activity',
    description: 'Create an activity (call, meeting, email, todo) on a Bitrix24 CRM entity',
    inputSchema: {
      type: 'object',
      properties: {
        ownerTypeId: { type: 'number', description: '2=Deal, 3=Contact, 4=Company' },
        ownerId: { type: 'number', description: 'ID of the linked CRM entity' },
        typeId: { type: 'number', description: '1=Meeting, 2=Call, 3=Task(activity), 4=Email' },
        subject: { type: 'string', description: 'Activity subject/title' },
        description: { type: 'string', description: 'Activity details/notes' },
        startTime: { type: 'string', description: 'ISO-8601 start time' },
        endTime: { type: 'string', description: 'ISO-8601 end time' },
        deadline: { type: 'string', description: 'ISO-8601 deadline (for todos)' },
        completed: { type: 'boolean', description: 'Mark as completed', default: false },
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
  },
  {
    name: 'bitrix24_update_activity',
    description: 'Update an existing Bitrix24 activity (e.g., mark as completed, change subject)',
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
  },
  {
    name: 'bitrix24_add_timeline_comment',
    description: 'Post a comment/note to a Bitrix24 CRM entity timeline. Supports BBCode formatting.',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'number', description: 'ID of the CRM entity' },
        entityType: { type: 'string', enum: ['deal', 'contact', 'company'], description: 'CRM entity type' },
        comment: { type: 'string', description: 'Comment text. BBCode supported: [B]bold[/B], [URL=..]text[/URL]' }
      },
      required: ['entityId', 'entityType', 'comment']
    }
  },
  {
    name: 'bitrix24_list_activities',
    description: 'List CRM activities with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'object', description: 'Filter criteria (e.g., {"OWNER_ID": "123", "TYPE_ID": 2})' },
        select: { type: 'array', items: { type: 'string' }, description: 'Fields to select' },
        order: { type: 'object', description: 'Order criteria (e.g., {"DATE_CREATE": "DESC"})' },
        start: { type: 'number', description: 'Pagination offset', default: 0 }
      }
    }
  }
];

export async function handleActivityTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_activity': {
      const fields: Record<string, any> = {
        OWNER_TYPE_ID: args.ownerTypeId,
        OWNER_ID: args.ownerId,
        TYPE_ID: args.typeId,
        SUBJECT: args.subject
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
          TYPE: c.type, VALUE: c.value, ENTITY_ID: c.entityId, ENTITY_TYPE_ID: c.entityTypeId
        }));
      }
      const activityId = await bitrix24Client.createActivity(fields);
      return { success: true, activityId, message: `Activity created with ID: ${activityId}` };
    }
    case 'bitrix24_update_activity': {
      const fields: Record<string, any> = {};
      if (args.completed !== undefined) fields.COMPLETED = args.completed ? 'Y' : 'N';
      if (args.subject !== undefined) fields.SUBJECT = args.subject;
      if (args.description !== undefined) fields.DESCRIPTION = args.description;
      if (args.startTime !== undefined) fields.START_TIME = args.startTime;
      if (args.endTime !== undefined) fields.END_TIME = args.endTime;
      if (args.deadline !== undefined) fields.DEADLINE = args.deadline;
      if (args.responsibleId !== undefined) fields.RESPONSIBLE_ID = args.responsibleId;
      await bitrix24Client.updateActivity(args.id, fields);
      return { success: true, message: `Activity ${args.id} updated` };
    }
    case 'bitrix24_add_timeline_comment': {
      const commentId = await bitrix24Client.addTimelineComment(args.entityId, args.entityType, args.comment);
      return { success: true, commentId, message: `Timeline comment added with ID: ${commentId}` };
    }
    case 'bitrix24_list_activities': {
      const activities = await bitrix24Client.listActivities({
        filter: args.filter,
        select: args.select,
        order: args.order,
        start: args.start || 0
      });
      return { success: true, activities, count: activities.length };
    }
    default:
      return undefined;
  }
}
