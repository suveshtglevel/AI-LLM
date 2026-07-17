import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class PlanningEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'planning',
      name: 'Planning Employee',
      role: 'Project Planning Specialist',
      goal: 'Understand user goals, break into manageable subtasks, estimate execution flow',
      instructions: 'Break down complex goals into clear, actionable subtasks with dependencies and priority ordering',
      allowedTools: ['analysis'],
      promptTemplate: 'Create a detailed execution plan for the following goal',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const goal = task.input.goal || task.title;
    const description = task.input.description || task.description;

    const planPrompt = `Goal: ${goal}
Description: ${description}

Break this goal into a detailed execution plan. For each subtask specify:
1. Task title
2. Which employee type should handle it (research, writer, reviewer, voice, image, video, editor, publisher, analytics)
3. Dependencies on other subtasks (by index)
4. Estimated effort (low, medium, high)

Return the plan as a structured JSON array.`;

    const planResponse = await aiService.generate(planPrompt,
      'You are a project planning expert. Create structured, actionable execution plans.'
    );

    let subtasks: any[] = [];
    try {
      const cleaned = planResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      subtasks = JSON.parse(cleaned);
    } catch {
      subtasks = [
        { title: `Research ${goal}`, employee: 'research', dependencies: [], effort: 'medium' },
        { title: `Create content plan for ${goal}`, employee: 'writer', dependencies: [0], effort: 'medium' },
        { title: `Review and finalize ${goal}`, employee: 'reviewer', dependencies: [1], effort: 'low' },
      ];
    }

    return {
      goal,
      subtasks,
      subtaskCount: subtasks.length,
      estimatedFlow: subtasks.map((s: any, i: number) => ({
        step: i + 1,
        task: s.title || s.task,
        assignedEmployee: s.employee || s.assignedEmployee,
        dependsOn: s.dependencies || s.dependsOn || [],
        effort: s.effort || 'medium',
      })),
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'planning',
  name: 'Planning Employee',
  department: 'management',
  role: 'Project Planning Specialist',
  description: 'Understand user goals, break into manageable subtasks, estimate execution flow',
  skills: ['task-decomposition', 'estimation', 'dependency-analysis', 'resource-planning'],
  allowedTools: ['analysis'],
  createInstance: () => new PlanningEmployee(),
});
