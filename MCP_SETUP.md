# MCP Server Configuration

This project is configured with Model Context Protocol (MCP) servers to enable enhanced AI interactions.

## ✅ Installation Complete

The MCP integration has been fully installed and configured in this CodeLens AI project!

## Configured Servers

### 1. Filesystem Server
- **Purpose**: Provides file system access capabilities
- **Command**: `npx -y @modelcontextprotocol/server-filesystem`
- **Scope**: `/workspaces/codelens-2`
- **Integration**: Used in `geminiService.ts` for local file analysis

### 2. Memory Server
- **Purpose**: Provides persistent memory/context storage
- **Command**: `npx -y @modelcontextprotocol/server-memory`
- **Integration**: Stores search queries and analysis history

### 3. GitHub Server
- **Purpose**: Provides GitHub repository access
- **Command**: `npx -y @modelcontextprotocol/server-github`
- **Configuration**: Requires `GITHUB_PERSONAL_ACCESS_TOKEN` in environment
- **Integration**: Enhanced repository data fetching in `geminiService.ts`

## 🚀 Integration Points

### 1. Gemini Service (`services/geminiService.ts`)
- **Auto-initialization**: MCP servers initialize automatically when the service is used
- **GitHub Integration**: Attempts to use MCP GitHub server before falling back to REST API
- **Filesystem Access**: Uses MCP filesystem server for local file analysis
- **Memory Storage**: Stores search queries in MCP memory server

### 2. MCP Integration Service (`services/mcpIntegration.ts`)
- **Status Management**: Track which MCP servers are connected
- **Memory Operations**: Store/retrieve data from MCP memory
- **Filesystem Operations**: List and access local files via MCP

### 3. App Component (`App.tsx`)
- **Visual Indicator**: Shows "MCP Active" badge when servers are connected
- **Auto-initialization**: MCP servers initialize on app startup
- **Status Tracking**: Real-time display of MCP connection status

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure GitHub Token (Optional)
If you want to use the GitHub server, add your personal access token to `mcp.config.json`:
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### 3. Initialize Servers
The servers are initialized automatically when you import and call `initializeMCPServers()` from `src/mcp/mcpService.ts`.

## Usage

### Initialize All Servers
```typescript
import { initializeMCPServers } from './src/mcp/mcpService';

await initializeMCPServers();
```

### List Available Tools
```typescript
import { listServerTools } from './src/mcp/mcpService';

const tools = await listServerTools('filesystem');
console.log(tools);
```

### Call a Tool
```typescript
import { callServerTool } from './src/mcp/mcpService';

const result = await callServerTool('filesystem', 'read_file', {
  path: '/path/to/file.txt'
});
```

### List Resources
```typescript
import { listServerResources } from './src/mcp/mcpService';

const resources = await listServerResources('memory');
console.log(resources);
```

### Read a Resource
```typescript
import { readResource } from './src/mcp/mcpService';

const content = await readResource('filesystem', 'file:///path/to/file.txt');
console.log(content);
```

## Architecture

- **mcpClient.ts**: Core MCP client management and connection handling
- **mcpService.ts**: High-level service functions for interacting with MCP servers
- **mcp.config.json**: Server configuration file

## Available MCP Servers

You can add more MCP servers by:
1. Adding them to `mcp.config.json`
2. Installing the server package (if needed)
3. Calling `initializeMCPServers()` to connect

Popular MCP servers:
- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-memory` - Persistent memory
- `@modelcontextprotocol/server-github` - GitHub integration
- `@modelcontextprotocol/server-slack` - Slack integration
- `@modelcontextprotocol/server-postgres` - PostgreSQL database access

## Cleanup

To disconnect all servers:
```typescript
import { mcpManager } from './src/mcp/mcpClient';

await mcpManager.disconnectAll();
```
