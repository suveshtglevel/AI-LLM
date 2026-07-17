import { logger } from '../../config/logger';
import { aiService } from '../../services/ai/ai.service';
import { Project } from '../projects/project.model';
import { Task } from '../projects/task.model';
import { WorkflowRegistry } from '../../workflows/workflow.registry';
import { WorkflowEngine } from '../../workflows/workflow.engine';
import { EventBus, TaskEvent } from '../../services/event-bus';

export class CEO {
  /**
   * The CEO never performs work directly.
   * It receives user goals, analyzes them, and delegates to the Manager.
   */
  static async delegateGoal(
    userId: string,
    title: string,
    goal: string,
    description?: string,
    workflowType?: string
  ): Promise<{ project: any; tasks: any[]; workflow?: any }> {
    logger.info(`[CEO] Received goal: "${goal}" from user ${userId}`);

    // 1. Create the project
    const project = await Project.create({
      userId,
      title,
      description: description || '',
      goal,
      status: 'PENDING',
      progress: 0,
    });

    // 2. Check if a predefined workflow matches
    const workflowId = workflowType || WorkflowEngine.detectWorkflow(goal);

    if (workflowId && WorkflowRegistry.get(workflowId)) {
      // Use workflow engine — predefined steps
      logger.info(`[CEO] Using workflow: ${workflowId} for goal: "${goal}"`);

      const result = await WorkflowEngine.executeWorkflow(workflowId, project.id.toString(), userId, {
        goal,
        title,
        description: description || '',
      });

      project.assignedManager = 'manager';
      project.status = 'IN_PROGRESS';
      project.metadata = { workflowId };
      await project.save();

      await EventBus.publish(TaskEvent.WORKFLOW_STARTED, {
        taskId: project.id.toString(),
        projectId: project.id.toString(),
        userId,
        employeeType: 'workflow',
        metadata: { workflowId, totalSteps: result.totalSteps },
      });

      logger.info(`[CEO] Workflow ${workflowId} started. Project: ${project._id}`);

      return {
        project: project.toJSON(),
        tasks: [],
        workflow: result,
      };
    }

    // 3. Fallback to Planning Employee (existing flow)
    // Create the initial planning task
    const planningTask = await Task.create({
      projectId: project.id.toString(),
      userId,
      assignedEmployee: 'planning',
      title: `Plan: ${title}`,
      description: `Break down the goal into subtasks: ${goal}`,
      input: { goal, description },
      status: 'PENDING',
      priority: 'HIGH',
      order: 0,
    });

    project.tasks = [planningTask.id.toString()];
    project.assignedManager = 'manager';
    project.status = 'IN_PROGRESS';
    await project.save();

    logger.info(`[CEO] Delegated to Manager. Project: ${project._id}, Planning task: ${planningTask._id}`);

    return {
      project: project.toJSON(),
      tasks: [planningTask.toJSON()],
    };
  }

  static async getProjectStatus(projectId: string, userId: string): Promise<any> {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new Error('Project not found');
    }

    const tasks = await Task.find({ projectId }).sort({ order: 1 }).exec();

    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const failed = tasks.filter(t => t.status === 'FAILED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pending = tasks.filter(t => t.status === 'PENDING' || t.status === 'QUEUED').length;

    return {
      project,
      tasks: tasks.map(t => t.toJSON()),
      summary: {
        total: tasks.length,
        completed,
        failed,
        inProgress,
        pending,
        progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      },
    };
  }
}
