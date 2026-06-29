import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ResumeUpload from "./components/ResumeUpload";
import AnalysisResults from "./components/AnalysisResults";
import BulletPolishSandbox from "./components/BulletPolishSandbox";
import AnalysisHistory from "./components/AnalysisHistory";
import { AnalysisResult } from "./types";
import { Sparkles, Briefcase, FileText, ArrowLeft, Info, HelpCircle, History } from "lucide-react";

export default function App() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [activeReport, setActiveReport] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Passed from results tab to polish sandbox
  const [sandboxBullet, setSandboxBullet] = useState("");

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("resumate_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          // Auto-select latest report if available to make returning users feel instantly welcome
          if (parsed.length > 0) {
            setActiveReport(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to read localStorage history:", e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: AnalysisResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("resumate_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  // Run the analysis API
  const handleAnalyze = async (resumeText: string, jobDescription: string, jobTitle: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      
      // Add to beginning of history list
      const updatedHistory = [data, ...history.filter(item => item.metadata.analyzedAt !== data.metadata.analyzedAt)];
      saveHistory(updatedHistory);
      setActiveReport(data);
      setShowHistory(false);
    } catch (err: any) {
      console.error("Analyze error:", err);
      setErrorMsg(err.message || "A network error occurred. Please verify your connection or secrets.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryReport = (report: AnalysisResult) => {
    setActiveReport(report);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire analysis history? This cannot be undone.")) {
      saveHistory([]);
      setActiveReport(null);
    }
  };

  const handleReset = () => {
    setActiveReport(null);
    setErrorMsg(null);
    setSandboxBullet("");
  };

  const handleLoadToSandbox = (bulletText: string) => {
    setSandboxBullet(bulletText);
    // Smooth scroll to the sandbox section
    const element = document.getElementById("bullet-polish-sandbox");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#eef2f7]">
      
      {/* Mesh Gradient Background Decoration */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-300/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-300/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute top-[200px] right-[100px] w-[300px] h-[300px] bg-purple-300/20 rounded-full blur-[80px] pointer-events-none -z-10"></div>

      {/* Header component */}
      <Header 
        hasHistory={history.length > 0} 
        onShowHistory={() => setShowHistory(!showHistory)} 
        onReset={handleReset}
      />

      {/* Main workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 space-y-8">
        
        {/* Error Notification banner */}
        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/20 text-rose-900 px-5 py-4 rounded-2xl text-xs leading-relaxed flex items-start space-x-3.5 shadow-xs animate-slide-in">
            <Info className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="space-y-1">
              <span className="font-extrabold uppercase tracking-wider block text-rose-800">Analysis Dispatch Failed</span>
              <p className="text-slate-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Dynamic Dual-column or Full Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Optional slide-out History Sidebar panel */}
          {showHistory && (
            <div className="lg:col-span-3 h-full animate-slide-in">
              <AnalysisHistory
                history={history}
                onSelect={handleSelectHistoryReport}
                onClear={handleClearHistory}
                onClose={() => setShowHistory(false)}
                activeId={activeReport?.metadata.analyzedAt}
              />
            </div>
          )}

          {/* Core Content Area */}
          <div className={`${showHistory ? "lg:col-span-9" : "lg:col-span-12"} space-y-8`}>
            
            {!activeReport ? (
              /* No Active Report: Show Upload state */
              <ResumeUpload onAnalyze={handleAnalyze} isLoading={isLoading} />
            ) : (
              /* Active Report: Display Gorgeous Interactive Workspace */
              <div className="space-y-8 animate-fade-in">
                
                {/* Position Title Status Bar & Back Link */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/40 p-4.5 rounded-2xl border border-white/60 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleReset}
                      className="p-2.5 bg-white/60 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition duration-200 text-slate-600 hover:text-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active Profile Analysis
                      </span>
                      <h2 className="text-base font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        {activeReport.metadata.jobTitle}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs active:scale-98"
                    >
                      Analyze New Resume
                    </button>
                  </div>
                </div>

                {/* Main Split Layout: Diagnostic Results on the Left (7 columns) & Bullet Sandbox on the Right (5 columns) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                  
                  {/* Results & Detailed Tabs (70% space) */}
                  <div className="xl:col-span-8">
                    <AnalysisResults 
                      result={activeReport} 
                      onLoadToSandbox={handleLoadToSandbox}
                    />
                  </div>

                  {/* Bullet Polish Sandbox Panel (30% space) */}
                  <div className="xl:col-span-4 space-y-6">
                    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 border border-slate-800">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                      </div>
                      <h3 className="text-lg font-bold leading-tight relative">AI Suggestion Engine</h3>
                      <p className="text-xs text-slate-400 leading-relaxed relative">
                        Use our sandbox below to polish individual lines or insert missing tech tags with standard templates.
                      </p>
                      
                      {/* Interactive Widget view link */}
                      <div className="mt-2 bg-slate-800/50 rounded-xl p-3 border border-slate-700/60 relative">
                        <p className="text-[10px] italic text-slate-300">
                          {sandboxBullet ? `"${sandboxBullet}"` : '"Click Send to Sandbox on any weak bullet or paste your own phrase below."'}
                        </p>
                        {sandboxBullet && (
                          <span className="mt-2 text-[10px] text-indigo-400 font-bold uppercase block">
                            Loaded successfully! Ready to polish.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Integrated Sandbox module so they can type & see polished results immediately alongside diagnostics */}
                    <BulletPolishSandbox 
                      initialBullet={sandboxBullet}
                      activeJobDescription={activeReport.relevance.missingKeywords.join(", ")}
                    />
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* Footer Status Bar with stable status matches the design HTML */}
      <footer className="h-10 px-8 bg-white/20 backdrop-blur-md border-t border-white/40 flex items-center justify-between z-10 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
            Analysis Engines Ready
          </span>
          <span>|</span>
          <span>v2.4.0 Stable</span>
        </div>
        <div className="hidden sm:block text-indigo-600 font-bold">
          Ready for submission? Check final checklist
        </div>
      </footer>

    </div>
  );
}
