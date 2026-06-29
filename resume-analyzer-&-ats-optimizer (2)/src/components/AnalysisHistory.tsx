import React from "react";
import { History, Calendar, Trash2, ArrowRight, X, ChevronRight, FileCheck } from "lucide-react";
import { AnalysisResult } from "../types";

interface AnalysisHistoryProps {
  history: AnalysisResult[];
  onSelect: (result: AnalysisResult) => void;
  onClear: () => void;
  onClose: () => void;
  activeId?: string;
}

export default function AnalysisHistory({ history, onSelect, onClear, onClose, activeId }: AnalysisHistoryProps) {
  return (
    <div className="frosted-glass p-6 rounded-2xl border border-white/60 shadow-lg space-y-5 h-full flex flex-col justify-between">
      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Analysis History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/60 rounded-md text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          Toggle between previous resumes you've analyzed or targets you've optimized.
        </p>

        {/* History Item list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-2">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300" />
              <span>No past reports found. Execute your first analysis.</span>
            </div>
          ) : (
            history.map((item, idx) => {
              const dateStr = new Date(item.metadata.analyzedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });
              const isActive = activeId === `${item.metadata.analyzedAt}`;

              return (
                <div
                  key={idx}
                  onClick={() => onSelect(item)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 group flex items-center justify-between ${
                    isActive
                      ? "bg-white border-indigo-500 text-slate-900 shadow-2xs font-semibold"
                      : "bg-white/30 border-slate-200/50 text-slate-600 hover:border-slate-300 hover:bg-white/60"
                  }`}
                >
                  <div className="space-y-1 overflow-hidden flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md uppercase">
                        {item.score}% Match
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 font-mono">
                        {dateStr}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {item.metadata.jobTitle}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-all transform group-hover:translate-x-0.5" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {history.length > 0 && (
        <button
          onClick={onClear}
          className="w-full inline-flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition duration-200 border border-rose-200 mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      )}
    </div>
  );
}
