import { GoogleGenAI, Type } from "@google/genai";
import { RepoAnalysis, ComplexityLevel, AnalysisMode } from "../types";
import { dbService } from "./dbService";
import { mcpProxy } from "./mcpProxy";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Initialize MCP servers via backend proxy
let mcpInitialized = false;
const initMCP = async () => {
  if (!mcpInitialized) {
    try {
      const isHealthy = await mcpProxy.healthCheck();
      if (isHealthy) {
        const status = await mcpProxy.getStatus();
        mcpInitialized = status.initialized;
        if (mcpInitialized) {
          console.log('✓ MCP servers ready:', status.servers.filter(s => s.connected).map(s => s.name).join(', '));
        }
      }
    } catch (error) {
      console.warn('MCP initialization failed:', error);
      mcpInitialized = false;
    }
  }
  return mcpInitialized;
};

// Helper to fetch real data from GitHub using MCP GitHub server if available
async function fetchGithubData(repoName: string) {
  // Try to use MCP GitHub server first
  await initMCP();

  try {
    const [owner, repo] = repoName.split('/');
    if (!owner || !repo) throw new Error("Invalid repo name");

    // Try MCP GitHub server for enhanced access
    const mcpReady = await initMCP();
    if (mcpReady) {
      try {
        const repoData = await mcpProxy.callTool('github', 'get_repository', {
          owner,
          repo
        });
        if (!repoData.isError) {
          console.log('✓ Using MCP GitHub server for repository access');
        }
      } catch (mcpError) {
        console.log('MCP GitHub server not available, falling back to REST API');
      }
    }

    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoInfoRes.ok) throw new Error("Repo not found");
    const repoInfo = await repoInfoRes.json();
    const defaultBranch = repoInfo.default_branch || 'main';

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    const treeData = await treeRes.json();

    const fileList = treeData.tree ? treeData.tree
      .filter((f: any) => f.type === 'blob')
      .map((f: any) => f.path)
      .filter((p: string) =>
        !p.includes('node_modules') &&
        !p.includes('test') &&
        !p.startsWith('.') &&
        (
          p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx') ||
          p.endsWith('.py') || p.endsWith('.go') || p.endsWith('.rs') || p.endsWith('.java') ||
          p.endsWith('.c') || p.endsWith('.cpp') || p.endsWith('.h') ||
          p.endsWith('.css') || p.endsWith('.html') ||
          p.endsWith('.json') || p.endsWith('.csv') || p.endsWith('.xml') || p.endsWith('.yaml') ||
          p.endsWith('.yml') || p.endsWith('.md') || p.endsWith('.txt') || p.endsWith('.pdf') ||
          p.endsWith('.sql')
        )
      )
      : [];

    const relevantFiles = fileList.slice(0, 5000).join('\n');
    const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`);
    const readmeText = readmeRes.ok ? await readmeRes.text() : "";

    return {
      exists: true,
      defaultBranch,
      files: relevantFiles,
      filePaths: fileList as string[],
      readme: readmeText.slice(0, 8000)
    };
  } catch (error) {
    console.warn("GitHub Fetch Failed:", error);
    return { exists: false, defaultBranch: 'main', files: '', filePaths: [] as string[], readme: '' };
  }
}

export const analyzeRepository = async (repoInput: string): Promise<RepoAnalysis> => {
  const cleanInput = repoInput.replace('https://github.com/', '').replace('.git', '');
  const parts = cleanInput.split('/').filter(p => p.trim().length > 0);
  const repoName = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : repoInput;

  const cachedData = await dbService.getAnalysis(repoName);
  if (cachedData) {
    return cachedData;
  }

  const githubData = await fetchGithubData(repoName);

  const systemInstruction = `
    You are a Senior Technical Educator. Analyzing "${repoName}".
    
    DATA:
    README: ${githubData.readme.slice(0, 500)}...
    FILES: ${githubData.files.slice(0, 25000)} 

    GOAL: Create an educational architectural graph.
    
    INSTRUCTIONS:
    1. **Identify Nodes**: Group files into logical modules.
    2. **Concepts**: Identify 1-3 key programming concepts per module (e.g., "Recursion", "REST API", "State Management").
    3. **Score**: 1-10 complexity.
    
    Output strictly in JSON.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      repoName: { type: Type.STRING },
      overallSummary: { type: Type.STRING },
      architectureType: { type: Type.STRING },
      nodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            fullPath: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["file", "component", "service", "utility", "config", "folder"] },
            complexityScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            concepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 1-3 educational concepts found here."
            },
            linesOfCode: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            files: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "label", "type", "complexityScore", "linesOfCode", "summary", "reasoning", "files", "fullPath", "concepts"]
        }
      },
      edges: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            source: { type: Type.STRING },
            target: { type: Type.STRING },
          },
          required: ["id", "source", "target"]
        }
      }
    },
    required: ["repoName", "nodes", "edges", "overallSummary", "architectureType"]
  };

  if (!ai) {
    throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze architecture for ${repoName}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        temperature: 0.1,
      },
    });

    const rawData = JSON.parse(response.text || "{}");
    const branch = githubData.defaultBranch;

    const formattedNodes = rawData.nodes.map((n: any) => {
      const isFolder = n.type === 'folder' || !n.label.includes('.');
      const safePath = n.fullPath || n.label;
      const url = isFolder
        ? `https://github.com/${repoName}/tree/${branch}/${encodeURIComponent(safePath)}`
        : `https://github.com/${repoName}/blob/${branch}/${encodeURIComponent(safePath)}`;

      return {
        id: n.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          fullPath: safePath,
          complexityScore: n.complexityScore,
          complexityLevel: n.complexityScore >= 8 ? ComplexityLevel.INTENSE : n.complexityScore >= 6 ? ComplexityLevel.HIGH : n.complexityScore >= 4 ? ComplexityLevel.MODERATE : ComplexityLevel.LOW,
          reasoning: n.reasoning,
          linesOfCode: n.linesOfCode,
          summary: n.summary,
          type: isFolder ? 'folder' : n.type,
          files: n.files || [],
          url: url,
          expanded: false,
          concepts: n.concepts || [],
          analysisCache: {},
          dimmed: false,
          onAnalyze: () => { }
        }
      };
    });

    const formattedEdges = rawData.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#475569' }
    }));

    formattedNodes.forEach((node: any, i: number) => {
      const cols = 4;
      const col = i % cols;
      const row = Math.floor(i / cols);
      node.position = { x: col * 400 + 50, y: row * 300 + 50 };
    });

    const analysisResult: RepoAnalysis = {
      repoName: rawData.repoName || repoName,
      overallSummary: rawData.overallSummary,
      architectureType: rawData.architectureType,
      nodes: formattedNodes,
      edges: formattedEdges,
      overallComplexity: formattedNodes.reduce((acc: number, n: any) => acc + n.data.complexityScore, 0) / (formattedNodes.length || 1),
      fileMap: githubData.filePaths,
      defaultBranch: branch
    };

    await dbService.saveAnalysis(analysisResult);
    return analysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw new Error("Failed to analyze repository");
  }
};

