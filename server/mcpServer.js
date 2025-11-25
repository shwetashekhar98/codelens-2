import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Store active MCP clients
const mcpClients = new Map();

// Load MCP configuration
const configPath = path.join(__dirname, '../mcp.config.json');
const mcpConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize MCP servers
async function initializeMCPServers() {
    const results = [];

    for (const [name, config] of Object.entries(mcpConfig.mcpServers)) {
        try {
            const client = new Client({
                name: `codelens-${name}`,
                version: '1.0.0',
            }, {
                capabilities: {}
            });

            const transport = new StdioClientTransport({
                command: config.command,
                args: config.args,
                env: { ...process.env, ...config.env }
            });

            await client.connect(transport);
            mcpClients.set(name, client);

            console.log(`✓ Connected to MCP server: ${name}`);
            results.push({ name, success: true });
        } catch (error) {
            console.error(`✗ Failed to connect to MCP server ${name}:`, error.message);
            results.push({ name, success: false, error: error.message });
        }
    }

    return results;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mcpServers: Array.from(mcpClients.keys()) });
});

// Initialize MCP servers
app.post('/api/mcp/init', async (req, res) => {
    try {
        const results = await initializeMCPServers();
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// List tools from a server
app.get('/api/mcp/:serverName/tools', async (req, res) => {
    try {
        const { serverName } = req.params;
        const client = mcpClients.get(serverName);

        if (!client) {
            return res.status(404).json({ error: `Server ${serverName} not connected` });
        }

        const response = await client.listTools();
        res.json({ tools: response.tools });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Call a tool
app.post('/api/mcp/:serverName/call', async (req, res) => {
    try {
        const { serverName } = req.params;
        const { toolName, args } = req.body;

        const client = mcpClients.get(serverName);

        if (!client) {
            return res.status(404).json({ error: `Server ${serverName} not connected` });
        }

        const response = await client.callTool({
            name: toolName,
            arguments: args
        });

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get MCP status
app.get('/api/mcp/status', (req, res) => {
    const status = {
        initialized: mcpClients.size > 0,
        servers: Array.from(mcpClients.entries()).map(([name, client]) => ({
            name,
            connected: true
        }))
    };
    res.json(status);
});

const PORT = process.env.MCP_SERVER_PORT || 3001;

app.listen(PORT, async () => {
    console.log(`🚀 MCP Server running on http://localhost:${PORT}`);
    console.log('📡 Initializing MCP servers...');
    await initializeMCPServers();
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MCP servers...');
    mcpClients.forEach(client => {
        try {
            client.close();
        } catch (error) {
            console.error('Error closing client:', error);
        }
    });
    process.exit(0);
});
