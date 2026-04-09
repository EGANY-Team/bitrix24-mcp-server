# Azure MCP Server Deployment: Practical Guide for Bitrix24 Integration

> **DEPRECATED (2026-04-09):** Primary deployment moved to tose.sh.
> Canonical setup: `CLAUDE_REMOTE_SETUP.md`.
> This guide retained pending host-consolidation decision — see
> `plans/260409-1751-mcp-header-auth/plan.md` §Unresolved Questions.


This guide provides clear, actionable steps for deploying MCP (Model Context Protocol) servers on Azure, specifically focused on real-world scenarios like your Bitrix24 CRM integration.

## Table of Contents
1. [Understanding MCP Servers](#understanding-mcp-servers)
2. [Why Azure for MCP Deployment](#why-azure-for-mcp-deployment)
3. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
4. [Authentication & Environment Configuration](#authentication--environment-configuration)
5. [Claude Desktop Configuration](#claude-desktop-configuration)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Production Best Practices](#production-best-practices)

## Understanding MCP Servers

### What MCP Servers Do
MCP servers act as **bridges between Claude Desktop and external services**. Instead of Claude directly accessing your CRM, database, or API, it communicates through standardized MCP servers that:

- **Expose Tools**: Functions Claude can call (e.g., "get latest leads", "create contact")
- **Provide Resources**: Data sources Claude can read (e.g., customer database, file systems)
- **Offer Prompts**: Templates for common tasks

### Real-World Example: Bitrix24 MCP Server
Your Bitrix24 MCP server:
```
Claude Desktop ↔ MCP Server (Azure) ↔ Bitrix24 CRM
```

**Tools it provides:**
- `bitrix24_get_latest_leads` - Retrieve recent leads
- `bitrix24_create_contact` - Add new contacts
- `bitrix24_validate_webhook` - Test connection

**How it works:**
1. Claude Desktop sends JSON-RPC request to MCP server
2. MCP server translates request to Bitrix24 API call
3. Bitrix24 responds with data
4. MCP server formats response for Claude

## Why Azure for MCP Deployment

### Cost-Effective Options
| Service | Best For | Monthly Cost | Pros | Cons |
|---------|----------|--------------|------|------|
| **Azure App Service** | Simple HTTP servers | $13-50 | Easy setup, built-in SSL | Limited to HTTP only |
| **Container Apps** | Modern applications | $0-30 | Scale-to-zero, containers | More complex setup |
| **Azure Functions** | Event-driven | $0-20 | Serverless, auto-scale | Cold start delays |

### Why We Chose App Service for Bitrix24
- **Simple HTTP-based MCP server** ✅
- **Built-in environment variable management** ✅
- **Integrated with GitHub Actions** ✅
- **Reliable uptime** ✅
- **Cost-effective for always-on services** ✅

## Step-by-Step Deployment Process

### Phase 1: Prepare Your MCP Server

#### 1.1 Project Structure
```
bitrix24-mcp-server/
├── src/                    # TypeScript source
│   ├── index.ts           # Main MCP server
│   ├── bitrix24/client.ts # Bitrix24 API client
│   └── tools/index.ts     # MCP tools definition
├── build/                 # Compiled JavaScript
├── server.js             # HTTP wrapper for Azure
├── package.json          # Dependencies
├── web.config           # IIS configuration
└── .env                 # Environment variables
```

#### 1.2 Essential Files

**server.js** (HTTP wrapper):
```javascript
import { createServer } from 'http';
import { spawn } from 'child_process';

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/mcp') {
    // Handle MCP requests
    const mcpProcess = spawn('node', ['build/index.js']);
    // Forward JSON-RPC messages
  }
});
```

**web.config** (Azure App Service configuration):
```xml
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
  </system.webServer>
</configuration>
```

### Phase 2: Azure Deployment

#### 2.1 Create Azure Resources

**Option A: Azure Portal (Beginner-Friendly)**
1. Go to [Azure Portal](https://portal.azure.com)
2. Create Resource → Web App
3. Configure:
   - **Name**: `bitrix24-mcp-server`
   - **Runtime**: Node.js 18
   - **Region**: East US (or closest to you)
   - **Pricing**: Basic B1 ($13/month)

**Option B: Azure CLI (Advanced)**
```bash
# Create resource group
az group create --name mcp-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name mcp-plan \
  --resource-group mcp-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group mcp-rg \
  --plan mcp-plan \
  --name bitrix24-mcp-server \
  --runtime "NODE|18-lts"
```

#### 2.2 Deploy Code

**Method 1: GitHub Actions (Recommended)**
```yaml
# .github/workflows/azure-deploy.yml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install and build
      run: |
        npm ci
        npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'bitrix24-mcp-server'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

**Method 2: Direct Upload**
1. Build your project: `npm run build`
2. Zip the files: `package.json`, `server.js`, `web.config`, `build/`
3. Upload via Azure Portal → Deployment Center

## Authentication & Environment Configuration

### The Critical Step: Environment Variables

**Problem**: Your MCP server needs to authenticate with Bitrix24, but Azure doesn't have your credentials.

**Solution**: Configure environment variables in Azure App Service.

#### Step 1: Get Your Bitrix24 Webhook URL
1. Log into Bitrix24: `https://your-domain.bitrix24.com`
2. Go to **Applications** → **Webhooks**
3. Create or find your webhook
4. Copy the URL: `https://your-domain.bitrix24.com/rest/USER_ID/WEBHOOK_CODE/`

#### Step 2: Configure Azure Environment Variables

**Via Azure Portal:**
1. Go to your App Service in Azure Portal
2. **Settings** → **Configuration**
3. **Application settings** → **+ New application setting**
4. Add these settings:

| Name | Value | Example |
|------|-------|---------|
| `BITRIX24_WEBHOOK_URL` | Your webhook URL | `https://sviluppofranchising.bitrix24.it/rest/27/wwugdez6m774803q/` |
| `NODE_ENV` | `production` | `production` |
| `LOG_LEVEL` | `info` | `info` |

5. Click **Save** and **Continue**
6. **Restart** your App Service

**Via Azure CLI:**
```bash
az webapp config appsettings set \
  --resource-group mcp-rg \
  --name bitrix24-mcp-server \
  --settings \
    BITRIX24_WEBHOOK_URL="https://your-domain.bitrix24.com/rest/USER_ID/WEBHOOK_CODE/" \
    NODE_ENV="production" \
    LOG_LEVEL="info"
```

#### Step 3: Verify Configuration
Test your deployment:
```bash
# Health check
curl https://bitrix24-mcp-server.azurewebsites.net/health

# MCP webhook validation
curl -X POST https://bitrix24-mcp-server.azurewebsites.net/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "bitrix24_validate_webhook",
      "arguments": {}
    },
    "id": 1
  }'
```

## Claude Desktop Configuration

### Local Proxy Setup (Recommended)

Since Claude Desktop works best with local processes, create a proxy that forwards to your Azure server:

#### 1. Create MCP Proxy (`mcp-proxy.cjs`)
```javascript
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const message = JSON.parse(line);
  
  // Forward to Azure server
  const options = {
    hostname: 'bitrix24-mcp-server.azurewebsites.net',
    port: 443,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(message))
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
  });

  req.write(JSON.stringify(message));
  req.end();
});
```

#### 2. Configure Claude Desktop
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bitrix24-remote": {
      "command": "node",
      "args": ["C:/path/to/your/mcp-proxy.cjs"],
      "env": {}
    }
  }
}
```

#### 3. Restart Claude Desktop
Close and reopen Claude Desktop to load the new configuration.

### Direct HTTP Configuration (Alternative)

For newer Claude Desktop versions that support HTTP:
```json
{
  "mcpServers": {
    "bitrix24-azure": {
      "type": "http",
      "url": "https://bitrix24-mcp-server.azurewebsites.net/mcp",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

## Troubleshooting Common Issues

### Issue 1: HTTP 401 Unauthorized

**Symptoms:**
```json
{
  "success": false,
  "error": "HTTP 401: Unauthorized"
}
```

**Causes & Solutions:**
1. **Missing environment variables in Azure**
   - Check Azure Portal → App Service → Configuration
   - Ensure `BITRIX24_WEBHOOK_URL` is set correctly

2. **Invalid Bitrix24 webhook**
   - Test webhook directly: `curl https://your-webhook-url/app.info`
   - If it returns `INVALID_CREDENTIALS`, regenerate the webhook in Bitrix24

3. **Webhook permissions insufficient**
   - In Bitrix24, check webhook permissions include CRM access

### Issue 2: Connection Timeout

**Symptoms:**
- Claude Desktop shows "Server not responding"
- Long delays before errors

**Solutions:**
1. **Check Azure server status**
   ```bash
   curl https://bitrix24-mcp-server.azurewebsites.net/health
   ```

2. **Verify proxy configuration**
   - Test proxy locally: `echo '{"test": true}' | node mcp-proxy.cjs`

3. **Check firewall/network**
   - Ensure port 443 is accessible
   - Test from different network if possible

### Issue 3: MCP Protocol Errors

**Symptoms:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32700,
    "message": "Parse error"
  }
}
```

**Solutions:**
1. **Verify JSON-RPC format**
   - Ensure all messages include `jsonrpc: "2.0"`
   - Include proper `id` field

2. **Check MCP server logs**
   ```bash
   az webapp log tail --resource-group mcp-rg --name bitrix24-mcp-server
   ```

### Issue 4: Build/Deployment Failures

**Common Problems:**
- TypeScript compilation errors
- Missing dependencies
- Node.js version mismatch

**Solutions:**
1. **Local testing first**
   ```bash
   npm run build
   node build/index.js
   ```

2. **Check package.json**
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     },
     "scripts": {
       "build": "tsc",
       "start": "node server.js"
     }
   }
   ```

## Production Best Practices

### 1. Monitoring & Logging

**Application Insights Integration:**
```javascript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
appInsights.start();

// Custom logging
const logger = appInsights.defaultClient;
logger.trackEvent({name: "MCP_Request", properties: {tool: toolName}});
```

**Health Checks:**
```javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    bitrix24: 'checking...'
  };
  
  // Test Bitrix24 connection
  bitrix24Client.validateWebhook()
    .then(valid => {
      health.bitrix24 = valid ? 'connected' : 'disconnected';
      res.json(health);
    })
    .catch(err => {
      health.status = 'unhealthy';
      health.bitrix24 = err.message;
      res.status(503).json(health);
    });
});
```

### 2. Security Hardening

**Environment Variable Security:**
- Never commit `.env` files to Git
- Use Azure Key Vault for sensitive data
- Rotate webhook URLs regularly

**Network Security:**
```json
{
  "ipSecurityRestrictions": [
    {
      "ipAddress": "0.0.0.0/0",
      "action": "Allow",
      "priority": 100,
      "name": "Allow all"
    }
  ]
}
```

### 3. Performance Optimization

**Caching Strategy:**
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedLeads(limit) {
  const key = `leads_${limit}`;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const leads = await bitrix24Client.getLatestLeads(limit);
  cache.set(key, { data: leads, timestamp: Date.now() });
  return leads;
}
```

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/mcp', limiter);
```

### 4. Cost Optimization

**Auto-scaling Configuration:**
- Use Azure App Service auto-scaling rules
- Scale based on CPU usage and request count
- Set minimum instances to 1 for production

**Resource Monitoring:**
```bash
# Monitor costs
az consumption usage list --top 10

# Set budget alerts
az consumption budget create \
  --budget-name "MCP-Server-Budget" \
  --amount 50 \
  --time-grain Monthly
```

## Conclusion

Deploying MCP servers on Azure provides a robust, scalable solution for integrating Claude Desktop with external services like Bitrix24. The key success factors are:

1. **Proper environment variable configuration** - Most authentication issues stem from missing or incorrect environment variables
2. **Reliable proxy setup** - Ensures smooth communication between Claude Desktop and Azure
3. **Comprehensive monitoring** - Enables proactive issue detection and resolution
4. **Security best practices** - Protects sensitive data and prevents unauthorized access

With this guide, you should be able to successfully deploy and maintain production-ready MCP servers on Azure, enabling powerful AI integrations for your business workflows.

### Quick Reference Commands

```bash
# Test webhook directly
curl https://your-webhook-url/app.info

# Check Azure app health
curl https://your-app.azurewebsites.net/health

# View Azure logs
az webapp log tail --resource-group mcp-rg --name your-app

# Update environment variables
az webapp config appsettings set --resource-group mcp-rg --name your-app --settings KEY=VALUE

# Restart app service
az webapp restart --resource-group mcp-rg --name your-app
