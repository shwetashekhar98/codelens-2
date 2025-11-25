# MCP Integration Setup Guide

## What is MCP?

Model Context Protocol (MCP) provides your app with enhanced capabilities through specialized servers:
- **GitHub Server**: Enhanced GitHub repository access
- **Filesystem Server**: Local file system access  
- **Memory Server**: Persistent memory/storage for queries

## Prerequisites

1. **Valid Gemini API Key** (required for analysis)
   - Get it from: https://aistudio.google.com/apikey
   - Should look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

2. **GitHub Personal Access Token** (optional, for MCP GitHub server)
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `read:org`
   - Copy the token

## Setup Instructions

### Step 1: Configure Environment Variables

Update your `.env` file:

```bash
# Required: Get from https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 2: Configure MCP Servers (Optional)

Edit `mcp.config.json` to add your GitHub token:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Step 3: Run the Application

#### Option A: Frontend Only (no MCP)
```bash
npm run dev
```
Then open: http://localhost:3000

#### Option B: With MCP Servers (full features)
```bash
npm run dev:all
```

This starts:
- Frontend (Vite) on port 3000
- MCP Backend on port 3001

## How It Works

### Architecture

```
┌─────────────────┐
│   Browser       │
│  (React App)    │ ← http://localhost:3000
└────────┬────────┘
         │
         ├─→ Gemini API (direct)
         │
         └─→ MCP Backend Server (http://localhost:3001)
             │
             ├─→ GitHub MCP Server
             ├─→ Filesystem MCP Server
             └─→ Memory MCP Server
```

### MCP Backend API Endpoints

- `GET /health` - Health check
- `POST /api/mcp/init` - Initialize MCP servers
- `GET /api/mcp/status` - Get MCP status
- `GET /api/mcp/:server/tools` - List tools from a server
- `POST /api/mcp/:server/call` - Call a tool

## Testing MCP Integration

1. **Start both servers**:
   ```bash
   npm run dev:all
   ```

2. **Check MCP status** in browser console:
   - Open http://localhost:3000
   - Open Developer Tools (F12)
   - Look for: `✓ MCP servers ready: github, filesystem, memory`

3. **Analyze a repository**:
   - Enter a GitHub repo (e.g., `facebook/react`)
   - Click "Analyze"
   - Watch console for MCP messages

## Troubleshooting

### Issue: "MCP initialization failed"

**Solution**: Make sure the MCP backend is running on port 3001
```bash
# In a separate terminal:
npm run dev:mcp
```

### Issue: "GitHub server not available"

**Solution**: Add your GitHub token to `mcp.config.json`

### Issue: "Gemini API key not configured"

**Solution**: Get a valid API key from https://aistudio.google.com/apikey and add it to `.env`

### Issue: Port 3001 already in use

**Solution**: Kill the process or change the port in `server/mcpServer.js`:
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change the port
export MCP_SERVER_PORT=3002
```

## Features Enabled by MCP

### Without MCP:
- ✅ Basic repository analysis
- ✅ GitHub public API access
- ✅ Browser-based visualization

### With MCP:
- ✅ Enhanced GitHub access (private repos, better rate limits)
- ✅ Local filesystem access (for local projects)
- ✅ Persistent search history
- ✅ Advanced debugging capabilities

## Next Steps

1. **Get your Gemini API key** and update `.env`
2. **Optionally**: Add GitHub token for enhanced access
3. **Run**: `npm run dev:all` to start with MCP
4. **Test**: Analyze a repository and check the console

Need help? Check the console for error messages and follow the troubleshooting guide above.
