import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ContentDocument } from '../../projects/knowledge.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class WriterEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'writer',
      name: 'Writer Employee',
      role: 'Content Writer',
      goal: 'Create high-quality written content including blog posts, scripts, social media captions, and SEO-optimized content',
      instructions: 'Write clear, engaging, and well-structured content in markdown format. Adapt tone to the target audience and platform.',
      allowedTools: ['summarization'],
      promptTemplate: 'Write content based on the following requirements',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const contentType = task.input.contentType || 'blog';
    const topic = task.input.topic || task.title;
    const tone = task.input.tone || 'professional';
    const sources = task.input.sources || [];

    const systemPrompt = `You are a professional content writer. Write in a ${tone} tone.
Format the output in markdown. Adapt to the following content type: ${contentType}.`;

    const userPrompt = `Write ${contentType} content about: ${topic}
${sources.length > 0 ? `Reference the following research:\n${sources.join('\n')}` : ''}

Ensure the content is:
- Well-structured with headings
- SEO-optimized
- Engaging and clear
- Ready for publication`;

    const content = await aiService.generate(userPrompt, systemPrompt);

    // Save as document
    try {
      await ContentDocument.create({
        projectId: task.projectId,
        taskId: task.taskId,
        employeeType: 'writer',
        content,
        format: 'markdown',
        metadata: { contentType, topic, tone },
        version: 1,
      });
    } catch { /* non-critical */ }

    return {
      contentType,
      topic,
      tone,
      content,
      wordCount: content.split(/\s+/).length,
      format: 'markdown',
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'writer',
  name: 'Writer Employee',
  department: 'content',
  role: 'Content Writer',
  description: 'Create high-quality written content including blog posts, scripts, social media captions, and SEO content',
  skills: ['blog', 'seo', 'script', 'email', 'copywriting', 'markdown'],
  allowedTools: ['summarization'],
  createInstance: () => new WriterEmployee(),
});
