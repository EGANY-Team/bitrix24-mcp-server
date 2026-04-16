import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client } from '../bitrix24/client.js';

export const smartItemTools: Tool[] = [
  {
    name: 'bitrix24_create_smart_item',
    description: 'Create a Smart Process Automation item (e.g., invoice). For EGANY invoices: entityTypeId=31, categoryId=2',
    inputSchema: {
      type: 'object',
      properties: {
        entityTypeId: { type: 'string', description: 'SPA entity type ID (31 for EGANY invoices)' },
        title: { type: 'string', description: 'Item title' },
        categoryId: { type: 'string', description: 'Category ID (2 for EGANY invoices)' },
        stageId: { type: 'string', description: 'Stage ID (e.g., DT31_2:NEW)' },
        opportunity: { type: 'string', description: 'Amount (e.g., 4000000)' },
        currencyId: { type: 'string', description: 'Currency code', default: 'VND' },
        assignedById: { type: 'string', description: 'Responsible user ID' },
        contactId: { type: 'string', description: 'Contact ID' },
        companyId: { type: 'string', description: 'Company ID' },
        parentId2: { type: 'string', description: 'Parent deal ID (links invoice to deal)' },
        customFields: { type: 'object', description: 'Custom fields (ufCrm... format)' }
      },
      required: ['entityTypeId', 'title']
    }
  },
  {
    name: 'bitrix24_get_smart_item',
    description: 'Get a Smart Process Automation item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        entityTypeId: { type: 'string', description: 'SPA entity type ID' },
        id: { type: 'string', description: 'Item ID' }
      },
      required: ['entityTypeId', 'id']
    }
  },
  {
    name: 'bitrix24_list_smart_items',
    description: 'List Smart Process Automation items with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        entityTypeId: { type: 'string', description: 'SPA entity type ID' },
        filter: { type: 'object', description: 'Filter criteria (e.g., {parentId2: 123} to get invoices for a deal)' },
        order: { type: 'object', description: 'Order criteria (e.g., {id: "ASC"})' },
        select: { type: 'array', items: { type: 'string' }, description: 'Fields to select' },
        limit: { type: 'number', description: 'Max items to return', default: 20 }
      },
      required: ['entityTypeId']
    }
  },
  {
    name: 'bitrix24_update_smart_item',
    description: 'Update a Smart Process Automation item (e.g., mark invoice as paid by setting stageId)',
    inputSchema: {
      type: 'object',
      properties: {
        entityTypeId: { type: 'string', description: 'SPA entity type ID' },
        id: { type: 'string', description: 'Item ID' },
        title: { type: 'string', description: 'Item title' },
        categoryId: { type: 'string', description: 'Category ID' },
        stageId: { type: 'string', description: 'Stage ID (e.g., DT31_2:P for paid)' },
        opportunity: { type: 'string', description: 'Amount' },
        currencyId: { type: 'string', description: 'Currency code' },
        assignedById: { type: 'string', description: 'Responsible user ID' },
        contactId: { type: 'string', description: 'Contact ID' },
        companyId: { type: 'string', description: 'Company ID' },
        parentId2: { type: 'string', description: 'Parent deal ID (re-link to different deal)' },
        customFields: { type: 'object', description: 'Custom fields (ufCrm... format)' }
      },
      required: ['entityTypeId', 'id']
    }
  },
  {
    name: 'bitrix24_delete_smart_item',
    description: 'Delete a Smart Process Automation item',
    inputSchema: {
      type: 'object',
      properties: {
        entityTypeId: { type: 'string', description: 'SPA entity type ID' },
        id: { type: 'string', description: 'Item ID' }
      },
      required: ['entityTypeId', 'id']
    }
  }
];

// Helper to convert string to number (for API compatibility)
function toNum(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export async function handleSmartItemTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_smart_item': {
      const fields: Record<string, any> = {
        title: args.title,
        categoryId: toNum(args.categoryId),
        stageId: args.stageId,
        opportunity: toNum(args.opportunity),
        currencyId: args.currencyId || 'VND',
        assignedById: toNum(args.assignedById),
        contactId: toNum(args.contactId),
        companyId: toNum(args.companyId),
        parentId2: toNum(args.parentId2)
      };
      if (args.customFields) Object.assign(fields, args.customFields);
      const entityTypeId = toNum(args.entityTypeId) || 31;
      const item = await bitrix24Client.createSmartItem(entityTypeId, fields);
      return { success: true, item, message: `Smart item created with ID: ${item?.id || item}` };
    }
    case 'bitrix24_get_smart_item': {
      const entityTypeId = toNum(args.entityTypeId) || 31;
      const id = toNum(args.id) || 0;
      const item = await bitrix24Client.getSmartItem(entityTypeId, id);
      return { success: true, item };
    }
    case 'bitrix24_list_smart_items': {
      const entityTypeId = toNum(args.entityTypeId) || 31;
      const items = await bitrix24Client.listSmartItems(entityTypeId, {
        filter: args.filter,
        order: args.order,
        select: args.select,
        limit: args.limit || 20
      });
      return { success: true, items, count: items.length };
    }
    case 'bitrix24_update_smart_item': {
      const fields: Record<string, any> = {};
      if (args.title !== undefined) fields.title = args.title;
      if (args.categoryId !== undefined) fields.categoryId = toNum(args.categoryId);
      if (args.stageId !== undefined) fields.stageId = args.stageId;
      if (args.opportunity !== undefined) fields.opportunity = toNum(args.opportunity);
      if (args.currencyId !== undefined) fields.currencyId = args.currencyId;
      if (args.assignedById !== undefined) fields.assignedById = toNum(args.assignedById);
      if (args.contactId !== undefined) fields.contactId = toNum(args.contactId);
      if (args.companyId !== undefined) fields.companyId = toNum(args.companyId);
      if (args.parentId2 !== undefined) fields.parentId2 = toNum(args.parentId2);
      if (args.customFields) Object.assign(fields, args.customFields);
      const entityTypeId = toNum(args.entityTypeId) || 31;
      const id = toNum(args.id) || 0;
      const item = await bitrix24Client.updateSmartItem(entityTypeId, id, fields);
      return { success: true, item, message: `Smart item ${args.id} updated` };
    }
    case 'bitrix24_delete_smart_item': {
      const entityTypeId = toNum(args.entityTypeId) || 31;
      const id = toNum(args.id) || 0;
      await bitrix24Client.deleteSmartItem(entityTypeId, id);
      return { success: true, message: `Smart item ${args.id} deleted` };
    }
    default:
      return undefined;
  }
}
