import { logger } from '../../config/logger';
import { Project } from '../projects/project.model';
import { Task } from '../projects/task.model';
import { ActivityLog } from '../employees/employee.model';
import { QueueRegistry } from '../../registries/queue.registry';
import { EventBus, TaskEvent } from '../../services/event-bus';
import { Approval } from '../approvals/approval.model';
import { SkillMatcher, TaskSkillRequirement } from '../../services/skill-matcher';
import { WorkflowEngine } from '../../workflows/workflow.engine';

export class Manager {
  /**
   * Process the planning output: take subtasks from the Planning Employee
   * and create+queue individual tasks for other employees.
   */
  static async processPlan(taskId: string, projectId: string, userId: string, planOutput: any): Promise<void> {
    logger.info(`[Manager] Processing plan for project ${projectId}`);

    const subtasks = planOutput.subtasks || planOutput.estimatedFlow || [];
    const useSkillRouting = planOutput.useSkillRouting === true;
    const createdTasks: string[] = [];

    for (let i = 0; i < subtasks.length; i++) {
      const sub = subtasks[i];
      const employeeType = sub.assignedEmployee || sub.employee || 'research';

      // Check dependencies are resolved
      const depIndices: number[] = sub.dependsOn || sub.dependencies || [];
      const depsResolved = depIndices.every((idx: number) => {
        const depTaskId = createdTasks[idx];
        return depTaskId !== undefined;
      });

      let assignedEmployee = employeeType;

      // Use skill-based routing if enabled
      if (useSkillRouting) {
        const requiredSkills = sub.requiredSkills || sub.skills || [];
        const skillReq: TaskSkillRequirement = {
          preferredType: employeeType,
          requiredSkills: requiredSkills.length > 0 ? requiredSkills : [employeeType],
          department: sub.department,
        };

        const result = await SkillMatcher.assignTask(projectId, userId, skillReq);
        assignedEmployee = result.employeeType;
      }

      const task = await Task.create({
        projectId,
        userId,
        assignedEmployee,
        title: sub.task || sub.title || `Task ${i + 1}`,
        description: sub.description || '',
        input: { ...sub, goal: planOutput.goal },
        status: 'QUEUED',
        priority: sub.priority || 'MEDIUM',
        order: i,
        dependencies: depIndices.map((idx: number) => createdTasks[idx]).filter(Boolean),
      });

      createdTasks.push(task.id.toString());

      // Queue the task for the employee
      const queue = QueueRegistry.getQueue(assignedEmployee);
      if (queue) {
        await queue.add('task', {
          taskId: task.id.toString(),
          projectId,
          userId,
          title: task.title,
          description: task.description,
          input: task.input,
        });

        await Task.findByIdAndUpdate(task._id, { status: 'QUEUED' });
        logger.info(`[Manager] Queued ${assignedEmployee} task: ${task._id}`);
      } else {
        logger.warn(`[Manager] No queue for employee type: ${assignedEmployee}`);
      }
    }

    // Update project with all task IDs
    await Project.findByIdAndUpdate(projectId, { $push: { tasks: { $each: createdTasks } }, progress: 10 });

    await ActivityLog.create({
      userId,
      projectId,
      employeeType: 'manager',
      action: 'plan_processed',
      status: 'completed',
      duration: 0,
      metadata: { taskCount: createdTasks.length, taskIds: createdTasks },
    });
  }

  /**
   * Handle task completion: update dependencies, queue next tasks, check project completion.
   * @param taskOutput - Optional output from the employee execution to store on the task
   */
  static async onTaskCompleted(taskId: string, projectId: string, taskOutput?: Record<string, any> | null): Promise<void> {
    logger.info(`[Manager] Task completed: ${taskId} in project ${projectId}`);

    // Get the task for metadata
    const completedTask = await Task.findById(taskId);
    const employeeType = completedTask?.assignedEmployee || 'unknown';
    const userId = completedTask?.userId || 'unknown';

    // Update the task — save output so it's retrievable via the output API
    const updateFields: any = { status: 'COMPLETED', completedAt: new Date() };
    if (taskOutput) {
      updateFields.output = taskOutput;
    }
    await Task.findByIdAndUpdate(taskId, updateFields);

    // Publish event
    await EventBus.publish(TaskEvent.TASK_COMPLETED, {
      taskId,
      projectId,
      userId,
      employeeType,
      metadata: completedTask ? { title: completedTask.title } : undefined,
    });

    // Advance the workflow: queue any tasks whose dependencies are now satisfied.
    await Manager.queueReadyTasks(projectId);
  }

  /**
   * A task is "settled" for dependency/completion purposes when it has completed,
   * or when it is optional and failed (optional failures do not block the workflow).
   */
  private static isSettled(status: string, optional: boolean): boolean {
    return status === 'COMPLETED' || (optional && status === 'FAILED');
  }

