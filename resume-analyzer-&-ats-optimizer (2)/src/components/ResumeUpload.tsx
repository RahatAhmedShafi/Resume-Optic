import React, { useState, useRef } from "react";
import { Upload, Briefcase, FileText, Clipboard, Sparkles, Check, Info } from "lucide-react";

// Predefined job templates to make testing the app incredibly easy and fun!
const JOB_TEMPLATES = [
  {
    title: "Software Engineer",
    description: "We are seeking a senior-level Software Engineer to build scale-critical web architectures. Requirements include: \n- 5+ years of experience with React, TypeScript, and Node.js.\n- Strong expertise in SQL database design, PostgreSQL, or MongoDB.\n- Experience deploying applications to cloud services (AWS, GCP, or Azure).\n- Familiarity with CI/CD pipelines, Docker, and Kubernetes.\n- Proven track record of optimizing application rendering speed, backend queries, and caching strategies."
  },
  {
    title: "Product Manager",
    description: "Looking for an energetic Product Manager to drive next-generation user experiences. Requirements:\n- 3+ years managing SaaS or mobile app products.\n- Strong expertise in product discovery, writing PRDs, and defining success metrics (KPIs, OKRs).\n- Deep user empathy and experience conducting user research and A/B testing.\n- Outstanding cross-functional collaboration with engineering, design, and marketing teams.\n- Experience using analytics tools like Mixpanel, Amplitude, or Google Analytics."
  },
  {
    title: "Data Scientist",
    description: "Join our core data team as a Data Scientist. Essential requirements:\n- Proficient in Python, SQL, and data analysis packages (Pandas, NumPy, Scikit-Learn).\n- Solid understanding of machine learning algorithms (regression, classification, clustering, NLP).\n- Experience with data visualization libraries (Matplotlib, Seaborn, Tableau) to present insights.\n- Expertise in designing and executing A/B tests and statistical hypothesis testing.\n- Strong communication skills to present analytical findings to non-technical business leaders."
  },
  {
    title: "Digital Marketer",
    description: "We are hiring a Growth Marketer to lead acquisition channels. What we look for:\n- Hands-on experience managing paid social campaigns (Meta, Google Ads, LinkedIn).\n- Strong copywriting skills and creative campaign design capabilities.\n- Expertise in SEO keyword research, on-page optimization, and analytics tracking.\n- Experience managing email marketing programs and setting up marketing automation drips.\n- Highly analytical mindset with ability to parse CAC, LTV, ROAS, and conversion rate metrics."
  }
];

interface ResumeUploadProps {
  onAnalyze: (resumeText: string, jobDescription: string, jobTitle: string) => void;
  isLoading: boolean;
}

