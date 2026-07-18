// ==================== API Response Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error?: { message: string; statusCode: number }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==================== Auth Types ====================

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}

// ==================== Project Types ====================

export type ProjectStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface Project {
  _id: string
  userId: string
  title: string
  goal: string
  description?: string
  workflowType: string
  status: ProjectStatus
  createdAt: string
  updatedAt?: string
}

export interface ProjectDetail extends Project {
  tasks: Task[]
  workflow?: Workflow
}

export interface CreateProjectInput {
  title: string
  goal: string
  description?: string
  workflowType?: string
}

// ==================== Task Types ====================

export type TaskStatus = 'PENDING' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface Task {
  _id: string
  projectId: string
  employeeType: string
  status: TaskStatus
  order: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

// ==================== Employee Types ====================

export type EmployeeStatus = 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE'

export interface Employee {
  type: string
  name: string
  description: string
  department: string
  status: EmployeeStatus
  skills: string[]
  tools: string[]
  provider: string
  memoryUsage: number
  currentTask?: string
  performance: {
    totalTasks: number
    completedTasks: number
    failedTasks: number
    averageExecutionTime: number
    successRate: number
  }
  capabilities?: string[]
}

export interface EmployeeDetail extends Employee {
  sessions: EmployeeSession[]
  activityLog: ActivityLog[]
}

export interface EmployeeSession {
  _id: string
  employeeType: string
  status: string
  currentTask: string | null
  startedAt: string
  lastActiveAt: string
}

export interface ActivityLog {
  _id: string
  employeeType: string
  action: string
  status: string
  duration: number
  tokensUsed: number
  cost: number
  success: boolean
  metadata: Record<string, unknown>
  createdAt: string
}

// ==================== Department Types ====================

export interface Department {
  _id: string
  name: string
  description: string
  manager: string | null
  employeeCount: number
  skills: string[]
  employeeTypes: string[]
}

export interface DepartmentDetail extends Department {
  employees: Employee[]
}

// ==================== Workflow Types ====================

export interface WorkflowStep {
  id: string
  name: string
  employeeType: string
  order: number
  requiresApproval: boolean
  dependsOn: string[]
  config?: Record<string, unknown>
}

export interface Workflow {
  id: string
  name: string
  description: string
  type: string
  steps: WorkflowStep[]
}

// ==================== Approval Types ====================

export interface Approval {
  _id: string
  projectId: string
  taskId: string
  employeeType: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  content: Record<string, unknown>
  comment?: string
  createdAt: string
}

export interface ApprovalDecision {
  approved: boolean
  comment?: string
}

// ==================== Memory Types ====================

export interface MemoryStatus {
  shortTerm: number
  longTerm: number
  learning: number
  executions: number
  histories: number
  legacy: number
}

export interface LongMemory {
  _id: string
  userId: string
  category: string
  key: string
  value: string
  source: string
  importance: number
  tags: string[]
  createdAt: string
}

export interface LearningMemory {
  _id: string
  userId: string
  employeeType: string
  pattern: string
  confidence: number
  evidence: string
  createdAt: string
}

export interface ExecutionLog {
  _id: string
  userId: string
  employeeType: string
  taskId: string
  projectId: string
  action: string
  duration: number
  tokensUsed: number
  cost: number
  success: boolean
  error: string | null
  createdAt: string
}

export interface ProjectHistory {
  _id: string
  projectId: string
  eventType: string
  title: string
  description: string
  importance: string
  timestamp: string
}

// ==================== Project Output Types ====================

export interface OutputDocument {
  _id: string
  projectId: string
  taskId: string
  employeeType: string
  content: string
  format: string
  metadata: Record<string, unknown>
  version: number
  createdAt: string
  updatedAt?: string
}

export interface TaskWithOutput {
  _id: string
  assignedEmployee: string
  title: string
  description: string
  status: string
  order: number
  input?: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  startedAt?: string
  completedAt?: string
  createdAt: string
  documents: OutputDocument[]
}

export interface ProjectOutput {
  project: {
    _id: string
    title: string
    goal: string
    status: string
    progress: number
    workflowType: string | null
    createdAt: string
  }
  tasks: TaskWithOutput[]
  documents: OutputDocument[]
  knowledge: unknown[]
  summary: {
    totalTasks: number
    completedTasks: number
    failedTasks: number
    inProgressTasks: number
    totalDocuments: number
    hasOutput: boolean
  }
}

export interface TaskOutputDetail {
  task: TaskWithOutput
  documents: OutputDocument[]
  output: Record<string, unknown> | null
  hasContent: boolean
}

// ==================== Execution Mode Types ====================

export type ExecutionMode = 'AUTO' | 'MANUAL'

export interface ExecutionModeSettings {
  executionMode: ExecutionMode
}

// ==================== Scheduler Types ====================

export interface ScheduledJob {
  _id: string
  userId: string
  name: string
  description: string
  workflowId: string
  input: Record<string, unknown>
  cronExpression: string
  scheduleDescription: string
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
}

export interface CreateSchedulerInput {
  name: string
  description: string
  workflowId: string
  input: Record<string, unknown>
  cronExpression: string
  scheduleDescription: string
}

// ==================== Analytics Types ====================

export interface AnalyticsSummary {
  totalExecutions: number
  averageDuration: number
  totalCost: number
  totalTokens: number
  successRate: number
  failureRate: number
}

export interface EmployeePerformance extends Record<string, unknown> {
  employeeType: string
  executionCount: number
  averageDuration: number
  successRate: number
  totalCost: number
}

export interface CostTrend extends Record<string, unknown> {
  date: string
  cost: number
  tokens: number
}

export interface PerformanceTrend extends Record<string, unknown> {
  date: string
  averageDuration: number
  successRate: number
  executionCount: number
}

// ==================== System Types ====================

export interface SystemStatus {
  employees: number
  tools: number
  providers: number
  queues: number
  workflows: number
  departments: number
  projects?: number
  health: {
    database: string
    redis: string
    workers: string
  }
}

export interface Provider {
  name: string
  displayName: string
  isConfigured: boolean
  healthy: boolean
  latencyMs: number
}

export interface ProvidersResponse {
  providers: Provider[]
  total: number
}

export interface Tool {
  name: string
  description: string
  category: string
  status: 'active' | 'inactive' | 'error'
  requests: number
  averageTime: number
  errors: number
}

// ==================== Inspector Types ====================

export interface InspectorSnapshot {
  employeeType: string
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE'
  currentTask: string | null
  currentTaskId: string | null
  currentProjectId: string | null
  currentGoal: string | null
  currentReasoning: string | null
  currentWorkflow: string | null
  currentStep: string | null
  currentQueue: string | null
  currentProvider: string | null
  currentModel: string | null
  toolsUsed: string[]
  promptVersion: string | null
  tokensUsed: number
  estimatedCost: number
  executionTime: number
  retryCount: number
  memoryUsage: number
  filesGenerated: string[]
  latestOutput: Record<string, unknown> | null
  latestError: string | null
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
  lastExecution: string | null
  nextPlannedAction: string | null
  timestamp: string
}

export interface InspectorLogEntry {
  _id: string
  employeeType: string
  taskId: string
  projectId: string
  status: string
  durationMs: number
  tokensUsed: number
  estimatedCostUsd: number
  error: string | null
  retryCount: number
  provider: string
  usedModel: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface InspectorHistoryEntry {
  _id: string
  employeeType: string
  taskId: string
  projectId: string
  status: string
  result: Record<string, unknown> | null
  error: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
}

export interface InspectorPerformance {
  summary: {
    totalExecutions: number
    completed: number
    failed: number
    successRate: number
    totalTokens: number
    totalCost: number
    averageDuration: number
    averageTokens: number
    averageCost: number
  }
  executionTrend: Array<{
    date: string
    count: number
    success: number
    failed: number
    avgDuration: number
  }>
  costTrend: Array<{ date: string; cost: number }>
  tokenTrend: Array<{ date: string; tokens: number }>
  statusDistribution: Array<{ name: string; value: number; color: string }>
  recentActivity: Array<{
    _id: string
    taskId: string
    status: string
    duration: number
    tokens: number
    cost: number
    error: string | null
    createdAt: string
  }>
}

// ==================== Provider Config Types ====================

export interface ApiKeyEntry {
  _id?: string
  key: string
  isActive: boolean
  lastUsed: string | null
  failureCount: number
}

export interface ProviderConfig {
  _id: string
  name: string
  displayName: string
  providerType: string
  apiKeys: ApiKeyEntry[]
  baseUrl: string
  models: string[]
  defaultModel: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProviderInput {
  name: string
  displayName: string
  providerType: string
  apiKeys: { key: string; isActive?: boolean }[]
  baseUrl: string
  models?: string[]
  defaultModel?: string
  isEnabled?: boolean
}

export interface UpdateProviderInput {
  displayName?: string
  providerType?: string
  apiKeys?: { key: string; isActive?: boolean }[]
  baseUrl?: string
  models?: string[]
  defaultModel?: string
  isEnabled?: boolean
}

// ==================== Queue Types ====================

export interface QueueStatus {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  isPaused: boolean
}

// ==================== Notification Types ====================

export interface Notification {
  id: string
  type: 'workflow_completed' | 'employee_failed' | 'queue_failed' | 'project_created' | 'provider_offline' | 'approval_needed'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}
