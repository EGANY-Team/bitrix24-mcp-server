import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { bitrix24Client } from '../bitrix24/client.js';

export const monitoringTools: Tool[] = [
  {
    name: 'bitrix24_monitor_user_activities',
    description: 'Monitor user activities including calls, emails, timeline interactions, and response times',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to monitor (optional — omit for all users)' },
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format (defaults to today)' },
        includeCallVolume: { type: 'boolean', description: 'Include call volume metrics', default: true },
        includeEmailActivity: { type: 'boolean', description: 'Include email activity metrics', default: true },
        includeTimelineActivity: { type: 'boolean', description: 'Include timeline interactions', default: true },
        includeResponseTimes: { type: 'boolean', description: 'Calculate response times', default: true }
      },
      required: ['startDate']
    }
  },
  {
    name: 'bitrix24_get_user_performance_summary',
    description: 'Get comprehensive performance summary for users including deal metrics and activity ratios',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to analyze (optional — omit for all users)' },
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format (defaults to today)' },
        includeDealMetrics: { type: 'boolean', description: 'Include deal creation/win metrics', default: true },
        includeActivityRatios: { type: 'boolean', description: 'Include activity type ratios', default: true }
      },
      required: ['startDate']
    }
  },
  {
    name: 'bitrix24_analyze_account_performance',
    description: 'Analyze performance and activities for specific accounts (companies/contacts)',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID (company or contact ID)' },
        accountType: { type: 'string', enum: ['company', 'contact'], description: 'Type of account to analyze' },
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format (defaults to today)' },
        includeAllInteractions: { type: 'boolean', description: 'Include all user interactions', default: true },
        includeDealProgression: { type: 'boolean', description: 'Include deal progression analysis', default: true },
        includeTimelineHistory: { type: 'boolean', description: 'Include complete timeline history', default: true }
      },
      required: ['accountId', 'accountType', 'startDate']
    }
  },
  {
    name: 'bitrix24_compare_user_performance',
    description: 'Compare performance metrics between multiple users',
    inputSchema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string' }, description: 'User IDs to compare (optional — omit for all users)' },
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format (defaults to today)' },
        metrics: {
          type: 'array',
          items: { type: 'string', enum: ['activities', 'deals', 'response_times', 'timeline_engagement'] },
          description: 'Specific metrics to compare',
          default: ['activities', 'deals']
        },
        includeRankings: { type: 'boolean', description: 'Include performance rankings', default: true },
        includeTrends: { type: 'boolean', description: 'Include trend analysis', default: true }
      },
      required: ['startDate']
    }
  }
];

export async function handleMonitoringTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'bitrix24_monitor_user_activities': {
      const activities = await bitrix24Client.monitorUserActivities(
        args.userId, args.startDate, args.endDate,
        { includeCallVolume: args.includeCallVolume, includeEmailActivity: args.includeEmailActivity,
          includeTimelineActivity: args.includeTimelineActivity, includeResponseTimes: args.includeResponseTimes }
      );
      return { success: true, activities, message: `Activity monitoring completed for ${args.startDate} to ${args.endDate || 'today'}` };
    }
    case 'bitrix24_get_user_performance_summary': {
      const performance = await bitrix24Client.getUserPerformanceSummary(
        args.userId, args.startDate, args.endDate,
        { includeDealMetrics: args.includeDealMetrics, includeActivityRatios: args.includeActivityRatios }
      );
      return { success: true, performance, message: `Performance summary generated for ${args.startDate} to ${args.endDate || 'today'}` };
    }
    case 'bitrix24_analyze_account_performance': {
      const accountAnalysis = await bitrix24Client.analyzeAccountPerformance(
        args.accountId, args.accountType, args.startDate, args.endDate,
        { includeAllInteractions: args.includeAllInteractions,
          includeDealProgression: args.includeDealProgression, includeTimelineHistory: args.includeTimelineHistory }
      );
      return { success: true, accountAnalysis, message: `Account analysis completed for ${args.accountType} ${args.accountId}` };
    }
    case 'bitrix24_compare_user_performance': {
      const comparison = await bitrix24Client.compareUserPerformance(
        args.userIds, args.startDate, args.endDate,
        { metrics: args.metrics, includeRankings: args.includeRankings, includeTrends: args.includeTrends }
      );
      return { success: true, comparison, message: `Performance comparison completed for ${args.userIds?.length || 'all'} users` };
    }
    default:
      return undefined;
  }
}
