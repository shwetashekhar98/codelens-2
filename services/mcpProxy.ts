// MCP Proxy Service - connects frontend to Node.js MCP backend
const MCP_SERVER_URL = 'http://localhost:3001';

export interface MCPStatus {
    initialized: boolean;
    servers: Array<{ name: string; connected: boolean }>;
}

export interface MCPToolResponse {
    content: any[];
    isError?: boolean;
}

class MCPProxyService {
    private baseUrl: string;

    constructor(baseUrl: string = MCP_SERVER_URL) {
        this.baseUrl = baseUrl;
    }

    // Initialize MCP servers
    async initialize(): Promise<{ success: boolean; results: any[] }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/mcp/init`, {
                method: 'POST',
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to initialize MCP servers:', error);
            return { success: false, results: [] };
        }
    }

    // Get MCP status
    async getStatus(): Promise<MCPStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/api/mcp/status`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get MCP status:', error);
            return { initialized: false, servers: [] };
        }
    }

    // List tools from a specific server
    async listTools(serverName: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/mcp/${serverName}/tools`);
            const data = await response.json();
            return data.tools || [];
        } catch (error) {
            console.error(`Failed to list tools from ${serverName}:`, error);
            return [];
        }
    }

    // Call a tool on a specific server
    async callTool(
        serverName: string,
        toolName: string,
        args: Record<string, unknown>
    ): Promise<MCPToolResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/mcp/${serverName}/call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ toolName, args }),
            });
            return await response.json();
        } catch (error) {
            console.error(`Failed to call tool ${toolName} on ${serverName}:`, error);
            return { content: [], isError: true };
        }
    }

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

export const mcpProxy = new MCPProxyService();
