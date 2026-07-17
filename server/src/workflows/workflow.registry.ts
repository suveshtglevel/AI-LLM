import { logger } from '../config/logger';
import { WorkflowDefinition } from './workflow.types';

class WorkflowRegistryClass {
  private workflows = new Map<string, WorkflowDefinition>();

  register(workflow: WorkflowDefinition): void {
    if (this.workflows.has(workflow.id)) {
      logger.warn(`[WorkflowRegistry] Overwriting workflow: ${workflow.id}`);
    }
    this.workflows.set(workflow.id, workflow);
    logger.debug(`[WorkflowRegistry] Registered: ${workflow.id} (${workflow.name}) — ${workflow.steps.length} steps`);
  }

  get(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  list(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getByCategory(category: string): WorkflowDefinition[] {
    return this.list().filter(w => w.category === category);
  }

  findByTag(tag: string): WorkflowDefinition[] {
    const lower = tag.toLowerCase();
    return this.list().filter(w => w.tags.some(t => t.toLowerCase().includes(lower)));
  }

  /**
   * Auto-detect the best workflow for a goal string.
   * Matches by keywords in the goal against workflow tags.
   */
  suggestForGoal(goal: string): WorkflowDefinition | undefined {
    const goalLower = goal.toLowerCase();
    const workflows = this.list();

    // Score each workflow by keyword matches
    const scored = workflows.map(w => {
      const allKeywords = [...w.tags, ...w.steps.map(s => s.employeeType), w.name, w.category];
      const matchCount = allKeywords.filter(k => goalLower.includes(k.toLowerCase())).length;
      return { workflow: w, score: matchCount };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].workflow : undefined;
  }

  count(): number {
    return this.workflows.size;
  }
}

export const WorkflowRegistry = new WorkflowRegistryClass();
