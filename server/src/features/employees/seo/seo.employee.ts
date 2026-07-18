import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ContentDocument } from '../../projects/knowledge.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class SeoEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'seo',
      name: 'SEO Specialist',
      role: 'SEO Specialist',
      goal: 'Optimize content for search: keyword research, meta tags, SERP analysis, competitor gaps, and internal linking',
      instructions: 'Research target keywords, produce meta titles/descriptions, suggest headings and internal links, and score on-page SEO. Return structured, actionable recommendations.',
      allowedTools: ['web-search', 'analysis'],
      promptTemplate: 'Perform SEO analysis and optimization for the following content/topic',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const topic = task.input.topic || task.title;
    const content = task.input.content || '';
    const targetKeyword = task.input.targetKeyword || '';

    const systemPrompt = 'You are an expert SEO specialist. Return precise, structured JSON only.';
    const userPrompt = `Produce an SEO optimization package for the topic: "${topic}".
${targetKeyword ? `Primary target keyword: ${targetKeyword}` : ''}
${content ? `Existing content to optimize:\n${String(content).substring(0, 4000)}` : ''}

Return JSON with:
{
  "primaryKeyword": string,
  "secondaryKeywords": string[],
  "metaTitle": string (<= 60 chars),
  "metaDescription": string (<= 155 chars),
  "slug": string (kebab-case),
  "suggestedHeadings": string[],
  "internalLinkIdeas": string[],
  "onPageScore": number (0-100),
  "recommendations": string[]
}`;

    const raw = await aiService.generate(userPrompt, systemPrompt);

    let seo: any = {};
    try {
      seo = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      seo = { recommendations: [raw], onPageScore: 70 };
    }

    try {
      await ContentDocument.create({
        projectId: task.projectId,
        taskId: task.taskId,
        employeeType: 'seo',
        content: JSON.stringify(seo, null, 2),
        format: 'json',
        metadata: { topic, targetKeyword },
        version: 1,
      });
    } catch { /* non-critical */ }

    return {
      topic,
      seo,
      onPageScore: seo.onPageScore ?? 70,
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'seo',
  name: 'SEO Specialist',
  department: 'content',
  role: 'SEO Specialist',
  description: 'Keyword research, meta tags, SERP and competitor analysis, internal linking, and on-page SEO scoring',
  skills: ['keyword-research', 'meta-optimization', 'serp-analysis', 'competitor-analysis', 'internal-linking'],
  allowedTools: ['web-search', 'analysis'],
  createInstance: () => new SeoEmployee(),
});
