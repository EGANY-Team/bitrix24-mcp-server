import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { contactTools, handleContactTool } from './contact-tools.js';
import { dealTools, handleDealTool } from './deal-tools.js';
import { companyTools, handleCompanyTool } from './company-tools.js';
import { taskTools, handleTaskTool } from './task-tools.js';
import { activityTools, handleActivityTool } from './activity-tools.js';
import { userTools, handleUserTool } from './user-tools.js';
import { utilityTools, handleUtilityTool } from './utility-tools.js';
import { monitoringTools, handleMonitoringTool } from './monitoring-tools.js';

export const allTools: Tool[] = [
  ...contactTools,    // 5
  ...dealTools,       // 7
  ...companyTools,    // 5
  ...taskTools,       // 4
  ...activityTools,   // 4
  ...userTools,       // 2
  ...utilityTools,    // 2
  ...monitoringTools  // 4
];

const handlers = [
  handleContactTool,
  handleDealTool,
  handleCompanyTool,
  handleTaskTool,
  handleActivityTool,
  handleUserTool,
  handleUtilityTool,
  handleMonitoringTool
];

export async function executeToolCall(name: string, args: any): Promise<any> {
  try {
    for (const handler of handlers) {
      const result = await handler(name, args);
      if (result !== undefined) return result;
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error(`Tool execution error [${name}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
