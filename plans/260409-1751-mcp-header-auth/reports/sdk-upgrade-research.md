---
type: research
date: 2026-04-09
slug: sdk-upgrade-research
source: github.com/modelcontextprotocol/typescript-sdk (v1.x branch)
---

# SDK Upgrade Research — @modelcontextprotocol/sdk 0.4 → ^1.x

## TL;DR
- `Server` + low-level `setRequestHandler(ListToolsRequestSchema, …)` pattern **still exists** in v1.x. No forced migration to `McpServer`/`registerTool`. Keeps diff small.
- `StreamableHTTPServerTransport` lives at `@modelcontextprotocol/sdk/server/streamableHttp.js`.
- **Stateless mode is first-class**: `new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })`. Confirmed via v1.x example `simpleStatelessStreamableHttp.ts`.
- Stateless per-request pattern (from example):
  ```ts
  const server = getServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  ```
- Express must parse JSON body: `app.use(express.json())` before POST /mcp handler.

## Breaking Changes to Watch (0.4 → 1.x)

| Area | 0.4 | 1.x | Action |
|---|---|---|---|
| `Server` ctor 2nd arg | `{ name, version, capabilities }` combined in 1st arg | 2nd arg `{ capabilities: { tools: {} } }` separate | Move capabilities to 2nd arg |
| Tool registration | `setRequestHandler(ListToolsRequestSchema, …)` | same (low-level API retained) | Keep as-is |
| `Tool` type import | `@modelcontextprotocol/sdk/types.js` | same | no change |
| `McpError`, `ErrorCode` | `types.js` | same | no change |
| Transport import | `server/stdio.js` | same | no change |
| New: StreamableHTTP | n/a | `server/streamableHttp.js` | Add |

### Likely Server ctor fix
Current:
```ts
new Server({ name, version, capabilities: { tools: {} } })
```
v1.x idiomatic:
```ts
new Server({ name, version }, { capabilities: { tools: {} } })
```
The single-arg form may still compile (loose typing) but 2-arg is canonical. Verify with `tsc` after bump.

## StreamableHTTP Wiring (Stateless, chosen mode)

```ts
import express, { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createBitrixMcpServer } from './mcp-server-factory.js';

const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
});

app.post('/mcp', requireAuth, async (req: Request, res: Response) => {
  try {
    const server = createBitrixMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: 'internal' });
  }
});
```

Per-request server+transport instantiation is the v1.x stateless pattern from the official example — no global server reuse.

## Auth Middleware (constant-time, length-safe)

```ts
import { timingSafeEqual } from 'crypto';

const expected = process.env.MCP_API_KEY;
if (!expected) { console.error('MCP_API_KEY missing'); process.exit(1); }
const expectedBuf = Buffer.from(expected);

export function requireAuth(req, res, next) {
  const raw = (req.headers.authorization as string | undefined)
    ?? (req.headers['x-api-key'] as string | undefined)
    ?? '';
  const provided = raw.replace(/^Bearer\s+/i, '').trim();
  const providedBuf = Buffer.from(provided);
  if (providedBuf.length !== expectedBuf.length
      || !timingSafeEqual(providedBuf, expectedBuf)) {
    console.warn(`[auth] 401 ip=${req.ip} path=${req.path}`);
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}
```
Length-prefix guard avoids `timingSafeEqual` throw on unequal lengths.

## package.json additions
```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.10.0",
  "express": "^4.19.0",
  ...
},
"devDependencies": {
  "@types/express": "^4.17.21",
  ...
},
"scripts": {
  "start": "node build/index.js",
  "start:http": "node build/http-server.js",
  "azure:start": "node build/http-server.js"
}
```

Note: `main` currently `server.js`. Change to `build/http-server.js` or drop (type:module ESM, bin already points at build/index.js for stdio).

## tsconfig
No changes needed. `rootDir: ./src`, `outDir: ./build` — adding `src/http-server.ts` and `src/mcp-server-factory.ts` compiles into `build/` automatically.

## Open Verification Items (resolve during phase 1 impl, not planning)
- Exact latest ^1.x patch version at impl time (`npm view @modelcontextprotocol/sdk version`).
- Whether `Server` class emits deprecation warning in ^1.x (non-blocking).
- Whether `transport.handleRequest` needs `req.body` parsed as JSON object (yes, per example) vs raw buffer.

## Unresolved Questions
- None from SDK research. All carried forward from brainstorm §9.
