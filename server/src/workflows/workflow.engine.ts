import { logger } from '../config/logger';
import { QueueRegistry } from '../registries/queue.registry';
import { EmployeeRegistry } from '../registries/employee.registry';
import { WorkflowRegistry } from './workflow.registry';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionResult } from './workflow.types';
import { Project, ExecutionMode } from '../features/projects/project.model';
import { Task } from '../features/projects/task.model';
import { ActivityLog } from '../features/employees/employee.model';
import { Approval } from '../features/approvals/approval.model';
import { UserSettings } from '../features/settings/settings.model';
import type { ExecutionMode as SettingsExecutionMode } from '../features/settings/settings.model';

export class WorkflowEngine {
  /**
   * Execute a workflow for a given project.
   * Creates tasks for all workflow steps with dependency resolution.
   * If a step requires approval, it pauses until the user approves.
   */
  /**
   * Resolve the effective execution mode for a project:
   * - If project has an explicit mode, use it
   * - Otherwise fall back to the user's global setting
   * - Default to AUTO
   */
  static async resolveExecutionMode(userId: string, projectId?: string): Promise<'AUTO' | 'MANUAL'> {
    // Check project-level override first
    if (projectId) {
      const project = await Project.findById(projectId).exec();
      if (project?.executionMode) {
        return project.executionMode as 'AUTO' | 'MANUAL';
      }
    }

    // Fall back to global user setting
    const settings = await UserSettings.findOne({ userId }).exec();
    if (settings?.executionMode) {
      return settings.executionMode as 'AUTO' | 'MANUAL';
    }

    return 'AUTO';
  }

  static async executeWorkflow(
    workflowId: string,
    projectId: string,
    userId: string,
    userInput: Record<string, any>,
    executionMode?: 'AUTO' | 'MANUAL'
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const workflow = WorkflowRegistry.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found`);
    }

    logger.info(`[WorkflowEngine] Executing workflow: ${workflow.name}`, { projectId, userId });

    // Merge default input with user input
    const mergedInput = { ...workflow.defaultInput, ...userInput };

    // Resolve execution mode: explicit param > project setting > global setting > AUTO
    const effectiveMode = executionMode || await this.resolveExecutionMode(userId, projectId);
    logger.info(`[WorkflowEngine] Execution mode: ${effectiveMode} for project ${projectId}`);

    // Create tasks for all steps
    const createdTaskIds: string[] = [];
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      // In MANUAL mode, EVERY step requires approval (unless already explicitly set)
      // In AUTO mode, only steps with approvalRequired: true require approval
      const needsApproval = effectiveMode === 'MANUAL' ? true : step.approvalRequired;

      const task = await Task.create({
        projectId,
        userId,
        assignedEmployee: step.employeeType,
        title: step.title,
        description: step.description || '',
        input: {
          ...mergedInput,
          ...step.input,
          workflowId: workflow.id,
          workflowStep: step.id,
        },
        status: needsApproval ? 'PENDING' : this.getInitialStatus(step, workflow.steps.slice(0, i)),
        priority: 'MEDIUM',
        order: i,
        dependencies: step.dependsOn,
      });

      createdTaskIds.push(task.id.toString());

      // If step requires approval, create an approval record
      if (needsApproval) {
        await Approval.create({
          projectId,
          taskId: task.id.toString(),
          userId,
          stepId: step.id,
          employeeType: step.employeeType,
          status: 'pending',
          requestedAt: new Date(),
        });
        logger.info(`[WorkflowEngine] ${effectiveMode === 'MANUAL' ? '[MANUAL MODE]' : ''} Approval required for step: ${step.id} (${step.title})`);
      }
    }

    // Update project with task IDs
    await Project.findByIdAndUpdate(projectId, {
      $push: { tasks: { $each: createdTaskIds } },
      status: 'IN_PROGRESS',
      progress: 0,
    });

    // Queue the first ready tasks (no dependencies)
    const firstTask = await Task.findOne({ projectId, order: 0 });
    if (firstTask && firstTask.status === 'QUEUED') {
      const queue = QueueRegistry.getQueue(firstTask.assignedEmployee);
      if (queue) {
        await queue.add('task', {
          taskId: firstTask._id.toString(),
          projectId,
          userId,
          title: firstTask.title,
          description: firstTask.description,
          input: firstTask.input,
        });
        await Task.findByIdAndUpdate(firstTask._id, { status: 'QUEUED' });
      }
    }

    // Log execution start
    await ActivityLog.create({
      userId,
      projectId,
      employeeType: 'workflow',
      action: 'workflow_started',
      status: 'completed',
      duration: Date.now() - startTime,
      metadata: { workflowId, workflowName: workflow.name, stepCount: workflow.steps.length },
    });

    logger.info(`[WorkflowEngine] Workflow ${workflow.id} started with ${workflow.steps.length} steps`);

    return {
      workflowId: workflow.id,
      projectId,
      totalSteps: workflow.steps.length,
      completedSteps: 0,
      failedSteps: 0,
      status: 'running',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Handle approval for a task: if approved, queue the task.
   * If rejected, mark the task as failed.
   */
  static async handleApproval(
    taskId: string,
    projectId: string,
    approved: boolean,
    comment?: string
  ): Promise<void> {
    logger.info(`[WorkflowEngine] Approval decision for task ${taskId}: ${approved ? 'APPROVED' : 'REJECTED'}`);

    const approval = await Approval.findOne({ taskId, projectId });
    if (!approval) {
      logger.warn(`[WorkflowEngine] No approval record found for task ${taskId}`);
      return;
    }

    approval.status = approved ? 'approved' : 'rejected';
    approval.decidedAt = new Date();
    if (comment) approval.comment = comment;
    await approval.save();

    if (approved) {
      const task = await Task.findById(taskId);
      if (task) {
        const queue = QueueRegistry.getQueue(task.assignedEmployee);
        if (queue) {
          await queue.add('task', {
            taskId: task._id.toString(),
            projectId,
            userId: task.userId,
            title: task.title,
            description: task.description,
            input: task.input,
          });
          await Task.findByIdAndUpdate(task._id, { status: 'QUEUED' });
        }
      }
    } else {
      await Task.findByIdAndUpdate(taskId, { status: 'FAILED', error: 'Rejected by user' });
    }
  }

  /**
   * Get the initial status for a step based on dependency resolution.
   */
  private static getInitialStatus(step: WorkflowStep, previousSteps: WorkflowStep[]): 'PENDING' | 'QUEUED' {
    // If no dependencies, it's ready to queue
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return 'QUEUED';
    }
    return 'PENDING';
  }

  /**
   * Detect if a user's goal matches a known workflow.
   * Returns the workflow ID if matched, null otherwise.
   */
  static detectWorkflow(goal: string): string | null {
    const suggestion = WorkflowRegistry.suggestForGoal(goal);
    return suggestion?.id || null;
  }
}