  /**
   * Queue every PENDING/QUEUED task whose dependencies are all settled, honoring
   * execution mode and approval gates, then update project progress/completion.
   * Safe to call after any task completes or after an optional task fails.
   */
  private static async queueReadyTasks(projectId: string): Promise<void> {
    const allProjectTasks = await Task.find({ projectId }).sort({ order: 1 }).exec();
    if (allProjectTasks.length === 0) return;

    const userId = allProjectTasks.find(t => t.userId)?.userId || 'unknown';
    const settledCount = allProjectTasks.filter(t => Manager.isSettled(t.status, t.optional)).length;

    // Resolve execution mode for this project
    const executionMode = await WorkflowEngine.resolveExecutionMode(userId, projectId);

    for (const task of allProjectTasks) {
      if (task.status !== 'QUEUED' && task.status !== 'PENDING') continue;

      // Check if approval is required and still pending
      if (task.status === 'PENDING') {
        const pendingApproval = await Approval.findOne({
          taskId: task._id.toString(),
          status: 'pending',
        }).exec();

        if (pendingApproval) {
          // Skip this task — waiting for user approval
          logger.debug(`[Manager] Task ${task._id} waiting for approval`);
          continue;
        }
      }

      // Check all dependencies are settled (completed, or optional-and-failed)
      const depsMet = task.dependencies.every(depId => {
        const depTask = allProjectTasks.find(t => t.id === depId || t._id.toString() === depId);
        return depTask && Manager.isSettled(depTask.status, depTask.optional);
      });

      if (depsMet) {
        // In MANUAL mode, create approval record for each task before queuing
        if (executionMode === 'MANUAL') {
          // Check if approval already exists
          const existingApproval = await Approval.findOne({
            taskId: task._id.toString(),
            status: 'pending',
          }).exec();

          if (!existingApproval) {
            // Create approval and keep task as PENDING — wait for user
            await Approval.create({
              projectId,
              taskId: task._id.toString(),
              userId: task.userId,
              stepId: task.assignedEmployee,
              employeeType: task.assignedEmployee,
              status: 'pending',
              requestedAt: new Date(),
            });

            logger.info(`[Manager] [MANUAL MODE] Created approval for task: ${task._id} (${task.assignedEmployee})`);

            await EventBus.publish(TaskEvent.TASK_APPROVAL_REQUIRED, {
              taskId: task._id.toString(),
              projectId,
              userId: task.userId,
              employeeType: task.assignedEmployee,
              metadata: { title: task.title, executionMode: 'MANUAL' },
            });

            continue; // Wait for approval
          }
        }

        // AUTO mode or approval already handled — queue the task
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
    }

    // Check if project is complete — all tasks settled (completed, or optional-and-failed)
    const total = allProjectTasks.length;
    const progress = total > 0 ? Math.round((settledCount / total) * 100) : 100;
    const isComplete = settledCount === total;

    await Project.findByIdAndUpdate(projectId, {
      progress,
      ...(isComplete ? { status: 'COMPLETED' } : {}),
    });

    if (isComplete) {
      await EventBus.publish(TaskEvent.WORKFLOW_COMPLETED, {
        taskId: projectId,
        projectId,
        userId,
        employeeType: 'manager',
        metadata: { totalTasks: total, completedTasks: settledCount },
      });
      logger.info(`[Manager] Project ${projectId} completed!`);
    }
  }

  /**
   * Handle task failure: mark project as failed if critical.
   */
  static async onTaskFailed(taskId: string, projectId: string, error: string): Promise<void> {
    logger.error(`[Manager] Task failed: ${taskId} in project ${projectId}: ${error}`);

    const task = await Task.findById(taskId);
    const employeeType = task?.assignedEmployee || 'unknown';
    const userId = task?.userId || 'unknown';

    await Task.findByIdAndUpdate(taskId, { status: 'FAILED', error });

    // Publish event
    await EventBus.publish(TaskEvent.TASK_FAILED, {
      taskId,
      projectId,
      userId,
      employeeType,
      metadata: { error },
    });

    // Optional steps don't block the workflow or fail the project — advance dependents and stop.
    if (task?.optional) {
      logger.info(`[Manager] Optional task ${taskId} failed — continuing workflow`);
      await Manager.queueReadyTasks(projectId);
      return;
    }

    const project = await Project.findById(projectId);
    if (project) {
      // Only required (non-optional) failures count toward failing the project
      const failedTasks = await Task.countDocuments({ projectId, status: 'FAILED', optional: { $ne: true } }).exec();
      if (failedTasks >= 2) {
        await Project.findByIdAndUpdate(projectId, { status: 'FAILED' });
        await EventBus.publish(TaskEvent.WORKFLOW_FAILED, {
          taskId: projectId,
          projectId,
          userId,
          employeeType: 'manager',
          metadata: { failedCount: failedTasks, error },
        });
        logger.warn(`[Manager] Project ${projectId} failed due to multiple task failures`);
      }
    }
  }
}