export default function ResumeUpload({ onAnalyze, isLoading }: ResumeUploadProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply template
  const handleSelectTemplate = (template: typeof JOB_TEMPLATES[0]) => {
    setJobTitle(template.title);
    setJobDescription(template.description);
  };

  // Process File text read
  const processFile = async (file: File) => {
    setUploadError(null);
    setSuccessMsg(null);

    const fileType = file.name.split(".").pop()?.toLowerCase();
    
    if (!fileType) {
      setUploadError("Unable to determine file type.");
      return;
    }

    const textFiles = ["txt", "md", "json"];
    const parseableFiles = ["pdf", "docx"];

    if (!textFiles.includes(fileType) && !parseableFiles.includes(fileType)) {
      setUploadError(
        `Unsupported file type .${fileType}. Please upload a .pdf, .docx, .txt, or .md file!`
      );
      return;
    }

    // Direct browser-side parsing for simple text-based files
    if (textFiles.includes(fileType)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setResumeText(text);
          setSuccessMsg(`"${file.name}" uploaded and parsed successfully!`);
        } else {
          setUploadError("Failed to read text from the file. It might be empty.");
        }
      };
      reader.onerror = () => {
        setUploadError("An error occurred while reading the file.");
      };
      reader.readAsText(file);
      return;
    }

    // Server-side parsing for PDF/DOCX
    setIsParsingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        setResumeText(data.text);
        setSuccessMsg(`"${file.name}" parsed and extracted successfully!`);
      } else {
        throw new Error("No readable text returned from the server.");
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred while parsing the document on the server. Please check the file format or try copy-pasting instead.");
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setUploadError("Please provide your resume content (either by file upload or copy-pasting).");
      return;
    }
    onAnalyze(resumeText, jobDescription, jobTitle);
  };

  return (
    <div id="resume-upload-section" className="space-y-8 animate-fade-in">
      {/* Introduction Banner - Frosted with vibrant border & background accents */}
      <div className="frosted-glass-deep rounded-3xl p-6 sm:p-8 text-slate-800 shadow-xl relative overflow-hidden border border-white/80">
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-indigo-400/25 rounded-full filter blur-3xl"></div>
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 mb-4 tracking-wider uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Suggestion Engine v2.4</span>
          </span>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight mb-2 text-slate-900 leading-tight">
            How ATS-compatible is your Resume?
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Upload your resume text, customize target job descriptions, and see instant diagnostic feedback on content quality, missing technical keywords, role alignment, and custom formatting checklists.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Job Description and Templates */}
        <div className="lg:col-span-5 space-y-6">
          <div className="frosted-glass p-6 rounded-2xl shadow-sm space-y-5 border border-white/60">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Target Job</span>
              </h2>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {JOB_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`text-left p-3 text-xs rounded-xl border transition-all duration-200 ${
                      jobTitle === tpl.title
                        ? "bg-white/90 border-indigo-500 text-indigo-700 font-bold shadow-xs scale-102"
                        : "border-slate-200 bg-white/40 text-slate-600 hover:border-slate-300 hover:bg-white/80"
                    }`}
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-white/40" />

            {/* Job Title Input */}
            <div className="space-y-1.5">
              <label htmlFor="job-title-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                POSITION TITLE
              </label>
              <input
                id="job-title-input"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-4 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-2xs"
              />
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="job-description-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                JOB DESCRIPTION
              </label>
              <textarea
                id="job-description-input"
                rows={9}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="We are looking for a React expert with 5+ years of experience. Must be proficient in Tailwind CSS, TypeScript, and state management..."
                className="w-full px-4 py-3 text-xs bg-white/80 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-sans resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Resume Upload & Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="frosted-glass p-6 rounded-2xl shadow-sm space-y-5 border border-white/60">
            <h2 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Resume Content</span>
            </h2>

            {/* File Drag & Drop */}
            <div
              id="file-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isParsingFile && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                isParsingFile ? "cursor-wait border-indigo-300 bg-white/40" : "cursor-pointer"
              } ${
                isDragOver
                  ? "border-indigo-500 bg-white/80"
                  : "border-slate-300/80 bg-white/30 hover:border-indigo-400 hover:bg-white/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.pdf,.docx"
                disabled={isParsingFile}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-full border ${
                  isParsingFile 
                    ? "bg-indigo-500/15 text-indigo-600 border-indigo-500/30 animate-pulse" 
                    : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                }`}>
                  {isParsingFile ? (
                    <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    {isParsingFile ? "Extracting text from file..." : "Upload Resume File"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {isParsingFile 
                      ? "This takes a brief moment for document reading..." 
                      : "Drag & drop or browse (.pdf, .docx, .txt, .md)"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Error & Success Messages */}
            {uploadError && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 px-4 py-3.5 rounded-xl text-xs leading-relaxed flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 px-4 py-3 rounded-xl text-xs leading-relaxed flex items-center space-x-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Resume Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="resume-text-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  RESUME PLAIN TEXT
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setResumeText(text);
                        setSuccessMsg("Pasted from clipboard successfully!");
                        setUploadError(null);
                      }
                    } catch {
                      setUploadError("Unable to access clipboard. Please manually paste using Ctrl+V or Cmd+V.");
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste Clipboard</span>
                </button>
              </div>
              <textarea
                id="resume-text-input"
                rows={11}
                required
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the raw text of your resume here. Make sure it contains contact info, education, skills, and work history experience..."
                className="w-full px-4 py-3 text-xs bg-white/80 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-mono leading-relaxed resize-y shadow-2xs"
              />
            </div>

            {/* Submit Button with matching gorgeous style */}
            <button
              id="analyze-submit-button"
              type="submit"
              disabled={isLoading || !resumeText.trim()}
              className={`w-full py-3.5 px-6 rounded-xl text-white font-bold tracking-wide shadow-lg transition-all duration-200 active:scale-98 flex items-center justify-center space-x-2.5 ${
                isLoading || !resumeText.trim()
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Dissecting Resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  <span>Execute AI Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
