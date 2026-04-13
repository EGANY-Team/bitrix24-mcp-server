import { BaseBitrixClient } from './base-client.js';
import { BitrixDeal } from './types.js';

export class DealClient {
  constructor(private base: BaseBitrixClient) {}

  async createDeal(deal: BitrixDeal): Promise<string> {
    const result = await this.base.makeRequest('crm.deal.add', { fields: deal });
    return result.toString();
  }

  async getDeal(id: string): Promise<BitrixDeal> {
    return await this.base.makeRequest('crm.deal.get', { id });
  }

  async updateDeal(id: string, deal: Partial<BitrixDeal>): Promise<boolean> {
    const result = await this.base.makeRequest('crm.deal.update', { id, fields: deal });
    return result === true;
  }

  async listDeals(params: {
    start?: number;
    filter?: Record<string, any>;
    order?: Record<string, string>;
    select?: string[];
  } = {}): Promise<BitrixDeal[]> {
    return await this.base.makeRequest('crm.deal.list', params);
  }

  async deleteDeal(id: string): Promise<boolean> {
    const result = await this.base.makeRequest('crm.deal.delete', { id });
    return result === true;
  }

  async getDealPipelines(): Promise<any[]> {
    return await this.base.makeRequest('crm.dealcategory.list');
  }

  async getDealStages(pipelineId?: string): Promise<any[]> {
    const params: Record<string, any> = {};
    if (pipelineId) params.id = pipelineId;
    return await this.base.makeRequest('crm.dealcategory.stage.list', params);
  }
}
