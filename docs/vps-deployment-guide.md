# VPS Deployment Guide

Generic guide for deploying Node.js MCP servers to VPS with PM2.

## EGANY VPS Info
- **IP:** 103.97.125.190
- **SSH:** `ssh ubuntu@103.97.125.190` (port 22)
- **Bitrix24 MCP URL:** `http://103.97.125.190:3001`

## Prerequisites

```bash
# Check Node.js (need 18+)
node -v
npm -v

# Install PM2 globally
sudo npm install -g pm2

# Install Git (if not present)
sudo apt-get install -y git
```

## Deploy Any MCP Server

### 1. Clone & Build

```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone your MCP repo
git clone https://github.com/<org>/<mcp-server>.git
cd <mcp-server>

# Install & build
npm install
npm run build
```

### 2. Create PM2 Ecosystem Config

**Important:** PM2 doesn't auto-load `.env` files. Use `ecosystem.config.cjs` instead.

```bash
nano ecosystem.config.cjs
```

**Template:**
```javascript
module.exports = {
  apps: [{
    name: '<mcp-name>',           // e.g., 'bitrix24-mcp'
    script: 'build/http-server.js', // or your entry point
    env: {
      PORT: 3001,                 // Choose available port
      MCP_API_KEY: 'your-secure-key',  // openssl rand -base64 32
      NODE_ENV: 'production',
      // Add MCP-specific env vars here
    }
  }]
};
```

**Example (Bitrix24 MCP):**
```javascript
module.exports = {
  apps: [{
    name: 'bitrix24-mcp',
    script: 'build/http-server.js',
    env: {
      BITRIX24_WEBHOOK_URL: 'https://your-domain.bitrix24.vn/rest/1/YOUR_KEY/',
      PORT: 3001,
      MCP_API_KEY: 'generate-with-openssl-rand-base64-32',
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  }]
};
```

### 3. Start with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Copy & run the sudo command it outputs
```

### 4. Verify

```bash
pm2 status
curl http://localhost:<PORT>/health
```

## Update Workflow

```bash
cd ~/apps/<mcp-server>
git pull
npm install
npm run build
pm2 restart <mcp-name>
```

## Claude Desktop / MCP Client Setup

When connecting from Claude Desktop or other MCP clients:

| Field | Value |
|-------|-------|
| Transport | Streamable HTTP |
| URL | `http://<VPS_IP>:<PORT>/mcp` |
| Header name | `Authorization` |
| Header value | `Bearer <MCP_API_KEY>` |

## PM2 Commands Reference

```bash
pm2 status                    # List all processes
pm2 logs <name>               # Stream logs
pm2 logs <name> --lines 50    # Last 50 lines
pm2 restart <name>            # Restart process
pm2 restart <name> --update-env  # Restart with new env vars
pm2 stop <name>               # Stop process
pm2 delete <name>             # Remove from PM2
pm2 monit                     # Real-time monitor
```

## Troubleshooting

### Port already in use
```bash
sudo lsof -i :<PORT> | grep LISTEN
sudo kill -9 <PID>
```

### ES Module config error
Rename `ecosystem.config.js` → `ecosystem.config.cjs` (CommonJS extension).

### Env vars not loading
PM2 doesn't read `.env` files. Put all env vars in `ecosystem.config.cjs`.

### High restart count
```bash
pm2 logs <name> --lines 50  # Check error logs
```

Common causes:
- Missing env vars
- Port conflict
- Build not run after `git pull`
