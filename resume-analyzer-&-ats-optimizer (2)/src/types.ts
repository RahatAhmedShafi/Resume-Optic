export interface ChecklistItem {
  id: string;
  check: string;
  status: 'pass' | 'warning' | 'fail';
  feedback: string;
}

export interface FormattingFeedback {
  score: number;
  checklist: ChecklistItem[];
  summary: string;
}

export interface BulletImprovement {
  id: string;
  original: string;
  dynamicSuggestion: string;
  explanation: string;
}

export interface ContentFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  detailedBulletAnalysis: BulletImprovement[];
}

export interface RelevanceFeedback {
  score: number;
  roleAlignment: string;
  matchingKeywords: string[];
  missingKeywords: string[];
  gapAnalysis: string;
}

export interface ActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  task: string;
  category: 'content' | 'formatting' | 'relevance';
  advice: string;
}

export interface AnalysisResult {
  score: number;
  formatting: FormattingFeedback;
  content: ContentFeedback;
  relevance: RelevanceFeedback;
  actionItems: ActionItem[];
  metadata: {
    jobTitle: string;
    analyzedAt: string;
  };
}

export interface PolishRequest {
  bullet: string;
  jobDescription?: string;
}

export interface PolishResponse {
  improvedBullet: string;
  explanation: string;
  keywordsIncorporated: string[];
}
