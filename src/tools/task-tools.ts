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
        }
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
        status: { type: 'string', enum: ['1', '2', '3', '4', '5'], description: '1=New, 2=Pending, 3=In Progress, 4=Completed, 5=Deferred' }
      },
      required: ['id']
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
        UF_CRM_TASK: args.crmEntities
      };
      const taskId = await bitrix24Client.createTask(task);
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
      const updated = await bitrix24Client.updateTask(args.id, update);
      return { success: true, updated, message: `Task ${args.id} updated successfully` };
    }
    default:
      return undefined;
  }
}
