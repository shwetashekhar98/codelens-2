<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CodeLens AI - Interactive Repository Analysis

AI-powered repository visualization with Model Context Protocol (MCP) integration.

View your app in AI Studio: https://ai.studio/apps/drive/1fyGiiEnIs2tEhAzLlyttTfCp2jF6ixLW

## Features

✨ **Interactive Architecture Visualization** - Explore codebases with dynamic graph views  
🔍 **Semantic Search** - Find modules and concepts with natural language queries  
🤖 **AI-Powered Analysis** - Deep code explanations powered by Gemini AI  
⚡ **MCP Integration** - Enhanced with Model Context Protocol servers for better performance  
💾 **Smart Caching** - IndexedDB storage for instant access to previous analyses  

## Run Locally

**Prerequisites:**  Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## MCP Integration

This app uses Model Context Protocol (MCP) servers for enhanced functionality:
- **Filesystem Server**: Fast local file access
- **Memory Server**: Persistent search history and caching
- **GitHub Server**: Enhanced repository access

MCP servers initialize automatically. See [MCP_INTEGRATION.md](MCP_INTEGRATION.md) for details.
