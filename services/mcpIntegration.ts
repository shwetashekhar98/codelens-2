import { initializeMCPServers, listServerTools, callServerTool, listServerResources, readResource } from '../src/mcp/mcpService';
import { mcpManager } from '../src/mcp/mcpClient';

export interface MCPStatus {
  initialized: boolean;
  servers: {
    name: string;
    connected: boolean;
    tools?: string[];
  }[];
}

let mcpStatus: MCPStatus = {
  initialized: false,
  servers: []
};

export async function getMCPStatus(): Promise<MCPStatus> {
  return mcpStatus;
}

export async function initMCP(): Promise<MCPStatus> {
  try {
    const results = await initializeMCPServers();
    
    const servers = await Promise.all(
      ['filesystem', 'memory', 'github'].map(async (name) => {
        try {
          const tools = await listServerTools(name);
          return {
            name,
            connected: true,
            tools: tools.map((t: any) => t.name)
          };
        } catch (error) {
          return {
            name,
            connected: false
          };
        }
      })
    );

    mcpStatus = {
      initialized: true,
      servers
    };

    console.log('✓ MCP Integration Status:', mcpStatus);
    return mcpStatus;
  } catch (error) {
    console.error('MCP initialization error:', error);
    mcpStatus = {
      initialized: false,
      servers: []
    };
    return mcpStatus;
  }
}

export async function getMCPMemoryHistory(): Promise<any[]> {
  try {
    const resources = await listServerResources('memory');
    return resources || [];
  } catch (error) {
    console.warn('Could not fetch MCP memory history:', error);
    return [];
  }
}

export async function storeMCPMemory(key: string, value: any): Promise<boolean> {
  try {
    await callServerTool('memory', 'store', {
      key,
      value: JSON.stringify(value)
    });
    return true;
  } catch (error) {
    console.warn('Could not store in MCP memory:', error);
    return false;
  }
}

export async function readMCPMemory(key: string): Promise<any | null> {
  try {
    const result: any = await callServerTool('memory', 'retrieve', { key });
    if (!result) return null;
    
    // Handle MCP response format
    const content = result.content || result;
    const textContent = Array.isArray(content) ? content.find((c: any) => c.type === 'text')?.text : content;
    
    return textContent ? JSON.parse(textContent) : null;
  } catch (error) {
    console.warn('Could not read from MCP memory:', error);
    return null;
  }
}

export async function listLocalFiles(directory: string): Promise<string[]> {
  try {
    const result: any = await callServerTool('filesystem', 'list_directory', {
      path: directory
    });
    
    // Handle MCP response format
    if (!result) return [];
    const content = result.content || result;
    
    if (Array.isArray(content)) {
      const textContent = content.find((c: any) => c.type === 'text')?.text;
      return textContent ? JSON.parse(textContent) : [];
    }
    
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.warn('Could not list files via MCP:', error);
    return [];
  }
}

export async function disconnectMCP(): Promise<void> {
  await mcpManager.disconnectAll();
  mcpStatus.initialized = false;
}
