import React, { useState } from "react";
import { Sparkles, Copy, Check, RefreshCw, Send, HelpCircle, FileText, ChevronRight } from "lucide-react";
import { PolishResponse } from "../types";

const SAMPLE_BULLETS = [
  "Responsible for writing code and fixing bugs.",
  "Worked on database queries and speeded them up.",
  "Managed a team of four developers and did sprints.",
  "Helped with customer support and improved satisfaction."
];

interface BulletPolishSandboxProps {
  initialBullet?: string;
  activeJobDescription?: string;
}

export default function BulletPolishSandbox({ initialBullet = "", activeJobDescription = "" }: BulletPolishSandboxProps) {
  const [bullet, setBullet] = useState(initialBullet);
  const [jobDescription, setJobDescription] = useState(activeJobDescription);
  const [isPolishing, setIsPolishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [polishResult, setPolishResult] = useState<PolishResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync initial bullet if user clicked to load from results
  React.useEffect(() => {
    if (initialBullet) {
      setBullet(initialBullet);
    }
  }, [initialBullet]);

  React.useEffect(() => {
    if (activeJobDescription) {
      setJobDescription(activeJobDescription);
    }
  }, [activeJobDescription]);

  const handleSelectSample = (sample: string) => {
    setBullet(sample);
    setPolishResult(null);
  };

  const handlePolish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bullet.trim()) {
      setErrorMsg("Please enter a bullet point to polish first!");
      return;
    }

    setIsPolishing(true);
    setErrorMsg(null);
    setPolishResult(null);

    try {
      const response = await fetch("/api/polish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bullet,
          jobDescription: jobDescription.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      setPolishResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to contact polishing API. Please check your network or key configuration.");
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCopyResult = () => {
    if (polishResult) {
      navigator.clipboard.writeText(polishResult.improvedBullet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="bullet-polish-sandbox" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Left Column: Input Sandbox */}
      <div className="lg:col-span-6 space-y-6">
        <div className="frosted-glass p-6 rounded-2xl border border-white/60 shadow-sm space-y-5">
          <div>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 mb-3 uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
              <span>Interactive Sandbox</span>
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">AI Bullet Polisher</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Select one of the sample sub-optimal bullets below, or paste your own plain sentence.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Test Sample Bullets
            </span>
            <div className="flex flex-col gap-2">
              {SAMPLE_BULLETS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`text-left p-3 text-xs rounded-xl border transition-all duration-200 ${
                    bullet === sample
                      ? "bg-indigo-600/5 border-indigo-500 text-slate-800 font-semibold"
                      : "bg-white/30 border-slate-200/60 text-slate-600 hover:border-slate-300 hover:bg-white/60"
                  }`}
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePolish} className="space-y-4">
            {/* Input field */}
            <div className="space-y-1.5">
              <label htmlFor="sandbox-bullet-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                ORIGINAL BULLET POINT
              </label>
              <textarea
                id="sandbox-bullet-input"
                rows={3}
                required
                value={bullet}
                onChange={(e) => setBullet(e.target.value)}
                placeholder="e.g. Worked on coding and designed multiple microservice APIs."
                className="w-full px-4 py-3 text-xs bg-white/80 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-sans resize-y shadow-2xs leading-relaxed"
              />
            </div>

            {/* Target Job description (inheritable) */}
            <div className="space-y-1.5">
              <label htmlFor="sandbox-jd-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>TARGET JOB DESCRIPTION <span className="text-slate-400 font-normal">(OPTIONAL)</span></span>
              </label>
              <textarea
                id="sandbox-jd-input"
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Include responsibilities/keywords to optimize alignment and automatically insert missing tech terms..."
                className="w-full px-4 py-3 text-xs bg-white/80 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-sans resize-y shadow-2xs leading-relaxed"
              />
            </div>

            {errorMsg && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 px-4 py-3.5 rounded-xl text-xs leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              id="polish-submit-button"
              type="submit"
              disabled={isPolishing || !bullet.trim()}
              className={`w-full py-3 px-5 rounded-xl text-white font-bold tracking-wide shadow-md transition-all duration-200 active:scale-98 flex items-center justify-center space-x-2 ${
                isPolishing || !bullet.trim()
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20"
              }`}
            >
              {isPolishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Polishing with XYZ Formula...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Polish Resume Bullet</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Polished Output View */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[420px] border border-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </div>

          <div className="space-y-5 relative">
            <h3 className="text-lg font-bold leading-tight flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>AI Suggestion Result</span>
            </h3>

            {polishResult ? (
              <div className="space-y-5 animate-fade-in">
                {/* Result Block */}
                <div className="bg-slate-800/65 rounded-2xl p-4 border border-slate-700/60 space-y-2">
                  <span className="text-[9px] font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                    High-Impact Alternative
                  </span>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed font-mono">
                    {polishResult.improvedBullet}
                  </p>
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Explanation of Improvements
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {polishResult.explanation}
                  </p>
                </div>

                {/* Keywords Incorporated */}
                {polishResult.keywordsIncorporated.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                      Keywords & Verbs Injected
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {polishResult.keywordsIncorporated.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-500/25 uppercase font-mono tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-300">Sandbox Output Awaiting</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Input an experience bullet, add a target job context, and let the AI instantly optimize your phrasing structure.
                  </p>
                </div>
              </div>
            )}
          </div>

          {polishResult && (
            <div className="mt-8 flex gap-3 relative">
              <button
                onClick={handleCopyResult}
                className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold transition hover:bg-slate-100 flex items-center justify-center space-x-1.5 shadow-sm active:scale-98"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Polished Bullet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
