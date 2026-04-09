#!/usr/bin/env node

import express, { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createBitrixMcpServer } from './mcp-server-factory.js';
import { allTools } from './tools/index.js';

const PORT = Number(process.env.PORT) || 3000;
const VERSION = '1.0.0';

// Fail fast if auth key missing — silent bypass unacceptable.
const expected = process.env.MCP_API_KEY;
if (!expected) {
  console.error('[fatal] MCP_API_KEY env var is required — refusing to start');
  process.exit(1);
}
const expectedBuf = Buffer.from(expected);

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const raw =
    (req.headers.authorization as string | undefined) ??
    (req.headers['x-api-key'] as string | undefined) ??
    '';
  const provided = raw.replace(/^Bearer\s+/i, '').trim();
  const providedBuf = Buffer.from(provided);

  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    console.warn(`[auth] 401 ip=${req.ip} path=${req.path}`);
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: VERSION,
    tools: allTools.length,
  });
});

// Stateless per-request MCP endpoint.
app.post('/mcp', requireAuth, async (req: Request, res: Response) => {
  try {
    const server = createBitrixMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[/mcp] handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal' });
    }
  }
});

// GET/DELETE not supported in stateless mode.
app.get('/mcp', (_req: Request, res: Response) => {
  res.status(405).json({ error: 'method_not_allowed' });
});
app.delete('/mcp', (_req: Request, res: Response) => {
  res.status(405).json({ error: 'method_not_allowed' });
});

// 404 fallback.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' });
});

const httpServer = app.listen(PORT, () => {
  console.error(`Bitrix24 MCP HTTP server listening on :${PORT}`);
  console.error(`  POST /mcp   (bearer auth)`);
  console.error(`  GET  /health`);
  console.error(`  tools=${allTools.length}`);
});

function shutdown(signal: string) {
  console.error(`[${signal}] shutting down`);
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
