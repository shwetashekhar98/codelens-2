import { mcpManager } from './mcpClient';
import mcpConfig from '../../mcp.config.json';

export async function initializeMCPServers() {
  const servers = Object.entries(mcpConfig.mcpServers);
  
  const connections = servers.map(async ([name, config]) => {
    try {
      await mcpManager.connectToServer(name, config);
      console.log(`✓ Connected to MCP server: ${name}`);
      return { name, success: true };
    } catch (error) {
      console.error(`✗ Failed to connect to MCP server ${name}:`, error);
      return { name, success: false, error };
    }
  });

  const results = await Promise.allSettled(connections);
  return results;
}

export async function listServerTools(serverName: string) {
  const client = mcpManager.getClient(serverName);
  if (!client) {
    throw new Error(`Server ${serverName} not connected`);
  }

  const response = await client.listTools();
  return response.tools;
}

export async function callServerTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>
) {
  const client = mcpManager.getClient(serverName);
  if (!client) {
    throw new Error(`Server ${serverName} not connected`);
  }

  const response = await client.callTool({ name: toolName, arguments: args });
  return response;
}

export async function listServerResources(serverName: string) {
  const client = mcpManager.getClient(serverName);
  if (!client) {
    throw new Error(`Server ${serverName} not connected`);
  }

  const response = await client.listResources();
  return response.resources;
}

export async function readResource(serverName: string, uri: string) {
  const client = mcpManager.getClient(serverName);
  if (!client) {
    throw new Error(`Server ${serverName} not connected`);
  }

  const response = await client.readResource({ uri });
  return response;
}
