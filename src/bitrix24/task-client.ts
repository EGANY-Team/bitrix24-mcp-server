import { BaseBitrixClient } from './base-client.js';
import { BitrixTask, BitrixChecklistItem } from './types.js';

export class TaskClient {
  constructor(private base: BaseBitrixClient) {}

  async createTask(task: BitrixTask, checklistItems?: string[]): Promise<string> {
    const result = await this.base.makeRequest('tasks.task.add', { fields: task });
    const taskId = result?.task?.id?.toString();
    if (!taskId) throw new Error('Unexpected response from tasks.task.add');
    if (checklistItems?.length) {
      const failed: string[] = [];
      for (const title of checklistItems) {
        try {
          await this.base.makeRequest('task.checklistitem.add', { taskId, fields: { TITLE: title } });
        } catch {
          failed.push(title);
        }
      }
      if (failed.length) {
        throw new Error(`Task ${taskId} created but ${failed.length} checklist item(s) failed: ${failed.join(', ')}`);
      }
    }
    return taskId;
  }

  async getTask(id: string): Promise<BitrixTask> {
    const result = await this.base.makeRequest('tasks.task.get', { taskId: id });
    return result.task;
  }

  async updateTask(id: string, task: Partial<BitrixTask>): Promise<boolean> {
    const result = await this.base.makeRequest('tasks.task.update', { taskId: id, fields: task });
    return result === true;
  }

  async getChecklist(taskId: string): Promise<BitrixChecklistItem[]> {
    const result = await this.base.makeRequest('task.checklistitem.getlist', { taskId });
    return result || [];
  }

  async addChecklistItem(taskId: string, title: string): Promise<string> {
    const result = await this.base.makeRequest('task.checklistitem.add', { taskId, fields: { TITLE: title } });
    return result.toString();
  }

  async updateChecklistItem(taskId: string, itemId: string, title: string): Promise<boolean> {
    await this.base.makeRequest('task.checklistitem.update', { taskId, itemId, fields: { TITLE: title } });
    return true;
  }

  async completeChecklistItem(taskId: string, itemId: string, complete: boolean): Promise<boolean> {
    const method = complete ? 'task.checklistitem.complete' : 'task.checklistitem.renew';
    await this.base.makeRequest(method, { taskId, itemId });
    return true;
  }

  async deleteChecklistItem(taskId: string, itemId: string): Promise<boolean> {
    await this.base.makeRequest('task.checklistitem.delete', { taskId, itemId });
    return true;
  }

  async listTasks(params: {
    select?: string[];
    filter?: Record<string, any>;
    order?: Record<string, string>;
    start?: number;
  } = {}): Promise<BitrixTask[]> {
    const result = await this.base.makeRequest('tasks.task.list', params);
    return result.tasks || [];
  }
}
