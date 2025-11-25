import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    ConnectionMode,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    useReactFlow,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './components/CustomNode';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import AnalysisModal from './components/AnalysisModal';
import { analyzeRepository, semanticSearch, generateDeepAnalysis } from './services/geminiService';
import { dbService } from './services/dbService';
// import { initMCP, getMCPStatus } from './services/mcpIntegration'; // Optional MCP feature - requires @modelcontextprotocol/sdk
import { RepoNode, RepoAnalysis, ComplexityLevel, SearchResult, AnalysisMode } from './types';
import { MOCK_REPO_SUGGESTIONS } from './constants';
import { Loader2, Github, AlertCircle, Info, Clock, ArrowRight, Trash2, Save, Database } from 'lucide-react';

const nodeTypes = {
    custom: CustomNode,
};

const FlowArea = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<RepoNode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [repoAnalysis, setRepoAnalysis] = useState<RepoAnalysis | null>(null);
    const [repoInput, setRepoInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showAnalysisInfo, setShowAnalysisInfo] = useState(false);
    const [recentAnalyses, setRecentAnalyses] = useState<RepoAnalysis[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    // const [mcpInitialized, setMcpInitialized] = useState(false); // Optional MCP feature

    const { fitView, zoomTo } = useReactFlow();

    // Optional: Initialize MCP servers on mount (requires @modelcontextprotocol/sdk)
    // useEffect(() => {
    //     const initializeMCP = async () => {
    //         try {
    //             const status = await initMCP();
    //             setMcpInitialized(status.initialized);
    //             if (status.initialized) {
    //                 console.log('✓ MCP servers ready:', status.servers.filter(s => s.connected).map(s => s.name).join(', '));
    //             }
    //         } catch (error) {
    //             console.warn('MCP initialization failed:', error);
    //         }
    //     };
    //     initializeMCP();
    // }, []);

    useEffect(() => {
        const loadHistory = async () => {
            const history = await dbService.getRecentAnalyses();
            setRecentAnalyses(history);
        };
        loadHistory();
    }, [repoAnalysis]);

    const persistChanges = useCallback(async (updatedNodes: RepoNode[], updatedEdges: Edge[], currentAnalysis: RepoAnalysis | null) => {
        if (!currentAnalysis) return;
        setIsSaving(true);
        const updatedAnalysisData = { ...currentAnalysis, nodes: updatedNodes, edges: updatedEdges };
        setRepoAnalysis(updatedAnalysisData);
        await dbService.updateAnalysis(currentAnalysis.repoName, { nodes: updatedNodes, edges: updatedEdges });
        setTimeout(() => setIsSaving(false), 800);
    }, []);

    const handleNodeExpand = useCallback((nodeId: string, fullPath: string) => {
        setNodes((currentNodes) => {
            const parentNode = currentNodes.find(n => n.id === nodeId);
            if (!parentNode || !repoAnalysis?.fileMap) return currentNodes;

            let nextNodes = [...currentNodes];
            let nextEdges = [...edges];

            const isExpanded = parentNode.data.expanded;
            const prefix = fullPath.endsWith('/') ? fullPath : `${fullPath}/`;

            if (isExpanded) {
                const childrenToRemove = currentNodes.filter(n =>
                    n.data.fullPath !== fullPath && n.data.fullPath?.startsWith(prefix)
                );
                const childIds = new Set(childrenToRemove.map(n => n.id));

                nextNodes = currentNodes
                    .filter(n => !childIds.has(n.id))
                    .map(n => n.id === nodeId ? { ...n, data: { ...n.data, expanded: false } } : n);

                setEdges((eds) => {
                    const filtered = eds.filter(e => !childIds.has(e.source) && !childIds.has(e.target));
                    persistChanges(nextNodes, filtered, repoAnalysis);
                    return filtered;
                });

                return nextNodes;
            } else {
                const immediateChildren = new Set<string>();
                repoAnalysis.fileMap.forEach(path => {
                    if (path.startsWith(prefix)) {
                        const relative = path.slice(prefix.length);
                        const parts = relative.split('/');
                        const segment = parts[0];
                        if (segment) immediateChildren.add(`${prefix}${segment}`);
                    }
                });

                const existingPaths = new Set(currentNodes.map(n => n.data.fullPath));
                const newChildrenPaths = Array.from(immediateChildren).filter(p => !existingPaths.has(p));

                if (newChildrenPaths.length === 0) {
                    nextNodes = currentNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, expanded: true } } : n);
                    persistChanges(nextNodes, nextEdges, repoAnalysis);
                    return nextNodes;
                }

                const newNodes: RepoNode[] = newChildrenPaths.map((path, index) => {
                    const label = path.split('/').pop() || path;
                    const isFolder = repoAnalysis.fileMap.some(f => f.startsWith(`${path}/`));
                    const type = isFolder ? 'folder' : label.endsWith('.json') ? 'config' : 'file';
                    const extension = label.includes('.') ? label.split('.').pop() : '';
                    const count = newChildrenPaths.length;
                    const radius = Math.max(300, count * 30);
                    const angleStep = (Math.PI * 1.5) / Math.max(1, count - 1);
                    const startAngle = -Math.PI / 4;
                    const angle = startAngle + (index * angleStep);
                    const x = parentNode.position.x + radius * Math.cos(angle);
                    const y = parentNode.position.y + radius * Math.sin(angle) + (index % 2 * 50);

                    return {
                        id: `auto-${path.replace(/[\/\s]/g, '-')}`,
                        type: 'custom',
                        position: { x, y },
                        data: {
                            label, fullPath: path, type: type as any,
                            complexityScore: 2, complexityLevel: ComplexityLevel.LOW, linesOfCode: 0,
                            summary: isFolder ? 'Directory' : `${extension?.toUpperCase()} File`,
                            files: [], url: `https://github.com/${repoAnalysis.repoName}/${isFolder ? 'tree' : 'blob'}/main/${encodeURIComponent(path)}`,
                            reasoning: 'Expanded from parent', expanded: false,
                            analysisCache: {}, dimmed: false,
                            onAnalyze: () => { }, onExpand: handleNodeExpand
                        }
                    };
                });

                const newEdgesList: Edge[] = newNodes.map(child => ({
                    id: `edge-${nodeId}-${child.id}`,
                    source: nodeId,
                    target: child.id,
                    animated: true,
                    style: { stroke: '#64748b', strokeDasharray: '5,5' },
                }));

                nextNodes = [...currentNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, expanded: true } } : n), ...newNodes];

                setEdges(eds => {
                    const combined = [...eds, ...newEdgesList];
                    persistChanges(nextNodes, combined, repoAnalysis);
                    return combined;
                });

                return nextNodes;
            }
        });
    }, [repoAnalysis, edges, persistChanges, setEdges, setNodes]);

    const handleDeepAnalyze = async (node: RepoNode, mode: AnalysisMode) => {
        if (!repoAnalysis) return;

        try {
            // Perform analysis (will return a string, even if it's an error message)
            const explanation = await generateDeepAnalysis(
                repoAnalysis.repoName,
                repoAnalysis.defaultBranch,
                node.data.fullPath || node.data.label,
                node.data.type,
                mode
            );

            // Update Node State
            let updatedNodes: RepoNode[] = [];
            setNodes((nds) => {
                updatedNodes = nds.map(n => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                analysisCache: { ...n.data.analysisCache, [mode]: explanation }
                            }
                        };
                    }
                    return n;
                });
                return updatedNodes;
            });

            // Update Sidebar Selection if still selected
            setSelectedNode(prev => {
                if (prev && prev.id === node.id) {
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            analysisCache: { ...prev.data.analysisCache, [mode]: explanation }
                        }
                    }
                }
                return prev;
            });

            // Persist to local storage
            persistChanges(updatedNodes, edges, repoAnalysis);
        } catch (e) {
            console.error("Deep analysis failed in UI handler", e);
        }
    };

    const handleAnalyze = async (name: string) => {
        setIsLoading(true);
        setError(null);
        setSelectedNode(null);
        setRepoAnalysis(null);
        try {
            const data: RepoAnalysis = await analyzeRepository(name);
            const hydratedNodes = data.nodes.map(n => ({
                ...n,
                data: { ...n.data, onExpand: handleNodeExpand, analysisCache: n.data.analysisCache || {}, dimmed: false }
            }));
            setNodes(hydratedNodes);
            setEdges(data.edges);
            setRepoAnalysis(data);
            setTimeout(() => fitView({ duration: 800 }), 100);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to analyze repository.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        if (!nodes.length) return;
        setIsSearching(true);
        setSearchResult(null); // Clear previous

        const result = await semanticSearch(query, nodes, repoAnalysis?.fileMap);

        if (result && result.nodeId) {
            setSearchResult(result);

            // FOCUS MODE: Dim unrelated nodes
            const pathSet = new Set(result.path || []);
            pathSet.add(result.nodeId);

            setNodes(nds => nds.map(n => ({
                ...n,
                data: {
                    ...n.data,
                    dimmed: !pathSet.has(n.id) // Dim if NOT in path
                }
            })));

            // Find nodes to zoom into
            const targetNodes = nodes.filter(n => pathSet.has(n.id));
            if (targetNodes.length > 0) {
                fitView({ nodes: targetNodes, duration: 1200, minZoom: 0.5, maxZoom: 1.5, padding: 0.2 });
            }

            const mainNode = nodes.find(n => n.id === result.nodeId);
            if (mainNode) setSelectedNode(mainNode);

            // Auto-Reset Dimming after 15s
            setTimeout(() => {
                setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, dimmed: false } })));
            }, 15000);
        }
        setIsSearching(false);
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        setSelectedNode(node);
        // Clear focus mode on click
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, dimmed: false } })));
    }, [setNodes]);

    const handleClearHistory = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await dbService.clearHistory();
        setRecentAnalyses([]);
    };

    if (!repoAnalysis && !isLoading) {
        return (
            <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                {/* MCP Status Indicator - Optional feature */}
                {/* {mcpInitialized && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/80 border border-green-500/30 px-3 py-2 rounded-lg backdrop-blur-sm">
                        <Server size={16} className="text-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">MCP Active</span>
                    </div>
                )} */}

                <div className="z-10 max-w-3xl w-full flex flex-col items-center space-y-8">
                    <div className="text-center space-y-8 w-full">
                        <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-full shadow-2xl mb-4 ring-1 ring-slate-700">
                            <Github className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 tracking-tight">CodeLens AI</h1>
                        <p className="text-lg text-slate-400 max-w-lg mx-auto">Interactive architecture visualization. Explore complex codebases directory by directory.</p>
                        <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-75 blur group-hover:opacity-100 transition duration-200"></div>
                                <div className="relative flex">
                                    <input type="text" placeholder="Enter GitHub repo (e.g., facebook/react)" className="w-full bg-slate-900 text-white border-0 rounded-l-lg p-4 focus:ring-0 focus:outline-none placeholder-slate-500" value={repoInput} onChange={(e) => setRepoInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && repoInput && handleAnalyze(repoInput)} />
                                    <button onClick={() => repoInput && handleAnalyze(repoInput)} className="bg-slate-800 text-white px-6 rounded-r-lg font-semibold hover:bg-slate-700 transition-colors">Analyze</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {recentAnalyses.length > 0 && (
                        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Clock size={14} /> Recent Activity</h3>
                                <button onClick={handleClearHistory} className="text-xs text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors"><Trash2 size={12} /> Clear</button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {recentAnalyses.slice(0, 4).map((repo) => (
                                    <div key={repo.repoName} onClick={() => handleAnalyze(repo.repoName)} className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 p-3 rounded-lg cursor-pointer group transition-all hover:bg-slate-800">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-sm text-blue-400 group-hover:text-blue-300 truncate">{repo.repoName}</span>
                                            <ArrowRight size={14} className="text-slate-600 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span>{repo.architectureType}</span><span>•</span><span>{repo.nodes.length} Modules</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {recentAnalyses.length === 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mr-2 pt-1">Try:</span>
                            {MOCK_REPO_SUGGESTIONS.map(repo => (
                                <button key={repo} onClick={() => handleAnalyze(repo)} className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full hover:border-blue-500 hover:text-blue-400 transition-all">{repo}</button>
                            ))}
                            <button onClick={() => handleAnalyze("CodeWithHarry/100-days-of-code-youtube")} className="text-xs bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1 rounded-full hover:border-amber-500 transition-all">100-Days-Python</button>
                        </div>
                    )}
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded flex items-center gap-2 justify-center text-sm"><AlertCircle size={16} /> {error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex bg-slate-950 relative overflow-hidden">
            <AnalysisModal isOpen={showAnalysisInfo} onClose={() => setShowAnalysisInfo(false)} />
            <Sidebar selectedNode={selectedNode} repoAnalysis={repoAnalysis} onClose={() => setSelectedNode(null)} onDeepAnalyze={handleDeepAnalyze} />
            <div className={`flex-1 relative transition-all duration-300 ${repoAnalysis ? 'ml-96' : 'ml-0'}`}>
                <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-4 flex justify-between items-start">
                    <div className="pointer-events-auto flex items-center gap-2">
                        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm font-mono flex items-center gap-2 shadow-lg">
                            <Github size={14} /> {repoAnalysis?.repoName} <button onClick={() => setRepoAnalysis(null)} className="ml-2 text-slate-500 hover:text-white">change</button>
                        </div>
                        <button onClick={() => setShowAnalysisInfo(true)} className="bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 p-2 rounded-full hover:bg-slate-800 hover:text-white transition-colors shadow-lg" title="How it works"><Info size={16} /></button>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-500 border shadow-lg ${isSaving ? 'bg-green-500/10 text-green-400 border-green-500/30 opacity-100' : 'bg-slate-900/80 text-slate-500 border-slate-700 opacity-50'}`}>
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                            {isSaving ? "Auto-saving..." : "Synced"}
                        </div>
                        {/* Optional MCP status indicator */}
                        {/* {mcpInitialized && (
                            <div className="flex items-center gap-2 bg-slate-900/80 border border-green-500/30 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg">
                                <Server size={14} className="text-green-400" />
                                <span className="text-xs text-green-400 font-medium">MCP</span>
                            </div>
                        )} */}
                    </div>
                </div>
                <SearchBar onSearch={handleSearch} isSearching={isSearching} searchResult={searchResult} />
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={onNodeClick} nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose} fitView attributionPosition="bottom-right" className="bg-slate-950">
                    <Background color="#334155" gap={20} size={1} variant={BackgroundVariant.Dots} />
                    <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300" />
                </ReactFlow>
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-white">Analyzing Structure...</h3>
                        <p className="text-slate-400">Mapping directories and dependencies</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function App() {
    return (
        <ReactFlowProvider>
            <FlowArea />
        </ReactFlowProvider>
    );
}