import React, { useMemo, useState } from 'react';
import { X, GitBranch, Activity, Layout, PieChart as PieIcon, FolderOpen, FileText, Database, FileCode, ExternalLink, Sparkles, Loader2, HelpCircle, Network, MessageCircle, AlertTriangle, Zap, BookOpen, GraduationCap, Code2, Coffee } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RepoNode, RepoAnalysis, ComplexityLevel, AnalysisMode } from '../types';
import { COMPLEXITY_COLORS } from '../constants';

interface SidebarProps {
  selectedNode: RepoNode | null;
  repoAnalysis: RepoAnalysis | null;
  onClose: () => void;
  onDeepAnalyze: (node: RepoNode, mode: AnalysisMode) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedNode, repoAnalysis, onClose, onDeepAnalyze }) => {
  const [activeTab, setActiveTab] = useState<AnalysisMode>('EXPLAIN');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [explainMode, setExplainMode] = useState<'STORY' | 'CODE'>('STORY');

  React.useEffect(() => {
    setActiveTab('EXPLAIN');
    setExplainMode('STORY');
    setShowScoreInfo(false);
  }, [selectedNode?.id]);

  const chartsData = useMemo(() => {
    if (!repoAnalysis) return { complexity: [], types: [] };
    const nodes = repoAnalysis.nodes;
    const complexity = [
        { name: 'Low', value: nodes.filter(n => n.data.complexityLevel === ComplexityLevel.LOW).length, color: COMPLEXITY_COLORS[ComplexityLevel.LOW] },
        { name: 'Mod', value: nodes.filter(n => n.data.complexityLevel === ComplexityLevel.MODERATE).length, color: COMPLEXITY_COLORS[ComplexityLevel.MODERATE] },
        { name: 'High', value: nodes.filter(n => n.data.complexityLevel === ComplexityLevel.HIGH).length, color: COMPLEXITY_COLORS[ComplexityLevel.HIGH] },
        { name: 'Intense', value: nodes.filter(n => n.data.complexityLevel === ComplexityLevel.INTENSE).length, color: COMPLEXITY_COLORS[ComplexityLevel.INTENSE] },
    ].filter(d => d.value > 0);
    return { complexity };
  }, [repoAnalysis]);

  const handleDeepAnalyzeClick = async (mode: AnalysisMode) => {
    if (!selectedNode) return;
    setActiveTab(mode);
    if (selectedNode.data.analysisCache?.[mode]) return; 
    setIsAnalyzing(true);
    await onDeepAnalyze(selectedNode, mode);
    setIsAnalyzing(false);
  };

  const renderExplainContent = (text: string) => {
      let story = "";
      let tech = "";
      let importance = "";

      // 1. Try JSON Parsing (For strict JSON mode)
      try {
          const json = JSON.parse(text);
          story = json.story || "";
          tech = json.tech || "";
          importance = json.importance || "";
      } catch (e) {
          // 2. Fallback Regex Parsing (In case model ignores schema or network issue)
          const sections = text.split('###').filter(s => s.trim());
          const storySection = sections.find(s => s.toLowerCase().includes('story'));
          const techSection = sections.find(s => s.toLowerCase().includes('tech'));
          const whySection = sections.find(s => s.toLowerCase().includes('why'));

          story = storySection ? storySection.replace(/The Story|The Tech|\(.*\)/gi, '').trim() : "";
          tech = techSection ? techSection.replace(/The Story|The Tech|\(.*\)/gi, '').trim() : "";
          importance = whySection ? whySection.replace(/Why it matters/gi, '').trim() : "";
          
          // 3. Ultimate Fallback: Just show raw text if structure is missing
          if (!story && !tech) {
              tech = text;
          }
      }

      const contentToRender = explainMode === 'STORY' ? story : tech;

      return (
          <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-center mb-4">
                  <div className="bg-slate-900 rounded-full p-1 border border-slate-700 flex gap-1">
                      <button 
                        onClick={() => setExplainMode('STORY')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${explainMode === 'STORY' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                          <Coffee size={12} /> Story
                      </button>
                      <button 
                        onClick={() => setExplainMode('CODE')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${explainMode === 'CODE' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                          <Code2 size={12} /> Code
                      </button>
                  </div>
              </div>

              {contentToRender ? (
                  <div className={`p-4 rounded-xl border ${explainMode === 'STORY' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-light">
                          {contentToRender}
                      </div>
                  </div>
              ) : (
                  <div className="text-xs text-slate-500 text-center italic">
                      {explainMode === 'STORY' ? "No analogy generated." : "No technical details generated."}
                  </div>
              )}

              {importance && (
                  <div className="mt-4 border-t border-slate-700 pt-4">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Zap size={12} fill="currentColor" /> Bottom Line
                      </h4>
                      <p className="text-xs text-slate-300 italic">
                          {importance}
                      </p>
                  </div>
              )}
          </div>
      );
  };

  const renderFlowContent = (text: string) => {
      const steps = text.split(/\d+\.\s+/).filter(s => s.trim().length > 0);
      
      // Fallback if list format isn't respected
      if (steps.length <= 1) {
          return (
             <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-300 whitespace-pre-wrap">
                {text}
             </div>
          );
      }

      return (
          <div className="space-y-0 relative ml-2">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-700/50"></div>
              {steps.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-4 mb-4 group">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0 z-10 group-hover:border-blue-400 group-hover:scale-110 transition-all shadow-xl">
                          {i + 1}
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-300 flex-1 group-hover:bg-slate-800/80 transition-colors">
                          {step.trim()}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  if (!repoAnalysis) return null; 

  if (!selectedNode) {
    return (
      <div className="w-96 bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl z-20 absolute top-0 left-0 transition-transform duration-300">
         <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white tracking-tight break-all">{repoAnalysis.repoName}</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-md">
                   {repoAnalysis.nodes.length} Modules
                </span>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-6 space-y-8">
             <div className="h-40 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                         <Pie data={chartsData.complexity} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                             {chartsData.complexity.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                         </Pie>
                         <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
                     </PieChart>
                 </ResponsiveContainer>
             </div>
             <div className="border-t border-slate-800 pt-6">
                 <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Overview</h3>
                 <p className="text-slate-300 text-sm leading-relaxed font-light">{repoAnalysis.overallSummary}</p>
             </div>
         </div>
      </div>
    );
  }

  const { data } = selectedNode;
  const borderColor = COMPLEXITY_COLORS[data.complexityLevel];
  const isFolder = data.type === 'folder';
  const currentAnalysisText = data.analysisCache?.[activeTab];

  return (
    <div className="w-96 bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl z-20 absolute top-0 left-0 transition-transform duration-300">
      <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-slate-900">
        <div className="overflow-hidden w-full mr-4">
           <div className="flex items-center gap-2 mb-1">
              {isFolder ? <FolderOpen size={18} className="text-amber-400" /> : <FileText size={18} className="text-blue-400 flex-shrink-0" />}
              <h2 className="text-sm font-bold text-white font-mono tracking-tight truncate w-full" title={data.label}>
                {data.label.split('/').pop()}
              </h2>
           </div>
           <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-slate-700">{data.type}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex-shrink-0"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 relative">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Activity size={14} className="text-slate-400" /> Complexity</h3>
             <button onClick={() => setShowScoreInfo(!showScoreInfo)} className="text-slate-500 hover:text-blue-400 transition-colors"><HelpCircle size={14} /></button>
          </div>
          {showScoreInfo && (
              <div className="absolute top-10 right-0 z-50 w-64 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-3 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200">
                  <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">Calculation Basis</div>
                  <ul className="space-y-2 list-disc pl-3">
                      <li><b className="text-white">Logic Density:</b> Control structures vs LoC.</li>
                      <li><b className="text-white">Coupling:</b> Import dependencies.</li>
                  </ul>
              </div>
          )}
          <div className="flex items-start gap-4">
             <div className="flex flex-col items-center">
                <span className="text-3xl font-bold" style={{ color: borderColor }}>{data.complexityScore}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold">/ 10</span>
             </div>
             <div className="flex-1">
                 <div className="text-xs text-slate-300 italic leading-relaxed border-l-2 border-slate-600 pl-3">"{data.reasoning}"</div>
             </div>
          </div>
        </div>

        {data.concepts && data.concepts.length > 0 && (
            <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <GraduationCap size={14} /> Key Concepts
                </h3>
                <div className="flex flex-wrap gap-2">
                    {data.concepts.map((concept, i) => (
                        <button 
                            key={i}
                            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(concept + ' programming tutorial')}`, '_blank')}
                            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 text-slate-300 px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1 group"
                        >
                            <BookOpen size={10} className="text-slate-500 group-hover:text-blue-400" />
                            {concept}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" /> Deep Analysis
                </h3>
                {currentAnalysisText && (
                    <span className="text-[10px] text-green-400 flex items-center gap-1 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20"><Zap size={10} fill="currentColor" /> Cached</span>
                )}
            </div>
            
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <button onClick={() => handleDeepAnalyzeClick('EXPLAIN')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'EXPLAIN' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                    <MessageCircle size={12} /> Explain
                </button>
                <button onClick={() => handleDeepAnalyzeClick('FLOW')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'FLOW' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Network size={12} /> Flow
                </button>
                <button onClick={() => handleDeepAnalyzeClick('REVIEW')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'REVIEW' ? 'bg-red-500/20 text-red-300 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                    <AlertTriangle size={12} /> Review
                </button>
            </div>
            
            <div className="min-h-[150px]">
                {!currentAnalysisText ? (
                    <button 
                        onClick={() => handleDeepAnalyzeClick(activeTab)}
                        disabled={isAnalyzing}
                        className="w-full h-32 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 text-xs flex flex-col items-center justify-center gap-2 hover:border-slate-600 hover:bg-slate-800/30 transition-all"
                    >
                        {isAnalyzing ? <Loader2 size={20} className="animate-spin text-blue-400" /> : <Sparkles size={20} />}
                        <span>Generate <b>{activeTab.toLowerCase()}</b> analysis</span>
                    </button>
                ) : (
                    <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-4 animate-in fade-in duration-300">
                        {activeTab === 'FLOW' ? renderFlowContent(currentAnalysisText) : 
                         activeTab === 'EXPLAIN' ? renderExplainContent(currentAnalysisText) :
                         <div className="whitespace-pre-wrap text-sm text-slate-300 font-light">{currentAnalysisText}</div>
                        }
                    </div>
                )}
            </div>
        </div>

        <a href={data.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs transition-colors">
            View Source on GitHub <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default Sidebar;