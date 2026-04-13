// Bitrix24 CRM entity interfaces

export interface BitrixContact {
  ID?: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  COMPANY_TITLE?: string;
  POST?: string;
  COMMENTS?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
}

export interface BitrixDeal {
  ID?: string;
  TITLE?: string;
  STAGE_ID?: string;
  OPPORTUNITY?: string;
  CURRENCY_ID?: string;
  CONTACT_ID?: string;
  COMPANY_ID?: string;
  BEGINDATE?: string;
  CLOSEDATE?: string;
  COMMENTS?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
  ASSIGNED_BY_ID?: string;
  CREATED_BY_ID?: string;
  MODIFY_BY_ID?: string;
}

export interface BitrixTask {
  ID?: string;
  TITLE?: string;
  DESCRIPTION?: string;
  RESPONSIBLE_ID?: string;
  DEADLINE?: string;
  PRIORITY?: '0' | '1' | '2'; // 0=Low, 1=Normal, 2=High
  STATUS?: '1' | '2' | '3' | '4' | '5'; // 1=New, 2=Pending, 3=In Progress, 4=Completed, 5=Deferred
  STAGE?: string;
  UF_CRM_TASK?: string[]; // CRM entities linked to task
}

export interface BitrixCompany {
  ID?: string;
  TITLE?: string;
  COMPANY_TYPE?: string;
  INDUSTRY?: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  WEB?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  ADDRESS?: string;
  EMPLOYEES?: string;
  REVENUE?: string;
  COMMENTS?: string;
  ASSIGNED_BY_ID?: string;
  CREATED_BY_ID?: string;
  MODIFY_BY_ID?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
}
