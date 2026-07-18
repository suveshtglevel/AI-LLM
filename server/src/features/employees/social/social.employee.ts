import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ContentDocument } from '../../projects/knowledge.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class SocialEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'social',
      name: 'Social & Community Manager',
      role: 'Social & Community Manager',
      goal: 'Grow and engage the audience: draft platform-native posts, reply suggestions, moderation notes, and a posting schedule',
      instructions: 'Turn finished content into platform-specific promo posts, propose engagement replies, flag comments needing moderation, and recommend an optimal posting schedule.',
      allowedTools: ['youtube', 'instagram', 'publisher'],
      promptTemplate: 'Create a social distribution and community engagement plan for the following content',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const topic = task.input.topic || task.title;
    const content = task.input.content || '';
    const platforms = task.input.platforms || ['twitter', 'linkedin', 'instagram'];

    const systemPrompt = 'You are a social media and community manager. Return structured JSON only.';
    const userPrompt = `Build a social distribution + community plan for: "${topic}".
Target platforms: ${Array.isArray(platforms) ? platforms.join(', ') : platforms}.
${content ? `Source content:\n${String(content).substring(0, 3000)}` : ''}

Return JSON with:
{
  "posts": [{ "platform": string, "text": string, "hashtags": string[] }],
  "replyTemplates": string[],
  "moderationGuidelines": string[],
  "postingSchedule": [{ "platform": string, "when": string }],
  "engagementTips": string[]
}`;

    const raw = await aiService.generate(userPrompt, systemPrompt);

    let plan: any = {};
    try {
      plan = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      plan = { posts: [], engagementTips: [raw] };
    }

    try {
      await ContentDocument.create({
        projectId: task.projectId,
        taskId: task.taskId,
        employeeType: 'social',
        content: JSON.stringify(plan, null, 2),
        format: 'json',
        metadata: { topic, platforms },
        version: 1,
      });
    } catch { /* non-critical */ }

    return {
      topic,
      plan,
      postCount: Array.isArray(plan.posts) ? plan.posts.length : 0,
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'social',
  name: 'Social & Community Manager',
  department: 'publishing',
  role: 'Social & Community Manager',
  description: 'Audience engagement, reply drafting, comment moderation, post scheduling, and hashtag strategy',
  skills: ['engagement', 'reply-drafting', 'comment-moderation', 'post-scheduling', 'hashtag-strategy'],
  allowedTools: ['youtube', 'instagram', 'publisher'],
  createInstance: () => new SocialEmployee(),
});
