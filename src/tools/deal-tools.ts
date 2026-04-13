import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client, BitrixDeal } from '../bitrix24/client.js';

export const dealTools: Tool[] = [
  {
    name: 'bitrix24_create_deal',
    description: 'Create a new deal in Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Deal title' },
        amount: { type: 'string', description: 'Deal amount' },
        currency: { type: 'string', description: 'Currency code (e.g., EUR, USD)', default: 'VND' },
        contactId: { type: 'string', description: 'Associated contact ID' },
        companyId: { type: 'string', description: 'Associated company ID' },
        stageId: { type: 'string', description: 'Deal stage ID' },
        assignedById: { type: 'string', description: 'Responsible user ID' },
        comments: { type: 'string', description: 'Deal comments' }
      },
      required: ['title']
    }
  },
  {
    name: 'bitrix24_get_deal',
    description: 'Retrieve deal information by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Deal ID' } },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_list_deals',
    description: 'List deals with optional filtering and ordering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max deals to return', default: 20 },
        filter: { type: 'object', description: 'Filter criteria' },
        orderBy: { type: 'string', enum: ['DATE_CREATE', 'DATE_MODIFY', 'ID', 'TITLE'], default: 'DATE_CREATE' },
        orderDirection: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
      }
    }
  },
  {
    name: 'bitrix24_update_deal',
    description: 'Update an existing deal in Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Deal ID' },
        title: { type: 'string', description: 'Deal title' },
        amount: { type: 'string', description: 'Deal amount' },
        currency: { type: 'string', description: 'Currency code' },
        contactId: { type: 'string', description: 'Associated contact ID' },
        companyId: { type: 'string', description: 'Associated company ID' },
        stageId: { type: 'string', description: 'Deal stage ID' },
        assignedById: { type: 'string', description: 'Responsible user ID' },
        comments: { type: 'string', description: 'Deal comments' }
      },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_delete_deal',
    description: 'Delete a deal from Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Deal ID' } },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_get_deal_pipelines',
    description: 'Get all available deal pipelines/categories with their IDs and names',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'bitrix24_get_deal_stages',
    description: 'Get all deal stages for a specific pipeline or all pipelines',
    inputSchema: {
      type: 'object',
      properties: {
        pipelineId: { type: 'string', description: 'Pipeline ID (optional — omit to get all stages)' }
      }
    }
  }
];

export async function handleDealTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_deal': {
      const deal: BitrixDeal = {
        TITLE: args.title,
        OPPORTUNITY: args.amount,
        CURRENCY_ID: args.currency || 'VND',
        CONTACT_ID: args.contactId,
        COMPANY_ID: args.companyId,
        STAGE_ID: args.stageId,
        ASSIGNED_BY_ID: args.assignedById,
        COMMENTS: args.comments
      };
      const dealId = await bitrix24Client.createDeal(deal);
      return { success: true, dealId, message: `Deal created with ID: ${dealId}` };
    }
    case 'bitrix24_get_deal': {
      const deal = await bitrix24Client.getDeal(args.id);
      return { success: true, deal };
    }
    case 'bitrix24_list_deals': {
      const order: Record<string, string> = {};
      order[args.orderBy || 'DATE_CREATE'] = args.orderDirection || 'DESC';
      const deals = await bitrix24Client.listDeals({ start: 0, filter: args.filter, order, select: ['*'] });
      return { success: true, deals: deals.slice(0, args.limit || 20) };
    }
    case 'bitrix24_update_deal': {
      const update: Partial<BitrixDeal> = {};
      if (args.title) update.TITLE = args.title;
      if (args.amount) update.OPPORTUNITY = args.amount;
      if (args.currency) update.CURRENCY_ID = args.currency;
      if (args.contactId) update.CONTACT_ID = args.contactId;
      if (args.companyId) update.COMPANY_ID = args.companyId;
      if (args.stageId) update.STAGE_ID = args.stageId;
      if (args.assignedById) update.ASSIGNED_BY_ID = args.assignedById;
      if (args.comments) update.COMMENTS = args.comments;
      const updated = await bitrix24Client.updateDeal(args.id, update);
      return { success: true, updated, message: `Deal ${args.id} updated successfully` };
    }
    case 'bitrix24_delete_deal': {
      const deleted = await bitrix24Client.deleteDeal(args.id);
      return { success: true, deleted, message: `Deal ${args.id} deleted` };
    }
    case 'bitrix24_get_deal_pipelines': {
      const pipelines = await bitrix24Client.getDealPipelines();
      return { success: true, pipelines, message: `Found ${pipelines.length} deal pipelines` };
    }
    case 'bitrix24_get_deal_stages': {
      const stages = await bitrix24Client.getDealStages(args.pipelineId);
      return { success: true, stages, message: `Found ${stages.length} deal stages` };
    }
    default:
      return undefined;
  }
}
