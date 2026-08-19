export type UserRole = 'applicant' | 'hrd';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  headline?: string;
  avatar?: string;
  createdAt: string;
}

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
export type ExperienceLevel = 'Entry-Level' | 'Junior (1-2 thn)' | 'Mid-Level (3-5 thn)' | 'Senior (5+ thn)' | 'Lead / Manager';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  keySkills: string[];
  minEducation: string;
  status: 'active' | 'closed';
  createdAt: string;
  deadline?: string;
}

export type DocumentType = 'cv' | 'cover_letter' | 'certificate' | 'portfolio' | 'other';

export interface DocumentAttachment {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  extractedText: string;
  fileDataUrl?: string; // For preview if available
  uploadedAt: string;
}

export type FitLevel = 'Top Match' | 'High Match' | 'Moderate Match' | 'Low Match';
export type RecommendationDecision = 'STRONGLY_RECOMMENDED' | 'INTERVIEW' | 'CONSIDER' | 'NOT_SUITABLE';

export interface DetailedInterviewQuestion {
  question: string;
  context: string;
  targetCriteria: string;
}

export interface AiEvaluationResult {
  overallScore: number; // 0 - 100
  technicalScore: number; // 0 - 100
  experienceScore: number; // 0 - 100
  educationScore: number; // 0 - 100
  motivationScore: number; // 0 - 100
  cultureFitScore?: number; // 0 - 100
  fitLevel: FitLevel;
  executiveSummary: string;
  strengths: string[];
  gaps: string[];
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills?: string[];
  recommendation: RecommendationDecision;
  recommendationReason: string;
  suggestedInterviewQuestions: string[];
  detailedQuestions?: DetailedInterviewQuestion[];
  riskFactors?: string[];
  isRealAi?: boolean;
  modelUsed?: string;
  latencyMs?: number;
  analyzedAt: string;
}

export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobDepartment: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  appliedDate: string;
  status: ApplicationStatus;
  documents: DocumentAttachment[];
  aiEvaluation: AiEvaluationResult;
  hrNotes?: string;
}

export interface AppSettings {
  geminiApiKey: string;
  aiModel: string;
  autoScreening: boolean;
  minPassingScore: number;
}
