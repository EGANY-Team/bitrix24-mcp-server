import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client, BitrixContact } from '../bitrix24/client.js';

export const contactTools: Tool[] = [
  {
    name: 'bitrix24_create_contact',
    description: 'Create a new contact in Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', description: 'Email address' },
        company: { type: 'string', description: 'Company name' },
        position: { type: 'string', description: 'Job position' },
        comments: { type: 'string', description: 'Additional comments' }
      },
      required: ['name', 'lastName']
    }
  },
  {
    name: 'bitrix24_get_contact',
    description: 'Retrieve contact information by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Contact ID' } },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_list_contacts',
    description: 'List contacts with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max contacts to return', default: 20 },
        filter: { type: 'object', description: 'Filter criteria (e.g., {"NAME": "John"})' }
      }
    }
  },
  {
    name: 'bitrix24_update_contact',
    description: 'Update an existing contact in Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Contact ID' },
        name: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', description: 'Email address' },
        company: { type: 'string', description: 'Company name' },
        position: { type: 'string', description: 'Job position' },
        comments: { type: 'string', description: 'Additional comments' }
      },
      required: ['id']
    }
  },
  {
    name: 'bitrix24_delete_contact',
    description: 'Delete a contact from Bitrix24 CRM',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Contact ID' } },
      required: ['id']
    }
  }
];

export async function handleContactTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_create_contact': {
      const contact: BitrixContact = {
        NAME: args.name,
        LAST_NAME: args.lastName,
        PHONE: args.phone ? [{ VALUE: args.phone, VALUE_TYPE: 'WORK' }] : undefined,
        EMAIL: args.email ? [{ VALUE: args.email, VALUE_TYPE: 'WORK' }] : undefined,
        COMPANY_TITLE: args.company,
        POST: args.position,
        COMMENTS: args.comments
      };
      const contactId = await bitrix24Client.createContact(contact);
      return { success: true, contactId, message: `Contact created with ID: ${contactId}` };
    }
    case 'bitrix24_get_contact': {
      const contact = await bitrix24Client.getContact(args.id);
      return { success: true, contact };
    }
    case 'bitrix24_list_contacts': {
      const contacts = await bitrix24Client.listContacts({ start: 0, filter: args.filter });
      return { success: true, contacts: contacts.slice(0, args.limit || 20) };
    }
    case 'bitrix24_update_contact': {
      const update: Partial<BitrixContact> = {};
      if (args.name) update.NAME = args.name;
      if (args.lastName) update.LAST_NAME = args.lastName;
      if (args.phone) update.PHONE = [{ VALUE: args.phone, VALUE_TYPE: 'WORK' }];
      if (args.email) update.EMAIL = [{ VALUE: args.email, VALUE_TYPE: 'WORK' }];
      if (args.company) update.COMPANY_TITLE = args.company;
      if (args.position) update.POST = args.position;
      if (args.comments) update.COMMENTS = args.comments;
      const updated = await bitrix24Client.updateContact(args.id, update);
      return { success: true, updated, message: `Contact ${args.id} updated successfully` };
    }
    case 'bitrix24_delete_contact': {
      const deleted = await bitrix24Client.deleteContact(args.id);
      return { success: true, deleted, message: `Contact ${args.id} deleted` };
    }
    default:
      return undefined;
  }
}
