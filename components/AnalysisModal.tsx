import React from 'react';
import { X, Network, Activity, Code2, FileText, Layers, GitMerge, Cpu } from 'lucide-react';
import { COMPLEXITY_COLORS } from '../constants';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Network className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Analysis Methodology</h2>
              <p className="text-sm text-slate-400">Real-time architectural visualization</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
          
          {/* Section 1: Methodology */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="mb-3 p-2 w-fit bg-blue-500/10 rounded-lg text-blue-400">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">Real Data</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We fetch the actual file structure and README from GitHub. The AI analyzes these real file names and paths to infer the architecture.
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="mb-3 p-2 w-fit bg-purple-500/10 rounded-lg text-purple-400">
                <Activity size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">Complexity Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scores are determined by evaluating 4 key architectural parameters to determine the weight of each module.
              </p>
            </div>
          </div>

          {/* Section 2: Scoring Parameters */}
          <div>
             <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Scoring Parameters</h3>
             <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                    <Cpu size={16} className="text-blue-400 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-slate-200">Control Flow</div>
                        <div className="text-xs text-slate-500">Density of logic, conditionals, and algorithms.</div>
                    </div>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                    <GitMerge size={16} className="text-purple-400 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-slate-200">Coupling</div>
                        <div className="text-xs text-slate-500">Number of imports and dependencies on other modules.</div>
                    </div>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                    <Layers size={16} className="text-emerald-400 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-slate-200">State Management</div>
                        <div className="text-xs text-slate-500">Complexity of mutable state and side effects.</div>
                    </div>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                    <Activity size={16} className="text-amber-400 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-slate-200">Criticality</div>
                        <div className="text-xs text-slate-500">Importance to the core function (e.g., Engine vs Config).</div>
                    </div>
                </div>
             </div>
          </div>

          {/* Section 3: Legend */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Score Legend</h3>
            <div className="space-y-3">
              {[
                { label: 'Low (1-3)', color: COMPLEXITY_COLORS.LOW, desc: 'Configuration files, interfaces, simple utilities, or types.' },
                { label: 'Moderate (4-5)', color: COMPLEXITY_COLORS.MODERATE, desc: 'Standard components, API handlers, or standalone functions.' },
                { label: 'High (6-7)', color: COMPLEXITY_COLORS.HIGH, desc: 'Core services, state management stores, or complex UI logic.' },
                { label: 'Intense (8-10)', color: COMPLEXITY_COLORS.INTENSE, desc: 'Central engines, interpreters, or massive monolithic controllers.' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                  <div className="w-24 shrink-0 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                    <span className="text-sm font-mono font-bold text-slate-300">{item.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;