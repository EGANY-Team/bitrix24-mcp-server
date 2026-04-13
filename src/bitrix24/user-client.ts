import { BaseBitrixClient } from './base-client.js';

export class UserClient {
  constructor(private base: BaseBitrixClient) {}

  async getCurrentUser(): Promise<any> {
    return await this.base.makeRequest('user.current');
  }

  async getAllUsers(): Promise<any[]> {
    return await this.base.makeRequest('user.get');
  }
}
