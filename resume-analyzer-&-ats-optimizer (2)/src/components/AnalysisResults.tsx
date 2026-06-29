import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Copy, Check, ArrowRight, Sparkles, FileText, ChevronRight, Award, Flame, Target } from "lucide-react";
import { AnalysisResult, ChecklistItem, ActionItem, BulletImprovement } from "../types";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onLoadToSandbox: (bullet: string) => void;
}

export default function AnalysisResults({ result, onLoadToSandbox }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<"feedback" | "keywords" | "bullets" | "checklist">("feedback");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [checklistFilter, setChecklistFilter] = useState<"all" | "issues" | "passed">("all");

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAction = (id: string) => {
    setCompletedActions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Score diagnostic text
  const getScoreInterpretation = (score: number) => {
    if (score >= 85) return { text: "Outstanding Match", color: "text-emerald-600", desc: "Your resume aligns beautifully with modern ATS standard layouts and critical qualifications." };
    if (score >= 70) return { text: "Strong Candidate", color: "text-indigo-600", desc: "Solid layout and credentials, but minor refinements could yield a much higher interview rate." };
    if (score >= 50) return { text: "Moderate Alignment", color: "text-amber-600", desc: "Contains necessary details, but has noticeable gaps in technical keywords and formatting structure." };
    return { text: "Needs Calibration", color: "text-rose-600", desc: "Significant gaps in formatting, action metrics, or job-specific terminology. Follow the action items." };
  };

  const scoreMeta = getScoreInterpretation(result.score);

  // Formatting checklist filter
  const filteredChecklist = result.formatting.checklist.filter(item => {
    if (checklistFilter === "issues") return item.status === "warning" || item.status === "fail";
    if (checklistFilter === "passed") return item.status === "pass";
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Bento Grid Top Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overall Score */}
        <div className="frosted-glass-deep p-6 rounded-3xl flex items-center gap-5 shadow-md border border-white/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <div className="relative w-18 h-18 shrink-0">
            <svg className="w-18 h-18 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path className="stroke-slate-200/60 fill-none" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              {/* Progress circle */}
              <path 
                className="stroke-indigo-600 fill-none transition-all duration-1000 ease-out" 
                strokeDasharray={`${result.score}, 100`} 
                strokeWidth="3.2" 
                strokeLinecap="round" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-slate-800 font-mono">
              {result.score}%
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Overall Score</p>
            <p className={`text-sm font-extrabold ${scoreMeta.color} mt-0.5`}>{scoreMeta.text}</p>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">{scoreMeta.desc}</p>
          </div>
        </div>

        {/* Formatting Score */}
        <div className="frosted-glass-deep p-6 rounded-3xl flex items-center gap-5 shadow-md border border-white/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-2xs">
            <span className="text-emerald-700 font-extrabold text-xl font-mono">{result.formatting.score}</span>
            <span className="text-[8px] font-bold text-emerald-600/80 uppercase font-mono tracking-wider">PTS</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Formatting Score</p>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">Structure & Layout</p>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">
              {result.formatting.score >= 80 ? "Clean modern flow compliant with parsers." : "Minor section headers or contact fields missing."}
            </p>
          </div>
        </div>

        {/* Relevance / Keyword Score */}
        <div className="frosted-glass-deep p-6 rounded-3xl flex items-center gap-5 shadow-md border border-white/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-2xs">
            <span className="text-amber-700 font-extrabold text-xl font-mono">{result.relevance.score}</span>
            <span className="text-[8px] font-bold text-amber-600/80 uppercase font-mono tracking-wider">MATCH</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">JD Relevance</p>
            <p className="text-sm font-extrabold text-amber-800 mt-0.5">
              {result.relevance.missingKeywords.length === 0 ? "Complete Alignment" : `${result.relevance.missingKeywords.length} Critical Gaps`}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">
              {result.relevance.matchingKeywords.length} keywords matched. Polish weak bullets to integrate remaining skills.
            </p>
          </div>
        </div>

      </div>

      {/* 2. Detailed Feedback Tabs & Navigation */}
      <div className="frosted-glass-deep border border-white/60 rounded-3xl flex flex-col shadow-xl overflow-hidden min-h-[500px]">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200/60 px-4 md:px-8 bg-white/30 backdrop-blur-md overflow-x-auto">
          <button 
            onClick={() => setActiveTab("feedback")}
            className={`py-4 px-5 border-b-2 text-xs md:text-sm font-bold transition-all shrink-0 duration-200 ${
              activeTab === "feedback" 
                ? "border-indigo-600 text-slate-900" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Formatting Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab("keywords")}
            className={`py-4 px-5 border-b-2 text-xs md:text-sm font-bold transition-all shrink-0 duration-200 ${
              activeTab === "keywords" 
                ? "border-indigo-600 text-slate-900" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Keyword Match & Gaps
          </button>
          <button 
            onClick={() => setActiveTab("bullets")}
            className={`py-4 px-5 border-b-2 text-xs md:text-sm font-bold transition-all shrink-0 duration-200 ${
              activeTab === "bullets" 
                ? "border-indigo-600 text-slate-900" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            AI Bullet Redesigns
          </button>
          <button 
            onClick={() => setActiveTab("checklist")}
            className={`py-4 px-5 border-b-2 text-xs md:text-sm font-bold transition-all shrink-0 duration-200 ${
              activeTab === "checklist" 
                ? "border-indigo-600 text-slate-900" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Step-by-Step Actions
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 p-6 md:p-8 space-y-6">

          {/* TAB 1: FORMATTING DIAGNOSTICS */}
          {activeTab === "feedback" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white/40 p-4 rounded-2xl border border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">LAYOUT SUMMARY</h4>
                <p className="text-slate-700 text-sm leading-relaxed">{result.formatting.summary}</p>
              </div>

              {/* Checklist & Status Filters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">ATS Verification Checklist</h4>
                  
                  {/* Status Filters */}
                  <div className="flex bg-white/50 border border-slate-200 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setChecklistFilter("all")}
                      className={`px-2 py-1 rounded-md font-semibold transition-all ${
                        checklistFilter === "all" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      All ({result.formatting.checklist.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistFilter("issues")}
                      className={`px-2 py-1 rounded-md font-semibold transition-all ${
                        checklistFilter === "issues" ? "bg-white text-rose-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Warnings/Failures
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistFilter("passed")}
                      className={`px-2 py-1 rounded-md font-semibold transition-all ${
                        checklistFilter === "passed" ? "bg-white text-emerald-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Passed
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredChecklist.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No items matching the selected checklist filter.
                    </div>
                  ) : (
                    filteredChecklist.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex gap-4 p-4 rounded-xl border transition-all duration-200 bg-white/40 hover:bg-white/60 ${
                          item.status === "pass" 
                            ? "border-emerald-200" 
                            : item.status === "warning" 
                              ? "border-amber-200" 
                              : "border-rose-200"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {item.status === "pass" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                          {item.status === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />}
                          {item.status === "fail" && <XCircle className="w-5 h-5 text-rose-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.check}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.feedback}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYWORD MATCH & GAPS */}
          {activeTab === "keywords" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Alignment */}
                <div className="bg-white/40 p-4.5 rounded-2xl border border-slate-200/50 space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Target className="w-4 h-4" /> <span>Role Alignment</span>
                  </h4>
                  <p className="text-slate-700 text-xs leading-relaxed">{result.relevance.roleAlignment}</p>
                </div>

                {/* Gap Analysis */}
                <div className="bg-white/40 p-4.5 rounded-2xl border border-slate-200/50 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Flame className="w-4 h-4" /> <span>Gaps to Address</span>
                  </h4>
                  <p className="text-slate-700 text-xs leading-relaxed">{result.relevance.gapAnalysis}</p>
                </div>
              </div>

              {/* Missing Technical/Core Keywords */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  MISSING KEYWORDS ({result.relevance.missingKeywords.length})
                </h4>
                {result.relevance.missingKeywords.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium">Outstanding! You matched all major technical concepts found in the Job description.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.relevance.missingKeywords.map((word, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 bg-rose-500/10 text-rose-700 text-[10px] font-extrabold rounded-full border border-rose-500/20 uppercase tracking-wide"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching Technical/Core Keywords */}
              <div className="space-y-3 pt-2 border-t border-white/40">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  MATCHED KEYWORDS ({result.relevance.matchingKeywords.length})
                </h4>
                {result.relevance.matchingKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500">None detected. Paste standard skill words or target credentials into your resume text.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.relevance.matchingKeywords.map((word, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 bg-indigo-500/10 text-indigo-700 text-[10px] font-extrabold rounded-full border border-indigo-500/20 uppercase tracking-wide"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI BULLET REDESIGNS */}
          {activeTab === "bullets" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-900/5 border border-indigo-500/20 p-4.5 rounded-2xl flex items-start gap-3.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-700 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider font-mono">Bullet Optimizer Engine</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    We extracted standard, non-quantified statements from your resume. Below are high-impact alternative rephrasings employing the <strong>XYZ impact formula</strong>. Click any card to load it in the sandbox to further customize it.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {result.content.detailedBulletAnalysis.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white/40 border border-slate-200/50 rounded-2xl p-5 hover:border-indigo-400/50 hover:bg-white/75 transition-all duration-200 flex flex-col space-y-3.5 relative"
                  >
                    <div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md uppercase">
                        Original Sub-optimal Bullet
                      </span>
                      <p className="text-xs italic text-slate-500 mt-1.5 leading-relaxed bg-slate-100/50 p-2 rounded-lg font-mono">
                        "{item.original}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase">
                        AI Recommended Re-engineered Bullet
                      </span>
                      <p className="text-xs text-slate-800 font-semibold mt-1.5 leading-relaxed bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                        {item.dynamicSuggestion}
                      </p>
                    </div>

                    <div className="text-xs text-slate-600 bg-indigo-500/5 p-2.5 rounded-lg">
                      <span className="font-bold text-[10px] text-indigo-700 uppercase block font-mono">Why this is better</span>
                      {item.explanation}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => onLoadToSandbox(item.original)}
                        className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        <span>Send to Sandbox</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopyText(item.dynamicSuggestion, item.id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900 shadow-3xs"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Bullet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STEP-BY-STEP ACTIONS */}
          {activeTab === "checklist" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Strategic Checklist</h4>
                  <p className="text-xs text-slate-500">Check off items as you refine your resume.</p>
                </div>
                
                {/* Stats */}
                <div className="text-xs bg-slate-100 px-3 py-1 rounded-lg border text-slate-700 font-semibold font-mono">
                  {Object.values(completedActions).filter(Boolean).length} / {result.actionItems.length} Resolved
                </div>
              </div>

              <div className="space-y-3.5">
                {result.actionItems.map((item) => {
                  const isDone = completedActions[item.id] || false;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                        isDone 
                          ? "bg-slate-100/60 border-slate-200 opacity-60 line-through" 
                          : "bg-white/40 border-slate-200/80 hover:bg-white/60"
                      }`}
                    >
                      <button 
                        type="button"
                        onClick={() => toggleAction(item.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isDone 
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "border-slate-300 hover:border-indigo-400 bg-white"
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{item.task}</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase font-mono tracking-wider ${
                            item.priority === "high" 
                              ? "bg-rose-100 text-rose-700 border border-rose-200" 
                              : item.priority === "medium"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {item.priority} priority
                          </span>
                          <span className="text-[8px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-md uppercase font-mono">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">{item.advice}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
