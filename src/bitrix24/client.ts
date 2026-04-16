import { BaseBitrixClient } from './base-client.js';
import { ContactClient } from './contact-client.js';
import { DealClient } from './deal-client.js';
import { CompanyClient } from './company-client.js';
import { TaskClient } from './task-client.js';
import { UserClient } from './user-client.js';
import { ActivityClient } from './activity-client.js';
import { MonitoringClient } from './monitoring-client.js';
import { SmartItemClient, SmartItemFields } from './smart-item-client.js';

export type { BitrixContact, BitrixDeal, BitrixTask, BitrixCompany } from './types.js';
export type { SmartItemFields } from './smart-item-client.js';

export class Bitrix24Client {
  private base: BaseBitrixClient;
  private contacts: ContactClient;
  private deals: DealClient;
  private companies: CompanyClient;
  private tasks: TaskClient;
  private users: UserClient;
  private activities: ActivityClient;
  private monitoring: MonitoringClient;
  private smartItems: SmartItemClient;

  constructor() {
    this.base = new BaseBitrixClient();
    this.contacts = new ContactClient(this.base);
    this.deals = new DealClient(this.base);
    this.companies = new CompanyClient(this.base);
    this.tasks = new TaskClient(this.base);
    this.users = new UserClient(this.base);
    this.activities = new ActivityClient(this.base);
    this.monitoring = new MonitoringClient(this.base);
    this.smartItems = new SmartItemClient(this.base);
  }

  // Contacts
  createContact(c: any) { return this.contacts.createContact(c); }
  getContact(id: string) { return this.contacts.getContact(id); }
  updateContact(id: string, c: any) { return this.contacts.updateContact(id, c); }
  listContacts(p?: any) { return this.contacts.listContacts(p); }
  deleteContact(id: string) { return this.contacts.deleteContact(id); }

  // Deals
  createDeal(d: any) { return this.deals.createDeal(d); }
  getDeal(id: string) { return this.deals.getDeal(id); }
  updateDeal(id: string, d: any) { return this.deals.updateDeal(id, d); }
  listDeals(p?: any) { return this.deals.listDeals(p); }
  deleteDeal(id: string) { return this.deals.deleteDeal(id); }
  getDealPipelines() { return this.deals.getDealPipelines(); }
  getDealStages(pipelineId?: string) { return this.deals.getDealStages(pipelineId); }

  // Companies
  createCompany(c: any) { return this.companies.createCompany(c); }
  getCompany(id: string) { return this.companies.getCompany(id); }
  updateCompany(id: string, c: any) { return this.companies.updateCompany(id, c); }
  listCompanies(p?: any) { return this.companies.listCompanies(p); }
  deleteCompany(id: string) { return this.companies.deleteCompany(id); }

  // Tasks
  createTask(t: any, checklistItems?: string[]) { return this.tasks.createTask(t, checklistItems); }
  getTask(id: string) { return this.tasks.getTask(id); }
  updateTask(id: string, t: any) { return this.tasks.updateTask(id, t); }
  listTasks(p?: any) { return this.tasks.listTasks(p); }
  getChecklist(taskId: string) { return this.tasks.getChecklist(taskId); }
  addChecklistItem(taskId: string, title: string) { return this.tasks.addChecklistItem(taskId, title); }
  updateChecklistItem(taskId: string, itemId: string, title: string) { return this.tasks.updateChecklistItem(taskId, itemId, title); }
  completeChecklistItem(taskId: string, itemId: string, complete: boolean) { return this.tasks.completeChecklistItem(taskId, itemId, complete); }
  deleteChecklistItem(taskId: string, itemId: string) { return this.tasks.deleteChecklistItem(taskId, itemId); }

  // Users
  getCurrentUser() { return this.users.getCurrentUser(); }
  getAllUsers() { return this.users.getAllUsers(); }

  // Activities
  createActivity(fields: any) { return this.activities.createActivity(fields); }
  updateActivity(id: number, fields: any) { return this.activities.updateActivity(id, fields); }
  addTimelineComment(entityId: number, entityType: string, comment: string) {
    return this.activities.addTimelineComment(entityId, entityType, comment);
  }
  listActivities(p?: any) { return this.activities.listActivities(p); }
  getCRMStatuses(entityId?: string) { return this.activities.getCRMStatuses(entityId); }
  searchCRM(query: string, entityTypes?: string[]) { return this.activities.searchCRM(query, entityTypes); }

  // Monitoring
  monitorUserActivities(userId?: string, startDate?: string, endDate?: string, options?: any) {
    return this.monitoring.monitorUserActivities(userId, startDate, endDate, options);
  }
  getUserPerformanceSummary(userId?: string, startDate?: string, endDate?: string, options?: any) {
    return this.monitoring.getUserPerformanceSummary(userId, startDate, endDate, options);
  }
  analyzeAccountPerformance(accountId: string, accountType: any, startDate?: string, endDate?: string, options?: any) {
    return this.monitoring.analyzeAccountPerformance(accountId, accountType, startDate, endDate, options);
  }
  compareUserPerformance(userIds?: string[], startDate?: string, endDate?: string, options?: any) {
    return this.monitoring.compareUserPerformance(userIds, startDate, endDate, options);
  }

  // Smart Items (SPA - invoices, etc.)
  createSmartItem(entityTypeId: number, fields: SmartItemFields) {
    return this.smartItems.createSmartItem(entityTypeId, fields);
  }
  getSmartItem(entityTypeId: number, id: number) {
    return this.smartItems.getSmartItem(entityTypeId, id);
  }
  listSmartItems(entityTypeId: number, options?: any) {
    return this.smartItems.listSmartItems(entityTypeId, options);
  }
  updateSmartItem(entityTypeId: number, id: number, fields: Partial<SmartItemFields>) {
    return this.smartItems.updateSmartItem(entityTypeId, id, fields);
  }
  deleteSmartItem(entityTypeId: number, id: number) {
    return this.smartItems.deleteSmartItem(entityTypeId, id);
  }
}

export const bitrix24Client = new Bitrix24Client();
