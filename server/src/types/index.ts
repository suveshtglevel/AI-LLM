// ==================== Auth Types ====================

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: AuthTokens;
}

// ==================== Research Task Types ====================

export type TaskStatus = 'PENDING' | 'RESEARCHING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserRole = 'USER' | 'ADMIN';

export interface CreateTaskInput {
  topic: string;
  description?: string;
  priority?: Priority;
}

export interface TaskResponse {
  id: string;
  userId: string;
  topic: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  status?: TaskStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Agent Types ====================

export interface AgentIdentity {
  name: string;
  goal: string;
  instructions: string;
  model: string;
}

export interface AgentMemory {
  taskId: string;
  userId: string;
  conversationHistory: ConversationEntry[];
  previousResearch: string;
  importantFacts: ImportantFact[];
  learnedPatterns: LearnedPattern[];
  metadata: Record<string, unknown>;
}

export interface ConversationEntry {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ImportantFact {
  fact: string;
  source: string;
  confidence: number;
}

export interface LearnedPattern {
  pattern: string;
  evidence: string;
}

// ==================== Research Source Types ====================

export interface ResearchSource {
  taskId: string;
  url: string;
  title: string;
  content: string;
  extractedData: {
    headings: string[];
    paragraphs: string[];
    keyTerms: string[];
    links: string[];
  };
  metadata: {
    domain: string;
    author: string | null;
    publishDate: string | null;
    wordCount: number;
  };
  credibilityScore: number;
}

// ==================== Report Types ====================

export interface ReportResponse {
  id: string;
  taskId: string;
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  sources: ResearchSource[];
  createdAt: string;
}

// ==================== Tool Types ====================

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
}

// ==================== Queue Types ====================

export interface ResearchJobData {
  taskId: string;
  userId: string;
  topic: string;
  description?: string;
}
