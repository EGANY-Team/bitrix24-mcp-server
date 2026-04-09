#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createBitrixMcpServer } from './mcp-server-factory.js';
import { allTools } from './tools/index.js';

async function main() {
  console.error('Starting Bitrix24 MCP Server (stdio)...');
  console.error('Available tools:', allTools.map((t) => t.name).join(', '));

  const server = createBitrixMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Bitrix24 MCP Server running on stdio transport');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