export const generateDeepAnalysis = async (
  repoName: string,
  branch: string,
  path: string,
  type: string,
  mode: AnalysisMode
): Promise<string> => {
  await initMCP();
  let context = `Repository: ${repoName}\nModule: ${path}\nType: ${type}`;

  // Try to use MCP filesystem server if analyzing local files
  if (mcpInitialized && type !== 'folder') {
    try {
      const localPath = `/workspaces/codelens-2/${path}`;
      const fileContent = await mcpProxy.callTool('filesystem', 'read_file', {
        path: localPath
      });
      if (fileContent && !fileContent.isError) {
        console.log('✓ Using MCP filesystem server for file access');
        context += `\n\nCode (via MCP):\n${JSON.stringify(fileContent.content).slice(0, 10000)}`;
      }
    } catch (mcpError) {
      console.log('MCP filesystem not available for this file, using GitHub API');
    }
  }

  // Attempt to fetch code from GitHub, but handle failure gracefully
  if (type !== 'folder' && !context.includes('Code (via MCP)')) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${repoName}/${branch}/${path}`;
      const res = await fetch(rawUrl);
      if (res.ok) {
        const text = await res.text();
        context += `\n\nCode Snippet (First 200 lines):\n${text.split('\n').slice(0, 200).join('\n')}`;
      } else {
        context += `\n\n[Code snippet unavailable (Status: ${res.status})]`;
      }
    } catch (e) {
      console.warn("Could not fetch file content", e);
      context += `\n\n[Code snippet unavailable due to network/CORS error]`;
    }
  }

  const systemInstruction = `
      You are a Friendly Technical Mentor. 
      Tone: Engaging, clear, and encouraging.
      
      CRITICAL INSTRUCTION: If the code snippet is missing or unavailable, you MUST INFER the functionality based on the file name, path, and standard software patterns. DO NOT reply with "I cannot see the code". Provide your best educational guess.
    `;

  let prompt = "";
  let schema = undefined;
  let mimeType = "text/plain";

  if (mode === 'EXPLAIN') {
    prompt = `
        Task: Explain ${path}.
        
        Return a JSON object with these keys:
        - "story": A fun real-world analogy explaining this module (for non-techies).
        - "tech": A technical explanation of patterns and logic (for developers).
        - "importance": A one-sentence summary of why this file matters.
        `;
    mimeType = "application/json";
    schema = {
      type: Type.OBJECT,
      properties: {
        story: { type: Type.STRING },
        tech: { type: Type.STRING },
        importance: { type: Type.STRING },
      },
      required: ["story", "tech", "importance"]
    };
  } else if (mode === 'FLOW') {
    prompt = `
        Task: Visualize the workflow involving ${path}.
        Output strictly as a numbered list of steps (e.g. "1. User clicks button...").
        Do not include preamble.
        `;
  } else if (mode === 'REVIEW') {
    prompt = `Critique ${path}. List 3 strengths and 1 area for improvement. Use bullet points.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${context}\n\n${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: mimeType,
        responseSchema: schema as any,
        temperature: 0.2, // Lower temperature for more consistent JSON
      }
    });
    return response.text || "No analysis generated.";
  } catch (e) {
    console.error("Deep Analysis API Error", e);
    return "Failed to generate analysis. Please check your API key.";
  }
};

