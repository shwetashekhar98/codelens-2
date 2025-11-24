# MCP Integration - Quick Reference

## What's Been Integrated

The MCP (Model Context Protocol) servers are now fully integrated into CodeLens AI. The system will automatically:

1. **Initialize MCP servers** when the app starts
2. **Show connection status** with a green "MCP Active" badge
3. **Use MCP capabilities** during repository analysis

## Features Enhanced by MCP

### 🔍 Repository Analysis
- **GitHub Server**: Enhanced repository data fetching with better rate limits
- **Filesystem Server**: Direct access to local files for analysis
- **Memory Server**: Stores search queries and analysis history

### 📝 Deep Analysis
When you click "Explain", "Flow", or "Review" on any module:
- First attempts to read files via MCP filesystem server (faster, local access)
- Falls back to GitHub API if MCP is unavailable
- Stores analysis results for faster subsequent requests

### 🔎 Semantic Search
- Every search query is automatically stored in MCP memory
- Enables search history and pattern analysis
- Helps improve future search suggestions

## Visual Indicators

### Main Screen
Look for the **"MCP Active"** badge in the top-right corner when MCP servers are connected.

### Analysis View
The badge appears next to the "Synced" indicator, showing real-time MCP status.

## How It Works Behind the Scenes

### Auto-Initialization
```typescript
// Happens automatically on app load
initMCP() -> connects to 3 servers:
  ✓ filesystem (local file access)
  ✓ memory (persistent storage)
  ✓ github (enhanced repo access)
```

### Graceful Fallback
If any MCP server is unavailable:
- App continues working normally
- Falls back to standard APIs
- No disruption to user experience

### Performance Benefits
- **Faster file access**: Direct filesystem reads vs HTTP requests
- **Better caching**: Memory server stores frequently accessed data
- **Improved rate limits**: GitHub server provides authenticated access

## Configuration

### Default Setup (No Action Needed)
The system is pre-configured with sensible defaults:
- Filesystem scope: `/workspaces/codelens-2`
- Memory: Local persistent storage
- GitHub: Public repo access (add token for private repos)

### Optional: GitHub Token
To access private repositories, add your GitHub token to `mcp.config.json`:

```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

## Troubleshooting

### MCP Badge Not Showing?
- Check browser console for initialization errors
- Verify all dependencies are installed: `npm install`
- MCP servers run on-demand (first use may take a moment)

### Analysis Still Works Without MCP?
- Yes! MCP is an enhancement, not a requirement
- All features gracefully fall back to standard APIs
- You won't lose functionality if MCP is unavailable

## Developer Notes

### Integration Points
1. **`services/geminiService.ts`**: Main analysis logic with MCP integration
2. **`services/mcpIntegration.ts`**: MCP utility functions and status management
3. **`App.tsx`**: UI components and MCP initialization
4. **`src/mcp/mcpClient.ts`**: Core MCP client management
5. **`src/mcp/mcpService.ts`**: MCP server communication layer

### Adding New MCP Features
To add more MCP functionality:
1. Import from `services/mcpIntegration.ts`
2. Call MCP functions (e.g., `storeMCPMemory()`, `listLocalFiles()`)
3. Handle errors gracefully with try-catch
4. Always provide fallback behavior

## Next Steps

Want to extend MCP integration? Consider:
- **Slack notifications**: Add `@modelcontextprotocol/server-slack` for alerts
- **Database access**: Add `@modelcontextprotocol/server-postgres` for direct DB queries
- **Custom tools**: Create your own MCP server for domain-specific features

Check `MCP_SETUP.md` for detailed API documentation and examples.
