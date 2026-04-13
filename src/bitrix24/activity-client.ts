import { BaseBitrixClient } from './base-client.js';

export class ActivityClient {
  constructor(private base: BaseBitrixClient) {}

  async createActivity(fields: Record<string, any>): Promise<any> {
    return await this.base.makeRequest('crm.activity.add', { fields });
  }

  async updateActivity(id: number, fields: Record<string, any>): Promise<any> {
    return await this.base.makeRequest('crm.activity.update', { id, fields });
  }

  async addTimelineComment(entityId: number, entityType: string, comment: string): Promise<any> {
    return await this.base.makeRequest('crm.timeline.comment.add', {
      fields: { ENTITY_ID: entityId, ENTITY_TYPE: entityType, COMMENT: comment }
    });
  }

  async listActivities(params: {
    filter?: Record<string, any>;
    select?: string[];
    order?: Record<string, string>;
    start?: number;
  } = {}): Promise<any[]> {
    const result = await this.base.makeRequest('crm.activity.list', params);
    // crm.activity.list may return array directly or { items: [...] }
    return Array.isArray(result) ? result : (result?.items || result || []);
  }

  async getCRMStatuses(entityId?: string): Promise<any[]> {
    const params: Record<string, any> = {};
    if (entityId) params.filter = { ENTITY_ID: entityId };
    return await this.base.makeRequest('crm.status.list', params);
  }

  async searchCRM(query: string, entityTypes: string[] = ['contact', 'company', 'deal']): Promise<any> {
    return await this.base.makeRequest('crm.duplicate.findbycomm', {
      entity_type: entityTypes.join(','),
      type: 'EMAIL',
      values: [query]
    });
  }
}
