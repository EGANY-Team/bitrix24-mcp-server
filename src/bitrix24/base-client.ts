import fetch from 'node-fetch';
import { z } from 'zod';

const BITRIX24_WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL ||
  'https://sviluppofranchising.bitrix24.it/rest/27/wwugdez6m774803q/';

const BitrixResponseSchema = z.object({
  result: z.any(),
  error: z.optional(z.object({
    error: z.string(),
    error_description: z.string()
  })),
  total: z.optional(z.number()),
  next: z.optional(z.number()),
  time: z.optional(z.object({
    start: z.number(),
    finish: z.number(),
    duration: z.number()
  }))
});

export class BaseBitrixClient {
  protected baseUrl: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 500; // 500ms between requests (2 req/s)

  constructor(webhookUrl: string = BITRIX24_WEBHOOK_URL) {
    this.baseUrl = webhookUrl.replace(/\/$/, '');
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - elapsed));
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  public async makeRequest(method: string, params: Record<string, any> = {}): Promise<any> {
    await this.enforceRateLimit();
    const url = `${this.baseUrl}/${method}`;

    try {
      let response;

      if (Object.keys(params).length === 0) {
        response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
      } else {
        const body = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (key === 'fields' && typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([fieldKey, fieldValue]) => {
              if (Array.isArray(fieldValue)) {
                (fieldValue as any[]).forEach((item, index) => {
                  if (typeof item === 'object') {
                    Object.entries(item).forEach(([subKey, subValue]) => {
                      body.append(`fields[${fieldKey}][${index}][${subKey}]`, String(subValue));
                    });
                  } else {
                    body.append(`fields[${fieldKey}][${index}]`, String(item));
                  }
                });
              } else if (typeof fieldValue === 'object' && fieldValue !== null) {
                Object.entries(fieldValue).forEach(([subKey, subValue]) => {
                  body.append(`fields[${fieldKey}][${subKey}]`, String(subValue));
                });
              } else if (fieldValue !== undefined && fieldValue !== null) {
                body.append(`fields[${fieldKey}]`, String(fieldValue));
              }
            });
          } else if (key === 'order' && typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([k, v]) => body.append(`order[${k}]`, String(v)));
          } else if (key === 'filter' && typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([k, v]) => body.append(`filter[${k}]`, String(v)));
          } else if (typeof value === 'object' && value !== null) {
            body.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            body.append(key, String(value));
          }
        });

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: body.toString()
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = BitrixResponseSchema.parse(data);

      if (parsed.error) {
        throw new Error(`Bitrix24 API Error: ${parsed.error.error} - ${parsed.error.error_description}`);
      }

      return parsed.result;
    } catch (error) {
      console.error(`Bitrix24 API Error [${method}]:`, error);
      throw error;
    }
  }
}
