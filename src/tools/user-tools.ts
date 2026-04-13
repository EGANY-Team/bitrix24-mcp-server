import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client } from '../bitrix24/client.js';

export const userTools: Tool[] = [
  {
    name: 'bitrix24_get_current_user',
    description: 'Get the current authenticated user information',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'bitrix24_get_all_users',
    description: 'Get all users in the system with their names and details',
    inputSchema: { type: 'object', properties: {} }
  }
];

export async function handleUserTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_get_current_user': {
      const user = await bitrix24Client.getCurrentUser();
      return { success: true, user };
    }
    case 'bitrix24_get_all_users': {
      const users = await bitrix24Client.getAllUsers();
      return { success: true, users, message: `Found ${users.length} users` };
    }
    default:
      return undefined;
  }
}
