import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client, BitrixCompany } from '../bitrix24/client.js';

export const companyTools: Tool[] = [
  {
    name: 'bitrix24_create_company',
    description: 'Create a new company in Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Company name' },
        companyType: { type: 'string', description: 'Company type (e.g., CLIENT, SUPPLIER, PARTNER)' },
        industry: { type: 'string', description: 'Industry sector' },
        phone: { type: 'string', description: 'Company phone number' },
        email: { type: 'string', description: 'Company email address' },
        website: { type: 'string', description: 'Company website URL' },
        address: { type: 'string', description: 'Company address' },
        employees: { type: 'string', description: 'Number of employees' },
        revenue: { type: 'string', description: 'Annual revenue' },
        comments: { type: 'string', description: 'Additional comments' },
        assignedById: { type: 'string', description: 'Assigned user ID' }
      },
      required: ['title']
    }
  },
  {
    name: 'bitrix24_get_company',
    description: 'Retrieve company information by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Company ID' } },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_list_companies',
    description: 'List companies with optional filtering and ordering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max companies to return', default: 20 },
        filter: { type: 'object', description: 'Filter criteria' },
        orderBy: { type: 'string', enum: ['DATE_CREATE', 'DATE_MODIFY', 'ID', 'TITLE'], default: 'DATE_CREATE' },
        orderDirection: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
      }
    }
  },
  {
    name: 'bitrix24_update_company',
    description: 'Update an existing company in Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Company ID' },
        title: { type: 'string', description: 'Company name' },
        companyType: { type: 'string', description: 'Company type' },
        industry: { type: 'string', description: 'Industry sector' },
        phone: { type: 'string', description: 'Company phone number' },
        email: { type: 'string', description: 'Company email address' },
        website: { type: 'string', description: 'Company website URL' },
        address: { type: 'string', description: 'Company address' },
        employees: { type: 'string', description: 'Number of employees' },
        revenue: { type: 'string', description: 'Annual revenue' },
        comments: { type: 'string', description: 'Additional comments' },
        assignedById: { type: 'string', description: 'Assigned user ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_delete_company',
    description: 'Delete a company from Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Company ID' } },
      required: ['id']
    }
  }
];

export async function handleCompanyTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_company': {
      const company: BitrixCompany = {
        TITLE: args.title,
        COMPANY_TYPE: args.companyType,
        INDUSTRY: args.industry,
        PHONE: args.phone ? [{ VALUE: args.phone, VALUE_TYPE: 'WORK' }] : undefined,
        EMAIL: args.email ? [{ VALUE: args.email, VALUE_TYPE: 'WORK' }] : undefined,
        WEB: args.website ? [{ VALUE: args.website, VALUE_TYPE: 'WORK' }] : undefined,
        ADDRESS: args.address,
        EMPLOYEES: args.employees,
        REVENUE: args.revenue,
        COMMENTS: args.comments,
        ASSIGNED_BY_ID: args.assignedById
      };
      const companyId = await bitrix24Client.createCompany(company);
      return { success: true, companyId, message: `Company created with ID: ${companyId}` };
    }
    case 'bitrix24_get_company': {
      const company = await bitrix24Client.getCompany(args.id);
      return { success: true, company };
    }
    case 'bitrix24_list_companies': {
      const order: Record<string, string> = {};
      order[args.orderBy || 'DATE_CREATE'] = args.orderDirection || 'DESC';
      const companies = await bitrix24Client.listCompanies({ start: 0, filter: args.filter, order, select: ['*'] });
      return { success: true, companies: companies.slice(0, args.limit || 20) };
    }
    case 'bitrix24_update_company': {
      const update: Partial<BitrixCompany> = {};
      if (args.title) update.TITLE = args.title;
      if (args.companyType) update.COMPANY_TYPE = args.companyType;
      if (args.industry) update.INDUSTRY = args.industry;
      if (args.phone) update.PHONE = [{ VALUE: args.phone, VALUE_TYPE: 'WORK' }];
      if (args.email) update.EMAIL = [{ VALUE: args.email, VALUE_TYPE: 'WORK' }];
      if (args.website) update.WEB = [{ VALUE: args.website, VALUE_TYPE: 'WORK' }];
      if (args.address) update.ADDRESS = args.address;
      if (args.employees) update.EMPLOYEES = args.employees;
      if (args.revenue) update.REVENUE = args.revenue;
      if (args.comments) update.COMMENTS = args.comments;
      if (args.assignedById) update.ASSIGNED_BY_ID = args.assignedById;
      const updated = await bitrix24Client.updateCompany(args.id, update);
      return { success: true, updated, message: `Company ${args.id} updated successfully` };
    }
    case 'bitrix24_delete_company': {
      const deleted = await bitrix24Client.deleteCompany(args.id);
      return { success: true, deleted, message: `Company ${args.id} deleted` };
    }
    default:
      return undefined;
  }
}
