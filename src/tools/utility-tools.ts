import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client } from '../bitrix24/client.js';

export const utilityTools: Tool[] = [
  {
    name: 'bitrix24_search_crm',
    description: 'Search across CRM entities (contacts, companies, deals) by email or phone',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (email, phone, name)' },
        entityTypes: {
          type: 'array',
          items: { type: 'string', enum: ['contact', 'company', 'deal'] },
          description: 'Entity types to search',
          default: ['contact', 'company', 'deal']
        }
      },
      required: ['query']
    }
  },
  {
    name: 'bitrix24_get_crm_statuses',
    description: 'Get CRM status lists (deal stages, contact types, etc.) for a given entity',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: {
          type: 'string',
          description: 'Status entity ID (e.g., DEAL_STAGE, CONTACT_TYPE, SOURCE). Omit to get all.'
        }
      }
    }
  }
];

export async function handleUtilityTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_search_crm': {
      const results = await bitrix24Client.searchCRM(args.query, args.entityTypes);
      return { success: true, results };
    }
    case 'bitrix24_get_crm_statuses': {
      const statuses = await bitrix24Client.getCRMStatuses(args.entityId);
      return { success: true, statuses, count: Array.isArray(statuses) ? statuses.length : undefined };
    }
    default:
      return undefined;
  }
}
