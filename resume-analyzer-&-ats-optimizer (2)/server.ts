import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Parse large payloads (resumes can be large text files or detailed inputs)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Shared Gemini Client Helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add your key in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Endpoint: Analyze Resume
app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription, jobTitle } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required for analysis." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an elite corporate Recruiter, ATS (Applicant Tracking System) Expert, and professional Resume Writer.
Analyze the provided resume text and job description thoroughly. 
Be rigorous, objective, and extremely helpful. Focus on providing actionable recommendations.
If no job description is provided, analyze the resume against industry standards for the specified Job Title ("${jobTitle || "General Career"}").
If a job description is provided, perform deep comparison to find missing skills, keywords, and qualifications.

When analyzing:
- Overall Score: Calculate a realistic ATS compatibility score out of 100 based on keyword alignment, content impact (quantifiable metrics, action verbs), and formatting structure.
- Formatting: Evaluate structure, layout flow, section labeling, and check completeness.
- Content: Examine work experience bullets. Identify weak areas (e.g. passive language, lack of metrics) and write highly customized, rephrased alternatives.
- Relevance: Find specific keywords from the Job Description that are present vs missing. Detail gaps.
- Action Items: Provide concrete, categorized, prioritized steps.

Return the results matching the specified JSON schema structure.`;

    const prompt = `
=== JOB TITLE ===
${jobTitle || "Not specified (General Analysis)"}

=== JOB DESCRIPTION ===
${jobDescription || "Not provided (Analyze against general standard formats and roles)"}

=== RESUME TEXT ===
${resumeText}
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        score: { 
          type: Type.INTEGER, 
          description: "Overall ATS compatibility score from 0 to 100. Lower it if there is a poor match with JD." 
        },
        formatting: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Formatting & structure score from 0 to 100." },
            checklist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A simple unique slug, e.g. 'contact-info', 'skills-sec'" },
                  check: { type: Type.STRING, description: "What was checked (e.g., 'Contact Information completeness', 'Education placement')" },
                  status: { type: Type.STRING, description: "Must be either 'pass', 'warning', or 'fail'" },
                  feedback: { type: Type.STRING, description: "Detailed feedback on this check." }
                },
                required: ["id", "check", "status", "feedback"]
              }
            },
            summary: { type: Type.STRING, description: "A high-level diagnostic summary of formatting." }
          },
          required: ["score", "checklist", "summary"]
        },
        content: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Content quality, clarity, and impact score from 0 to 100." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific aspects where the resume shines (e.g. quantifiable wins, clear leadership)." },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Weak areas (e.g. vague descriptions, overused buzzwords)." },
            detailedBulletAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A simple slug like 'bullet-1'" },
                  original: { type: Type.STRING, description: "Extract a specific sub-optimal or average bullet/line from the resume." },
                  dynamicSuggestion: { type: Type.STRING, description: "A fully re-engineered bullet that maximizes impact, uses strong action verbs, and embeds realistic quantifiable context tailored to the target role." },
                  explanation: { type: Type.STRING, description: "Briefly explain why this replacement is better (e.g. added action verbs, highlighted metrics)." }
                },
                required: ["id", "original", "dynamicSuggestion", "explanation"]
              },
              description: "Suggest improvements for 3-5 weak bullets found in the resume."
            }
          },
          required: ["score", "strengths", "weaknesses", "detailedBulletAnalysis"]
        },
        relevance: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Alignment with job description from 0 to 100." },
            roleAlignment: { type: Type.STRING, description: "How well the resume fits the target role name, levels, or core themes." },
            matchingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords/skills from the JD that are already successfully in the resume." },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important technical or soft-skill keywords from the JD that are completely missing." },
            gapAnalysis: { type: Type.STRING, description: "Clear explanation of gaps between the resume and the job requirements." }
          },
          required: ["score", "roleAlignment", "matchingKeywords", "missingKeywords", "gapAnalysis"]
        },
        actionItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique slug" },
              priority: { type: Type.STRING, description: "Must be either 'high', 'medium', or 'low'" },
              task: { type: Type.STRING, description: "Clear, short title of the action item (e.g. 'Integrate Cloud Architecture keywords')" },
              category: { type: Type.STRING, description: "Must be either 'content', 'formatting', or 'relevance'" },
              advice: { type: Type.STRING, description: "Specific instruction on how to complete this action item." }
            },
            required: ["id", "priority", "task", "category", "advice"]
          },
          description: "A prioritized to-do list for the job seeker to maximize their chances."
        }
      },
      required: ["score", "formatting", "content", "relevance", "actionItems"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      throw new Error("No analysis returned from Gemini API.");
    }

    const result = JSON.parse(response.text.trim());
    // Attach metadata
    result.metadata = {
      jobTitle: jobTitle || "General Career",
      analyzedAt: new Date().toISOString()
    };

    res.json(result);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during resume analysis." });
  }
});

