import { BaseBitrixClient } from './base-client.js';
import { BitrixCompany } from './types.js';

export class CompanyClient {
  constructor(private base: BaseBitrixClient) {}

  async createCompany(company: BitrixCompany): Promise<string> {
    const result = await this.base.makeRequest('crm.company.add', { fields: company });
    return result.toString();
  }

  async getCompany(id: string): Promise<BitrixCompany> {
    return await this.base.makeRequest('crm.company.get', { id });
  }

  async updateCompany(id: string, company: Partial<BitrixCompany>): Promise<boolean> {
    const result = await this.base.makeRequest('crm.company.update', { id, fields: company });
    return result === true;
  }

  async listCompanies(params: {
    start?: number;
    filter?: Record<string, any>;
    order?: Record<string, string>;
    select?: string[];
  } = {}): Promise<BitrixCompany[]> {
    return await this.base.makeRequest('crm.company.list', params);
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await this.base.makeRequest('crm.company.delete', { id });
    return result === true;
  }
}
