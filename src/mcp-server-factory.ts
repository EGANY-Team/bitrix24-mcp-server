import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, executeToolCall } from './tools/index.js';

/**
 * Create a fresh Bitrix24 MCP Server instance.
 *
 * Returns a new Server each call — required for stateless HTTP transport
 * (per-request server+transport). Stdio entry calls once at boot.
 * Tool handlers are stateless (go through singleton bitrix24Client).
 */
export function createBitrixMcpServer(): Server {
  const server = new Server(
    {
      name: 'bitrix24-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`Executing tool: ${name}`);

    try {
      const result = await executeToolCall(name, args || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(`Tool execution failed [${name}]:`, error);
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  return server;
}
