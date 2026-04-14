import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client, BitrixTask } from '../bitrix24/client.js';

export const taskTools: Tool[] = [
  {
    name: 'bitrix24_create_task',
    description: 'Create a new task in Bitrix24',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        responsibleId: { type: 'string', description: 'Responsible user ID' },
        deadline: { type: 'string', description: 'Deadline in ISO-8601 format' },
        priority: { type: 'string', enum: ['0', '1', '2'], description: '0=Low, 1=Normal, 2=High' },
        crmEntities: {
          type: 'array',
          items: { type: 'string' },
          description: 'CRM entities to link (e.g., ["D_123", "C_456"] for deal 123, contact 456)'
        },
        checklistItems: {
          type: 'array',
          items: { type: 'string' },
          description: 'Checklist item titles to add to the task after creation'
        },
        parentId: { type: 'string', description: 'Parent task ID — makes this task a subtask of the specified task' }
      },
      required: ['title']
    }
  },
  {
    name: 'bitrix24_get_task',
    description: 'Retrieve task information by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Task ID' } },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_list_tasks',
    description: 'List tasks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'object', description: 'Filter criteria (e.g., {"RESPONSIBLE_ID": "5"})' },
        limit: { type: 'number', description: 'Max tasks to return', default: 20 }
      }
    }
  },
  {
    name: 'bitrix24_update_task',
    description: 'Update an existing task in Bitrix24',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        responsibleId: { type: 'string', description: 'Responsible user ID' },
        deadline: { type: 'string', description: 'Deadline in ISO-8601 format' },
        priority: { type: 'string', enum: ['0', '1', '2'], description: '0=Low, 1=Normal, 2=High' },
        status: { type: 'string', enum: ['1', '2', '3', '4', '5'], description: '1=New, 2=Pending, 3=In Progress, 4=Completed, 5=Deferred' },
        parentId: { type: 'string', description: 'Set parent task ID to make this task a subtask (use to re-parent existing tasks)' }
      },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_get_checklist',
    description: 'Get all checklist items for a task',
    inputSchema: {
      type: 'object',
      properties: { taskId: { type: 'string', description: 'Task ID' } },
      required: ['taskId']
    }
  },
  {
    name: 'bitrix24_add_checklist_item',
    description: 'Add a checklist item to an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'Checklist item text' }
      },
      required: ['taskId', 'title']
    }
  },
  {
    name: 'bitrix24_update_checklist_item',
    description: 'Update the text of a checklist item',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        itemId: { type: 'string', description: 'Checklist item ID' },
        title: { type: 'string', description: 'New checklist item text' }
      },
      required: ['taskId', 'itemId', 'title']
    }
  },
  {
    name: 'bitrix24_complete_checklist_item',
    description: 'Mark a checklist item as complete or incomplete',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        itemId: { type: 'string', description: 'Checklist item ID' },
        complete: { type: 'boolean', description: 'true = mark done, false = mark undone', default: true }
      },
      required: ['taskId', 'itemId']
    }
  },
  {
    name: 'bitrix24_delete_checklist_item',
    description: 'Delete a checklist item from a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        itemId: { type: 'string', description: 'Checklist item ID' }
      },
      required: ['taskId', 'itemId']
    }
  }
];

export async function handleTaskTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_task': {
      const task: BitrixTask = {
        TITLE: args.title,
        DESCRIPTION: args.description,
        RESPONSIBLE_ID: args.responsibleId,
        DEADLINE: args.deadline,
        PRIORITY: args.priority,
        UF_CRM_TASK: args.crmEntities,
        PARENT_ID: args.parentId
      };
      const taskId = await bitrix24Client.createTask(task, args.checklistItems);
      return { success: true, taskId, message: `Task created with ID: ${taskId}` };
    }
    case 'bitrix24_get_task': {
      const task = await bitrix24Client.getTask(args.id);
      return { success: true, task };
    }
    case 'bitrix24_list_tasks': {
      const tasks = await bitrix24Client.listTasks({ filter: args.filter });
      return { success: true, tasks: tasks.slice(0, args.limit || 20) };
    }
    case 'bitrix24_update_task': {
      const update: Partial<BitrixTask> = {};
      if (args.title) update.TITLE = args.title;
      if (args.description) update.DESCRIPTION = args.description;
      if (args.responsibleId) update.RESPONSIBLE_ID = args.responsibleId;
      if (args.deadline) update.DEADLINE = args.deadline;
      if (args.priority) update.PRIORITY = args.priority;
      if (args.status) update.STATUS = args.status;
      if (args.parentId) update.PARENT_ID = args.parentId;
      const updated = await bitrix24Client.updateTask(args.id, update);
      return { success: true, updated, message: `Task ${args.id} updated successfully` };
    }
    case 'bitrix24_get_checklist': {
      const items = await bitrix24Client.getChecklist(args.taskId);
      return { success: true, items };
    }
    case 'bitrix24_add_checklist_item': {
      const itemId = await bitrix24Client.addChecklistItem(args.taskId, args.title);
      return { success: true, itemId, message: `Checklist item added with ID: ${itemId}` };
    }
    case 'bitrix24_update_checklist_item': {
      await bitrix24Client.updateChecklistItem(args.taskId, args.itemId, args.title);
      return { success: true, message: `Checklist item ${args.itemId} updated` };
    }
    case 'bitrix24_complete_checklist_item': {
      await bitrix24Client.completeChecklistItem(args.taskId, args.itemId, args.complete ?? true);
      const state = (args.complete ?? true) ? 'completed' : 'renewed';
      return { success: true, message: `Checklist item ${args.itemId} ${state}` };
    }
    case 'bitrix24_delete_checklist_item': {
      await bitrix24Client.deleteChecklistItem(args.taskId, args.itemId);
      return { success: true, message: `Checklist item ${args.itemId} deleted` };
    }
    default:
      return undefined;
  }
}
