import { BaseBitrixClient } from './base-client.js';

export interface SmartItemFields {
  title?: string;
  categoryId?: number;
  stageId?: string;
  opportunity?: number;
  currencyId?: string;
  assignedById?: number;
  contactId?: number;
  companyId?: number;
  parentId2?: number; // Link to deal (entityType 2)
  [key: string]: any; // Custom fields (ufCrm...)
}

export class SmartItemClient {
  constructor(private base: BaseBitrixClient) {}

  async createSmartItem(entityTypeId: number, fields: SmartItemFields): Promise<any> {
    const result = await this.base.makeRequest('crm.item.add', {
      entityTypeId,
      fields: {
        title: fields.title,
        categoryId: fields.categoryId,
        stageId: fields.stageId,
        opportunity: fields.opportunity,
        currencyId: fields.currencyId || 'VND',
        assignedById: fields.assignedById,
        contactId: fields.contactId,
        companyId: fields.companyId,
        parentId2: fields.parentId2,
        ...this.extractCustomFields(fields)
      }
    });
    return result?.item || result;
  }

  async getSmartItem(entityTypeId: number, id: number): Promise<any> {
    const result = await this.base.makeRequest('crm.item.get', { entityTypeId, id });
    return result?.item || result;
  }

  async listSmartItems(
    entityTypeId: number,
    options?: { filter?: Record<string, any>; order?: Record<string, string>; select?: string[]; limit?: number }
  ): Promise<any[]> {
    const params: Record<string, any> = { entityTypeId };
    if (options?.filter) params.filter = options.filter;
    if (options?.order) params.order = options.order;
    if (options?.select) params.select = options.select;

    const result = await this.base.makeRequest('crm.item.list', params);
    const items = result?.items || result || [];
    return options?.limit ? items.slice(0, options.limit) : items;
  }

  async updateSmartItem(entityTypeId: number, id: number, fields: Partial<SmartItemFields>): Promise<any> {
    const updateFields: Record<string, any> = {};
    if (fields.title !== undefined) updateFields.title = fields.title;
    if (fields.categoryId !== undefined) updateFields.categoryId = fields.categoryId;
    if (fields.stageId !== undefined) updateFields.stageId = fields.stageId;
    if (fields.opportunity !== undefined) updateFields.opportunity = fields.opportunity;
    if (fields.currencyId !== undefined) updateFields.currencyId = fields.currencyId;
    if (fields.assignedById !== undefined) updateFields.assignedById = fields.assignedById;
    if (fields.contactId !== undefined) updateFields.contactId = fields.contactId;
    if (fields.companyId !== undefined) updateFields.companyId = fields.companyId;
    if (fields.parentId2 !== undefined) updateFields.parentId2 = fields.parentId2;
    Object.assign(updateFields, this.extractCustomFields(fields));

    const result = await this.base.makeRequest('crm.item.update', { entityTypeId, id, fields: updateFields });
    return result?.item || result;
  }

  async deleteSmartItem(entityTypeId: number, id: number): Promise<boolean> {
    await this.base.makeRequest('crm.item.delete', { entityTypeId, id });
    return true;
  }

  private extractCustomFields(fields: SmartItemFields): Record<string, any> {
    const custom: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith('ufCrm') && value !== undefined) {
        custom[key] = value;
      }
    }
    return custom;
  }
}
