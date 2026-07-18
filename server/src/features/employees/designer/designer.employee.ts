import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ContentDocument } from '../../projects/knowledge.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class DesignerEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'designer',
      name: 'Designer & Brand',
      role: 'Designer & Brand Guardian',
      goal: 'Ensure a consistent visual identity: thumbnail concepts, layout templates, and brand-aligned design specs',
      instructions: 'Produce design briefs and specs (not raw pixels): thumbnail concepts, color/typography guidance, layout structure, and image-generation prompts that enforce brand consistency.',
      allowedTools: ['image'],
      promptTemplate: 'Produce a design brief and brand-consistent visual specs for the following content',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const topic = task.input.topic || task.title;
    const contentType = task.input.contentType || 'thumbnail';
    const brand = task.input.brand || 'clean, modern, professional';

    const systemPrompt = 'You are a senior visual designer and brand guardian. Return structured JSON only.';
    const userPrompt = `Create a design brief for a "${contentType}" about "${topic}".
Brand style: ${brand}

Return JSON with:
{
  "concept": string,
  "colorPalette": string[],
  "typography": { "heading": string, "body": string },
  "layout": string,
  "thumbnailIdeas": [{ "title": string, "description": string }],
  "imagePrompts": string[],
  "brandNotes": string[]
}`;

    const raw = await aiService.generate(userPrompt, systemPrompt);

    let brief: any = {};
    try {
      brief = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      brief = { concept: raw, imagePrompts: [] };
    }

    try {
      await ContentDocument.create({
        projectId: task.projectId,
        taskId: task.taskId,
        employeeType: 'designer',
        content: JSON.stringify(brief, null, 2),
        format: 'json',
        metadata: { topic, contentType, brand },
        version: 1,
      });
    } catch { /* non-critical */ }

    return {
      topic,
      contentType,
      brief,
      promptCount: Array.isArray(brief.imagePrompts) ? brief.imagePrompts.length : 0,
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'designer',
  name: 'Designer & Brand',
  department: 'media',
  role: 'Designer & Brand Guardian',
  description: 'Thumbnail concepts, layout templates, visual consistency, and brand-aligned design specs',
  skills: ['thumbnail-design', 'brand-identity', 'layout', 'visual-consistency'],
  allowedTools: ['image'],
  createInstance: () => new DesignerEmployee(),
});
