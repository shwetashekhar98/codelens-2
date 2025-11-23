import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileCode, Activity, Box, Layers, Settings, Folder, FolderOpen, ChevronDown, ChevronRight, File, FileJson, Database, GraduationCap } from 'lucide-react';
import { FileNodeData } from '../types';
import { COMPLEXITY_COLORS } from '../constants';

const CustomNode = ({ id, data, selected }: NodeProps<FileNodeData>) => {
  const borderColor = COMPLEXITY_COLORS[data.complexityLevel];
  const isFolder = data.type === 'folder';
  
  // Focus Mode: Dim unrelated nodes
  const opacityClass = data.dimmed ? 'opacity-20 grayscale blur-[1px] transition-all duration-500' : 'opacity-100 transition-all duration-500';
  
  const getIcon = () => {
    if (isFolder) return data.expanded ? <FolderOpen size={16} className="text-amber-400" /> : <Folder size={16} className="text-amber-400" />;
    
    const lowerLabel = data.label.toLowerCase();
    if (lowerLabel.endsWith('.json')) return <FileJson size={16} className="text-yellow-400" />;
    if (lowerLabel.endsWith('.csv')) return <Database size={16} className="text-green-400" />;
    if (lowerLabel.endsWith('.md')) return <FileTextIcon size={16} className="text-slate-300" />;
    if (lowerLabel.endsWith('.py')) return <FileCode size={16} className="text-blue-400" />;
    if (lowerLabel.endsWith('.tsx') || lowerLabel.endsWith('.ts')) return <FileCode size={16} className="text-cyan-400" />;
    
    switch (data.type) {
      case 'component': return <Box size={16} className="text-blue-400" />;
      case 'service': return <Layers size={16} className="text-purple-400" />;
      case 'config': return <Settings size={16} className="text-slate-400" />;
      default: return <File size={16} className="text-slate-400" />;
    }
  };

  const FileTextIcon = ({size, className}: {size: number, className?: string}) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
  );

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onExpand && data.fullPath) {
        data.onExpand(id, data.fullPath);
    }
  };

  return (
    <div 
      className={`
        relative bg-slate-900/90 backdrop-blur-md rounded-lg min-w-[240px]
        shadow-xl group ${opacityClass}
        ${selected ? 'ring-2 ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:scale-105'}
      `}
      style={{ 
        borderTop: `4px solid ${borderColor}`,
        boxShadow: selected ? `0 0 20px ${borderColor}40` : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-3 !h-1 !rounded-sm" />
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            {getIcon()}
            <span className="font-mono text-xs font-semibold text-slate-200 truncate" title={data.label}>
              {data.label.split('/').pop()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
              {data.concepts && data.concepts.length > 0 && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30" title={`Concepts: ${data.concepts.join(', ')}`}>
                    <GraduationCap size={12} />
                </div>
              )}
              {data.complexityScore >= 8 && (
                <Activity size={14} className="text-red-400" />
              )}
              {isFolder && (
                  <button 
                    onClick={handleExpandClick}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title={data.expanded ? "Collapse" : "Expand to see contents"}
                  >
                      {data.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
              )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Complexity</span>
            <span style={{ color: borderColor }} className="font-bold">{data.complexityScore}/10</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${data.complexityScore * 10}%`,
                backgroundColor: borderColor
              }}
            />
          </div>
          
          {data.files && data.files.length > 0 && !data.expanded && (
             <div className="text-[10px] text-slate-500 mt-2 bg-slate-800/50 p-1.5 rounded border border-slate-800">
                <div className="flex items-center gap-1 mb-1 opacity-70">
                   <File size={10} /> <span>Contains:</span>
                </div>
                <div className="truncate opacity-80 pl-1 font-mono">
                   {data.files.slice(0, 2).join(', ')}
                   {data.files.length > 2 && `, +${data.files.length - 2}`}
                </div>
             </div>
          )}

          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{data.linesOfCode ? `~${data.linesOfCode} LOC` : 'Unknown size'}</span>
            <span className="uppercase tracking-wider opacity-70">{data.type}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-3 !h-1 !rounded-sm" />
    </div>
  );
};

export default memo(CustomNode);