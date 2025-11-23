import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { SearchResult } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => Promise<void>;
  isSearching: boolean;
  searchResult: SearchResult | null;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isSearching, searchResult }) => {
  const [query, setQuery] = useState('');
  const [noResult, setNoResult] = useState(false);

  useEffect(() => {
    if (isSearching) setNoResult(false);
  }, [isSearching]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4 flex flex-col items-center">
      <form onSubmit={handleSubmit} className="relative group w-full">
        {/* Glow Effect */}
        <div className={`
            absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-50 group-hover:opacity-100 transition duration-500 blur 
            ${isSearching ? 'opacity-100' : ''}
            ${noResult ? 'from-red-500 to-orange-500 opacity-100' : ''}
        `}></div>
        
        {/* Input Container */}
        <div className={`
            relative flex items-center bg-slate-900 rounded-full shadow-2xl transition-transform
            ${noResult ? 'animate-shake border border-red-500' : ''}
        `}>
          <div className="pl-4 text-slate-400">
            {isSearching ? <Loader2 className="animate-spin" size={20} /> : noResult ? <AlertCircle className="text-red-500" size={20} /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={noResult ? "No matching nodes found. Try again." : "Ask codebase: 'Where is authentication?'"}
            className={`w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-3 px-4 font-medium ${noResult ? 'placeholder-red-400' : ''}`}
            disabled={isSearching}
          />
          <div className="pr-2">
             <button 
                type="submit"
                disabled={isSearching || !query}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-blue-400 transition-colors disabled:opacity-50"
             >
                <Sparkles size={16} />
             </button>
          </div>
        </div>
      </form>

      {/* Search Answer Interaction Popup - VISUALLY APPEALING OUTPUT */}
      {searchResult && !isSearching && !noResult && (
          <div className="mt-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-5 shadow-2xl w-full animate-in slide-in-from-top-2 fade-in duration-300">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg mt-1 shrink-0">
                    <MessageSquare size={20} className="text-purple-400" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">CodeLens Insight</h4>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {searchResult.answer}
                    </p>
                    {searchResult.path && searchResult.path.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-2 text-[10px] text-slate-400">
                           <span className="font-bold text-purple-400">Highlighting:</span> 
                           {searchResult.path.length + 1} relevant modules
                        </div>
                    )}
                </div>
             </div>
          </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default SearchBar;