export const semanticSearch = async (query: string, nodes: any[], fileMap?: string[]): Promise<{ nodeId: string; path: string[]; answer: string } | null> => {
  await initMCP();

  // Try to use MCP memory server to store search queries
  if (mcpInitialized) {
    try {
      await mcpProxy.callTool('memory', 'store', {
        key: `search_${Date.now()}`,
        value: JSON.stringify({ query, timestamp: new Date().toISOString() })
      });
      console.log('✓ Search query stored in MCP memory');
    } catch (mcpError) {
      console.log('MCP memory storage not available');
    }
  }

  const nodeContext = nodes.map(n => {
    return `ID: ${n.id} | PATH: ${n.data.fullPath} | SUMMARY: ${n.data.summary}`;
  }).join('\n');

  const systemInstruction = `
      You are a "Code Detective".
      User Query: "${query}"
      
      Task:
      1. Identify the *Primary Node* that best answers the query.
      2. Identify a *Related Path* (1-3 other node IDs) that are likely involved.
      3. Write a short, helpful answer explaining the connection.
      
      Return JSON.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Nodes:\n${nodeContext}\n\nQuery: "${query}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodeId: { type: Type.STRING },
            path: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING }
          },
          required: ["nodeId", "answer"]
        } as any
      }
    });

    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
};