import { BaseBitrixClient } from './base-client.js';
import { BitrixTask } from './types.js';

export class TaskClient {
  constructor(private base: BaseBitrixClient) {}

  async createTask(task: BitrixTask): Promise<string> {
    const result = await this.base.makeRequest('tasks.task.add', { fields: task });
    return result.task.id.toString();
  }

  async getTask(id: string): Promise<BitrixTask> {
    const result = await this.base.makeRequest('tasks.task.get', { taskId: id });
    return result.task;
  }

  async updateTask(id: string, task: Partial<BitrixTask>): Promise<boolean> {
    const result = await this.base.makeRequest('tasks.task.update', { taskId: id, fields: task });
    return result === true;
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
