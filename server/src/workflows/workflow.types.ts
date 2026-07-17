export interface WorkflowStep {
  id: string;
  employeeType: string;
  title: string;
  description?: string;
  input?: Record<string, any>;
  dependsOn: string[];
  approvalRequired: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  /** If true, this step is optional — workflow continues if it fails */
  optional?: boolean;
  /** Timeout in seconds before the step is considered failed */
  timeoutSeconds?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  /** Category for grouping in dashboard */
  category: 'content' | 'media' | 'research' | 'custom';
  /** Estimated time to complete in minutes */
  estimatedDurationMinutes: number;
  /** Tags for discoverability */
  tags: string[];
  /** Ordered steps — workflow engine resolves dependencies */
  steps: WorkflowStep[];
  /** Default input template — merged with user input */
  defaultInput?: Record<string, any>;
}

export interface WorkflowExecution {
  workflowId: string;
  projectId: string;
  userId: string;
  currentStepIndex: number;
  stepStatuses: Map<string, 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval'>;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export interface WorkflowExecutionResult {
  workflowId: string;
  projectId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  status: string;
  durationMs: number;
}
