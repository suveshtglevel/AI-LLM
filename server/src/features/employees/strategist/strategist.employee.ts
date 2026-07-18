import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ContentDocument } from '../../projects/knowledge.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class StrategistEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'strategist',
      name: 'Content Strategist',
      role: 'Content Strategist & Trend Scout',
      goal: 'Decide what to make next: detect trends, analyze the audience, and propose prioritized content ideas with rationale',
      instructions: 'Use performance signals and market trends to identify high-opportunity topics. Propose a ranked content roadmap with expected impact and target audience.',
      allowedTools: ['web-search', 'analysis'],
      promptTemplate: 'Produce a content strategy and trend analysis for the following goal/domain',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const domain = task.input.domain || task.input.topic || task.title;
    const audience = task.input.audience || 'general';
    const pastPerformance = task.input.pastPerformance || '';

    const systemPrompt = 'You are a data-informed content strategist and trend scout. Return structured JSON only.';
    const userPrompt = `Build a content strategy for the domain/niche: "${domain}".
Target audience: ${audience}.
${pastPerformance ? `Past performance signals:\n${String(pastPerformance).substring(0, 2000)}` : ''}

Return JSON with:
{
  "trendingTopics": [{ "topic": string, "reason": string, "momentum": "rising" | "steady" | "declining" }],
  "contentIdeas": [{ "title": string, "format": string, "audience": string, "expectedImpact": "high" | "medium" | "low", "rationale": string }],
  "roadmap": [{ "priority": number, "idea": string }],
  "audienceInsights": string[]
}`;

    const raw = await aiService.generate(userPrompt, systemPrompt);

    let strategy: any = {};
    try {
      strategy = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      strategy = { contentIdeas: [], audienceInsights: [raw] };
    }

    try {
      await ContentDocument.create({
        projectId: task.projectId,
        taskId: task.taskId,
        employeeType: 'strategist',
        content: JSON.stringify(strategy, null, 2),
        format: 'json',
        metadata: { domain, audience },
        version: 1,
      });
    } catch { /* non-critical */ }

    return {
      domain,
      strategy,
      ideaCount: Array.isArray(strategy.contentIdeas) ? strategy.contentIdeas.length : 0,
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'strategist',
  name: 'Content Strategist',
  department: 'analytics',
  role: 'Content Strategist & Trend Scout',
  description: 'Trend detection, content strategy, topic ideation, and audience analysis — decides what to create next',
  skills: ['trend-detection', 'content-strategy', 'topic-ideation', 'audience-analysis'],
  allowedTools: ['web-search', 'analysis'],
  createInstance: () => new StrategistEmployee(),
});
