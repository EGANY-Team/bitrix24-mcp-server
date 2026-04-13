import { BaseBitrixClient } from './base-client.js';

export class MonitoringClient {
  constructor(private base: BaseBitrixClient) {}

  async monitorUserActivities(
    userId?: string,
    startDate?: string,
    endDate?: string,
    options: {
      includeCallVolume?: boolean;
      includeEmailActivity?: boolean;
      includeTimelineActivity?: boolean;
      includeResponseTimes?: boolean;
    } = {}
  ): Promise<any> {
    const endDateToUse = endDate || new Date().toISOString().split('T')[0];
    const results: any = {
      userId: userId || 'all_users',
      period: { startDate, endDate: endDateToUse },
      metrics: {}
    };

    try {
      const users = userId ? [{ ID: userId }] : await this.base.makeRequest('user.get');

      for (const user of users) {
        const userMetrics: any = {
          userId: user.ID,
          userName: `${user.NAME || ''} ${user.LAST_NAME || ''}`.trim(),
          activities: {}
        };

        if (options.includeCallVolume) {
          try {
            const callActivities = await this.base.makeRequest('crm.activity.list', {
              filter: { TYPE_ID: 2, RESPONSIBLE_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
              select: ['ID', 'DATE_CREATE', 'DIRECTION', 'SUBJECT']
            });
            userMetrics.activities.calls = {
              total: callActivities.length,
              incoming: callActivities.filter((a: any) => a.DIRECTION === '1').length,
              outgoing: callActivities.filter((a: any) => a.DIRECTION === '2').length
            };
          } catch (error) {
            userMetrics.activities.calls = { error: `Failed to get call data: ${error}` };
          }
        }

        if (options.includeEmailActivity) {
          try {
            const emailActivities = await this.base.makeRequest('crm.activity.list', {
              filter: { TYPE_ID: 4, RESPONSIBLE_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
              select: ['ID', 'DATE_CREATE', 'DIRECTION', 'SUBJECT']
            });
            userMetrics.activities.emails = {
              total: emailActivities.length,
              incoming: emailActivities.filter((a: any) => a.DIRECTION === '1').length,
              outgoing: emailActivities.filter((a: any) => a.DIRECTION === '2').length
            };
          } catch (error) {
            userMetrics.activities.emails = { error: `Failed to get email data: ${error}` };
          }
        }

        if (options.includeTimelineActivity) {
          try {
            const timelineEntries = await this.base.makeRequest('crm.timeline.comment.list', {
              filter: { AUTHOR_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse }
            });
            userMetrics.activities.timeline = { total: timelineEntries.length };
          } catch (error) {
            userMetrics.activities.timeline = { error: `Failed to get timeline data: ${error}` };
          }
        }

        if (options.includeResponseTimes) {
          try {
            const allActivities = await this.base.makeRequest('crm.activity.list', {
              filter: { RESPONSIBLE_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
              select: ['ID', 'DATE_CREATE', 'DIRECTION', 'TYPE_ID'],
              order: { DATE_CREATE: 'ASC' }
            });
            userMetrics.activities.responseTimes = this.calculateResponseTimes(allActivities);
          } catch (error) {
            userMetrics.activities.responseTimes = { error: `Failed to calculate response times: ${error}` };
          }
        }

        results.metrics[user.ID] = userMetrics;
      }

      return results;
    } catch (error) {
      console.error('Error monitoring user activities:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getUserPerformanceSummary(
    userId?: string,
    startDate?: string,
    endDate?: string,
    options: {
      includeDealMetrics?: boolean;
      includeActivityRatios?: boolean;
    } = {}
  ): Promise<any> {
    const endDateToUse = endDate || new Date().toISOString().split('T')[0];
    const results: any = {
      userId: userId || 'all_users',
      period: { startDate, endDate: endDateToUse },
      performance: {}
    };

    try {
      const users = userId ? [{ ID: userId }] : await this.base.makeRequest('user.get');

      for (const user of users) {
        const userPerformance: any = {
          userId: user.ID,
          userName: `${user.NAME || ''} ${user.LAST_NAME || ''}`.trim(),
          metrics: {}
        };

        if (options.includeDealMetrics) {
          try {
            const deals = await this.base.makeRequest('crm.deal.list', {
              filter: { ASSIGNED_BY_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
              select: ['ID', 'TITLE', 'OPPORTUNITY', 'STAGE_ID', 'DATE_CREATE', 'CLOSEDATE']
            });
            const wonDeals = deals.filter((d: any) => d.STAGE_ID?.includes('WON') || d.STAGE_ID?.includes('SUCCESS'));
            const lostDeals = deals.filter((d: any) => d.STAGE_ID?.includes('LOST') || d.STAGE_ID?.includes('FAIL'));
            userPerformance.metrics.deals = {
              total: deals.length,
              won: wonDeals.length,
              lost: lostDeals.length,
              inProgress: deals.length - wonDeals.length - lostDeals.length,
              totalValue: deals.reduce((sum: number, d: any) => sum + (parseFloat(d.OPPORTUNITY) || 0), 0),
              wonValue: wonDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.OPPORTUNITY) || 0), 0),
              winRate: deals.length > 0 ? (wonDeals.length / deals.length * 100).toFixed(2) : '0'
            };
          } catch (error) {
            userPerformance.metrics.deals = { error: `Failed to get deal metrics: ${error}` };
          }
        }

        if (options.includeActivityRatios) {
          try {
            const activities = await this.base.makeRequest('crm.activity.list', {
              filter: { RESPONSIBLE_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
              select: ['ID', 'TYPE_ID', 'DIRECTION']
            });
            const activityCounts = activities.reduce((acc: any, activity: any) => {
              acc[activity.TYPE_ID] = (acc[activity.TYPE_ID] || 0) + 1;
              return acc;
            }, {});
            userPerformance.metrics.activityRatios = {
              total: activities.length,
              breakdown: activityCounts,
              callsToEmails: activityCounts['2'] && activityCounts['4']
                ? (activityCounts['2'] / activityCounts['4']).toFixed(2) : 'N/A'
            };
          } catch (error) {
            userPerformance.metrics.activityRatios = { error: `Failed to get activity ratios: ${error}` };
          }
        }

        results.performance[user.ID] = userPerformance;
      }

      return results;
    } catch (error) {
      console.error('Error getting user performance summary:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  async analyzeAccountPerformance(
    accountId: string,
    accountType: 'company' | 'contact',
    startDate?: string,
    endDate?: string,
    options: {
      includeAllInteractions?: boolean;
      includeDealProgression?: boolean;
      includeTimelineHistory?: boolean;
    } = {}
  ): Promise<any> {
    const endDateToUse = endDate || new Date().toISOString().split('T')[0];
    const results: any = { accountId, accountType, period: { startDate, endDate: endDateToUse }, analysis: {} };

    try {
      const accountData = accountType === 'company'
        ? await this.base.makeRequest('crm.company.get', { id: accountId })
        : await this.base.makeRequest('crm.contact.get', { id: accountId });
      results.accountDetails = accountData;

      if (options.includeAllInteractions) {
        const filterKey = accountType === 'company' ? 'COMPANY_ID' : 'CONTACT_ID';
        const activities = await this.base.makeRequest('crm.activity.list', {
          filter: { [filterKey]: accountId, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
          select: ['ID', 'TYPE_ID', 'SUBJECT', 'DATE_CREATE', 'RESPONSIBLE_ID', 'DIRECTION']
        });
        results.analysis.interactions = {
          total: activities.length,
          byType: activities.reduce((acc: any, a: any) => { acc[a.TYPE_ID] = (acc[a.TYPE_ID] || 0) + 1; return acc; }, {}),
          byUser: activities.reduce((acc: any, a: any) => { acc[a.RESPONSIBLE_ID] = (acc[a.RESPONSIBLE_ID] || 0) + 1; return acc; }, {})
        };
      }

      if (options.includeDealProgression) {
        const filterKey = accountType === 'company' ? 'COMPANY_ID' : 'CONTACT_ID';
        const deals = await this.base.makeRequest('crm.deal.list', {
          filter: { [filterKey]: accountId, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
          select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY', 'DATE_CREATE', 'CLOSEDATE', 'ASSIGNED_BY_ID']
        });
        results.analysis.dealProgression = {
          total: deals.length,
          totalValue: deals.reduce((sum: number, d: any) => sum + (parseFloat(d.OPPORTUNITY) || 0), 0),
          byStage: deals.reduce((acc: any, d: any) => { acc[d.STAGE_ID] = (acc[d.STAGE_ID] || 0) + 1; return acc; }, {})
        };
      }

      if (options.includeTimelineHistory) {
        const entityType = accountType === 'company' ? 'COMPANY' : 'CONTACT';
        try {
          const timelineEntries = await this.base.makeRequest('crm.timeline.comment.list', {
            filter: { ENTITY_TYPE: entityType, ENTITY_ID: accountId, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse }
          });
          results.analysis.timelineHistory = { total: timelineEntries.length, details: timelineEntries };
        } catch (error) {
          results.analysis.timelineHistory = { error: `Failed to get timeline: ${error}` };
        }
      }

      return results;
    } catch (error) {
      console.error('Error analyzing account performance:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  async compareUserPerformance(
    userIds?: string[],
    startDate?: string,
    endDate?: string,
    options: {
      metrics?: string[];
      includeRankings?: boolean;
      includeTrends?: boolean;
    } = {}
  ): Promise<any> {
    const endDateToUse = endDate || new Date().toISOString().split('T')[0];
    const results: any = { period: { startDate, endDate: endDateToUse }, comparison: {}, rankings: {} };

    try {
      const users = userIds?.length ? userIds.map(id => ({ ID: id })) : await this.base.makeRequest('user.get');
      // Strip 'conversions' — lead-dependent metric not supported on Basic plan
      const metricsToCompare = (options.metrics || ['activities', 'deals']).filter(m => m !== 'conversions');

      for (const user of users) {
        const userComparison: any = {
          userId: user.ID,
          userName: `${user.NAME || ''} ${user.LAST_NAME || ''}`.trim(),
          metrics: {}
        };

        if (metricsToCompare.includes('activities')) {
          const activities = await this.base.makeRequest('crm.activity.list', {
            filter: { RESPONSIBLE_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
            select: ['ID', 'TYPE_ID']
          });
          userComparison.metrics.activities = {
            total: activities.length,
            calls: activities.filter((a: any) => a.TYPE_ID === '2').length,
            emails: activities.filter((a: any) => a.TYPE_ID === '4').length,
            meetings: activities.filter((a: any) => a.TYPE_ID === '1').length
          };
        }

        if (metricsToCompare.includes('deals')) {
          const deals = await this.base.makeRequest('crm.deal.list', {
            filter: { ASSIGNED_BY_ID: user.ID, '>=DATE_CREATE': startDate, '<=DATE_CREATE': endDateToUse },
            select: ['ID', 'OPPORTUNITY', 'STAGE_ID']
          });
          const wonDeals = deals.filter((d: any) => d.STAGE_ID?.includes('WON') || d.STAGE_ID?.includes('SUCCESS'));
          userComparison.metrics.deals = {
            total: deals.length,
            won: wonDeals.length,
            totalValue: deals.reduce((sum: number, d: any) => sum + (parseFloat(d.OPPORTUNITY) || 0), 0),
            wonValue: wonDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.OPPORTUNITY) || 0), 0),
            winRate: deals.length > 0 ? (wonDeals.length / deals.length * 100).toFixed(2) : '0'
          };
        }

        results.comparison[user.ID] = userComparison;
      }

      if (options.includeRankings) {
        results.rankings = this.generateUserRankings(results.comparison, metricsToCompare);
      }

      return results;
    } catch (error) {
      console.error('Error comparing user performance:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private calculateResponseTimes(activities: any[]): any {
    const incoming = activities.filter(a => a.DIRECTION === '1');
    const outgoing = activities.filter(a => a.DIRECTION === '2');
    const responseTimes: number[] = [];

    incoming.forEach(inc => {
      const nextOut = outgoing.find(out => new Date(out.DATE_CREATE) > new Date(inc.DATE_CREATE));
      if (nextOut) {
        responseTimes.push((new Date(nextOut.DATE_CREATE).getTime() - new Date(inc.DATE_CREATE).getTime()) / 3600000);
      }
    });

    return {
      averageResponseTime: responseTimes.length > 0
        ? (responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length).toFixed(2) + ' hours' : 'N/A',
      totalResponses: responseTimes.length,
      fastestResponse: responseTimes.length > 0 ? Math.min(...responseTimes).toFixed(2) + ' hours' : 'N/A',
      slowestResponse: responseTimes.length > 0 ? Math.max(...responseTimes).toFixed(2) + ' hours' : 'N/A'
    };
  }

  private generateUserRankings(comparison: any, metrics: string[]): any {
    const rankings: any = {};
    const users = Object.values(comparison) as any[];

    if (metrics.includes('activities')) {
      rankings.activities = [...users]
        .sort((a, b) => (b.metrics.activities?.total || 0) - (a.metrics.activities?.total || 0))
        .map((u, i) => ({ rank: i + 1, userId: u.userId, userName: u.userName, value: u.metrics.activities?.total || 0 }));
    }
    if (metrics.includes('deals')) {
      rankings.deals = [...users]
        .sort((a, b) => (b.metrics.deals?.wonValue || 0) - (a.metrics.deals?.wonValue || 0))
        .map((u, i) => ({ rank: i + 1, userId: u.userId, userName: u.userName, value: u.metrics.deals?.wonValue || 0 }));
    }

    return rankings;
  }
}
