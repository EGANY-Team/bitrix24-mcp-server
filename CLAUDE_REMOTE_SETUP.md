# Remote MCP Server Setup (Streamable HTTP + Bearer Auth)

The Bitrix24 MCP Server exposes a Streamable HTTP transport at `/mcp`, protected by a bearer token. The canonical deployment is at:

```
https://egany-bitrix24-mcp.tose.sh/mcp
```

## 1. Generate / Obtain API Key

On the server (tose.sh) the env var `MCP_API_KEY` must be set. Generate with:

```bash
openssl rand -base64 32
```

Set this value in the tose.sh dashboard with the SECRET flag. **Never commit the key** and never paste it into docs or screenshots.

## 2. Server Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/health` | GET | public | Liveness + build info |
| `/mcp`    | POST | `Authorization: Bearer <key>` (or `x-api-key: <key>`) | MCP Streamable HTTP (stateless) |

Unauthenticated POST → `401 {"error":"unauthorized"}`.

## 3. GoClaw Configuration

| Field | Value |
|---|---|
| Transport | Streamable HTTP |
| URL | `https://egany-bitrix24-mcp.tose.sh/mcp` |
| Header | `Authorization` = `Bearer <YOUR_MCP_API_KEY>` |
| Tool Prefix | `bitrix24_` |
| Timeout | default (no special tuning needed) |

Click **Test Connection** → should turn green within a few seconds.

## 4. Manual Smoke Test (curl)

```bash
export MCP_API_KEY=<paste_key>

# Health (public)
curl -s https://egany-bitrix24-mcp.tose.sh/health

# Unauth — expect 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://egany-bitrix24-mcp.tose.sh/mcp \
  -H 'Content-Type: application/json' -d '{}'

# Authed initialize
curl -s -X POST https://egany-bitrix24-mcp.tose.sh/mcp \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

## 5. Local Dev — Stdio (Claude Desktop)

The HTTP transport is for remote clients. Claude Desktop still uses the stdio entry locally:

```json
{
  "mcpServers": {
    "bitrix24": {
      "command": "node",
      "args": ["/path/to/bitrix24-mcp-server/build/index.js"],
      "env": {
        "BITRIX24_WEBHOOK_URL": "https://your-domain.bitrix24.com/rest/USER_ID/WEBHOOK_CODE/"
      }
    }
  }
}
```

Local HTTP server for development:

```bash
export MCP_API_KEY=$(openssl rand -base64 32)
export BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.com/rest/USER_ID/WEBHOOK_CODE/
npm run build
npm run start:http
# listens on :3000
```

## 6. Key Rotation

1. Generate new key: `openssl rand -base64 32`
2. Update `MCP_API_KEY` env var on tose.sh → redeploy
3. Update GoClaw `Authorization` header with new value
4. Verify via `/health` + GoClaw Test Connection
5. Revoke old key (it is no longer accepted after step 2)

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `401 unauthorized` on authed request | Key mismatch — whitespace/newline in paste, wrong env, stale deploy |
| GoClaw times out | Transport set to SSE instead of Streamable HTTP; URL wrong |
| `/health` 503 | Deploy still starting or crash-looping (check tose.sh logs) |
| Bitrix tool returns permission error | Webhook scope issue — unrelated to transport/auth |
