import { Award, FileCheck, Sparkles, History } from "lucide-react";

interface HeaderProps {
  onShowHistory?: () => void;
  hasHistory: boolean;
  onReset?: () => void;
}

export default function Header({ onShowHistory, hasHistory, onReset }: HeaderProps) {
  return (
    <header id="app-header" className="h-16 sticky top-0 z-40 border-b border-white/40 bg-white/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div 
          id="header-logo-container" 
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={onReset}
        >
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-sans font-bold text-lg tracking-tight text-slate-800 flex items-center gap-1.5">
              Resume<span className="text-indigo-600">Optic</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> ATS PRO
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {hasHistory && onShowHistory && (
            <button
              id="view-history-button"
              onClick={onShowHistory}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/60 border border-white/60 hover:border-white/80 rounded-lg transition-all duration-200 shadow-2xs backdrop-blur-xs"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>v2.4.0 Stable</span>
          </div>
        </div>
      </div>
    </header>
  );
}
