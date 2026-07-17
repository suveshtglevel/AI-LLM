import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ResearchSource } from '../../../modules/research/research-source.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class ResearchEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'research',
      name: 'Research Employee',
      role: 'Internet Research Specialist',
      goal: 'Find accurate information, verify sources, and produce comprehensive research reports',
      instructions: 'Be thorough, cite all sources, verify facts from multiple sources, and provide structured analysis',
      allowedTools: ['web-search', 'content-extractor', 'summarization', 'analysis'],
      promptTemplate: 'Research the following topic thoroughly',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const topic = task.input.topic || task.title;
    const searchQueries = typeof task.input.searchQueries === 'string'
      ? JSON.parse(task.input.searchQueries)
      : task.input.searchQueries || [topic];

    const sources: any[] = [];

    for (const query of searchQueries) {
      // Simulated search + extraction (replace with real tools in production)
      const result = {
        url: `https://example.com/research/${encodeURIComponent(query)}`,
        title: `Research: ${query}`,
        content: `Comprehensive research findings about ${query}.`,
        credibilityScore: 75,
      };

      sources.push(result);

      try {
        await ResearchSource.create({
          taskId: task.taskId,
          url: result.url,
          title: result.title,
          content: result.content,
          extractedData: { headings: [], paragraphs: [], keyTerms: [], links: [] },
          metadata: { domain: 'example.com', author: null, publishDate: null, wordCount: result.content.split(/\s+/).length },
          credibilityScore: result.credibilityScore,
        });
      } catch { /* non-critical */ }
    }

    const reportPrompt = `Based on research about "${topic}", generate a comprehensive research report.
Sources collected: ${sources.length}
Summarize findings, key insights, and provide recommendations.`;

    const summary = await aiService.generate(reportPrompt,
      'You are a research analyst. Generate structured reports with findings, insights, and recommendations.'
    );

    return {
      topic,
      sourcesCount: sources.length,
      sources,
      summary,
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'research',
  name: 'Research Employee',
  department: 'research',
  role: 'Internet Research Specialist',
  description: 'Find accurate information, verify sources, and produce comprehensive research reports',
  skills: ['internet-research', 'fact-checking', 'verification', 'summarization', 'source-analysis'],
  allowedTools: ['web-search', 'content-extractor', 'summarization', 'analysis'],
  createInstance: () => new ResearchEmployee(),
});
