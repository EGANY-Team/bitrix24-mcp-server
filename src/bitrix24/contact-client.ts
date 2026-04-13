import { BaseBitrixClient } from './base-client.js';
import { BitrixContact } from './types.js';

export class ContactClient {
  constructor(private base: BaseBitrixClient) {}

  async createContact(contact: BitrixContact): Promise<string> {
    const result = await this.base.makeRequest('crm.contact.add', { fields: contact });
    return result.toString();
  }

  async getContact(id: string): Promise<BitrixContact> {
    return await this.base.makeRequest('crm.contact.get', { id });
  }

  async updateContact(id: string, contact: Partial<BitrixContact>): Promise<boolean> {
    const result = await this.base.makeRequest('crm.contact.update', { id, fields: contact });
    return result === true;
  }

  async listContacts(params: { start?: number; filter?: Record<string, any> } = {}): Promise<BitrixContact[]> {
    return await this.base.makeRequest('crm.contact.list', params);
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await this.base.makeRequest('crm.contact.delete', { id });
    return result === true;
  }
}
