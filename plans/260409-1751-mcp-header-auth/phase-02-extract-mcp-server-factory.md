# Phase 02 — Extract `createBitrixMcpServer` Factory

## Context Links
- `src/index.ts:14-59` — current Server+handlers wiring
- `src/tools/index.ts:916` (`allTools`), `:973` (`executeToolCall`)
- Brainstorm §5.2

## Overview
**Priority:** P2
**Status:** pending
Extract the `Server` instantiation + handler registration from `src/index.ts` into a new module `src/mcp-server-factory.ts` exporting `createBitrixMcpServer()`. Both stdio entry (`src/index.ts`) and future HTTP entry (`src/http-server.ts`) consume it. DRY.

## Key Insights
- Factory returns a **fresh** `Server` instance per call (needed for stateless HTTP: per-request server+transport).
- `stdio` entry still calls factory once at boot and keeps the instance for process lifetime.
- No shared mutable state between instances — tool calls go through stateless `bitrix24Client` singleton already.
- Keep factory file under 200 LOC (trivial — should be ~50).

## Requirements
- Factory signature: `export function createBitrixMcpServer(): Server`
- Contains: Server ctor, `ListToolsRequestSchema` handler, `CallToolRequestSchema` handler, error translation to `McpError`
- `src/index.ts` shrinks to: import factory → `const server = createBitrixMcpServer()` → connect stdio transport → main() boilerplate
- Logging via `console.error` preserved (stdio-safe)

## Architecture
```
┌─────────────────────┐      ┌──────────────────────┐
│ src/index.ts        │      │ src/http-server.ts   │
│ (stdio entry)       │      │ (HTTP entry — P03)   │
└──────────┬──────────┘      └──────────┬───────────┘
           │                            │
           └──────────┬─────────────────┘
                      ▼
        ┌─────────────────────────────┐
        │ src/mcp-server-factory.ts   │
        │ createBitrixMcpServer()     │
        │  - new Server(...)          │
        │  - setRequestHandler(list)  │
        │  - setRequestHandler(call)  │
        └─────────────┬───────────────┘
                      ▼
        src/tools/index.ts (allTools, executeToolCall)
```

## Related Code Files
**Create**
- `src/mcp-server-factory.ts`

**Modify**
- `src/index.ts` — strip handler wiring, import factory

**Untouched**
- `src/tools/index.ts`, `src/bitrix24/client.ts`

## Implementation Steps
1. Create `src/mcp-server-factory.ts`:
   - Imports: `Server`, `ListToolsRequestSchema`, `CallToolRequestSchema`, `ErrorCode`, `McpError`, `allTools`, `executeToolCall`
   - Export `createBitrixMcpServer(): Server`
   - Move lines 14-59 of current `src/index.ts` into factory body
   - Server name/version/capabilities hardcoded inside factory (single source of truth)
2. Rewrite `src/index.ts`:
   - Imports: `StdioServerTransport`, `createBitrixMcpServer`
   - `main()`: `const server = createBitrixMcpServer(); const transport = new StdioServerTransport(); await server.connect(transport);`
   - Keep stderr banner logs
3. `npm run build` → expect clean.
4. Stdin smoke test again (same as phase 01) — must still return tool list.

## Todo List
- [ ] Create `src/mcp-server-factory.ts` (<80 LOC)
- [ ] Slim `src/index.ts` to stdio-only entry
- [ ] `npm run build` green
- [ ] Stdin smoke test regression
- [ ] Commit: `refactor(mcp): extract createBitrixMcpServer factory`

## Success Criteria
- Factory exported and imported cleanly
- `src/index.ts` ≤ 30 LOC
- Stdio regression still green
- Zero behavior change vs phase 01

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Circular imports | Factory imports from `tools/index.js` only; no back-ref |
| Losing stderr banner | Keep banner in stdio entry, not factory |
| Handler closure over stale state | Factory creates fresh closures per call — safe for stateless |

## Security Considerations
None new.

## Next Steps
Phase 03 — HTTP server consumes this factory.
