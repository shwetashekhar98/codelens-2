#!/bin/bash

echo "🚀 CodeLens AI - Starting with MCP Integration"
echo ""
echo "Starting services..."
echo "  - Frontend: http://localhost:3000"
echo "  - MCP Backend: http://localhost:3001"
echo ""

# Start both services concurrently
npm run dev:all