// 2. Endpoint: Bullet Polish
app.post("/api/polish", async (req, res) => {
  try {
    const { bullet, jobDescription } = req.body;

    if (!bullet) {
      return res.status(400).json({ error: "Bullet text is required to polish." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a professional resume writer.
The user wants to polish a single resume bullet point or experience sentence to make it sound incredibly professional, impactful, and tailored.
If a job description is provided, align the polished bullet to hit key keywords and values of that job description.
Use the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]" or other high-impact action-oriented formats.
Always provide:
1. The improved, high-octane bullet.
2. A short explanation of the changes and what improvements were introduced.
3. List of keywords or dynamic concepts incorporated.`;

    const prompt = `
=== ORIGINAL BULLET ===
${bullet}

=== TARGET JOB DESCRIPTION (OPTIONAL) ===
${jobDescription || "Not provided"}
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        improvedBullet: { type: Type.STRING, description: "The polished, highly professional resume bullet point." },
        explanation: { type: Type.STRING, description: "Brief explanation of the improvements." },
        keywordsIncorporated: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific keywords or action verbs incorporated." }
      },
      required: ["improvedBullet", "explanation", "keywordsIncorporated"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
      },
    });

    if (!response.text) {
      throw new Error("No response from polishing API.");
    }

    const result = JSON.parse(response.text.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Polishing Error:", error);
    res.status(500).json({ error: error.message || "An error occurred while polishing the bullet." });
  }
});

// Configure multer storage for file parsing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Endpoint: Parse File (PDF, DOCX, TXT, MD)
app.post("/api/parse-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const buffer = req.file.buffer;
    const originalName = req.file.originalname;
    const fileExtension = originalName.split(".").pop()?.toLowerCase();

    let text = "";

    if (fileExtension === "pdf") {
      try {
        const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
        const parsed = await pdfParser.getText();
        text = parsed.text;
      } catch (pdfErr: any) {
        console.error("PDF Parsing Error:", pdfErr);
        return res.status(422).json({ error: "Failed to parse PDF file. Ensure it is not password-protected or corrupted." });
      }
    } else if (fileExtension === "docx") {
      try {
        const parsed = await mammoth.extractRawText({ buffer });
        text = parsed.value;
      } catch (docxErr: any) {
        console.error("DOCX Parsing Error:", docxErr);
        return res.status(422).json({ error: "Failed to parse Word (.docx) file. Ensure it is not corrupted." });
      }
    } else if (fileExtension === "txt" || fileExtension === "md") {
      text = buffer.toString("utf-8");
    } else {
      return res.status(400).json({
        error: `Unsupported file type: .${fileExtension}. Please upload a .pdf, .docx, .txt, or .md file.`,
      });
    }

    if (!text || !text.trim()) {
      return res.status(422).json({
        error: "No readable text could be extracted from this file. If this is a scanned document/image PDF, please copy and paste the text manually.",
      });
    }

    res.json({ text: text.trim() });
  } catch (error: any) {
    console.error("File parsing error:", error);
    res.status(500).json({ error: `An internal server error occurred while parsing the file: ${error.message}` });
  }
});

// 3. Vite Middleware and Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
