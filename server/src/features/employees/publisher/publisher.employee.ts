import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class PublisherEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'publisher',
      name: 'Publisher Employee',
      role: 'Content Publisher',
      goal: 'Publish content across multiple platforms: YouTube, Instagram, TikTok, X (Twitter), LinkedIn',
      instructions: 'Format and adapt content for each platform\'s specific requirements. Generate platform-optimized descriptions, hashtags, and metadata.',
      allowedTools: ['youtube', 'instagram', 'publisher'],
      promptTemplate: 'Prepare the following content for publishing',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const content = task.input.content || '';
    const title = task.input.title || task.title;
    const platforms: string[] = task.input.platforms || ['youtube'];
    const description = task.input.description || '';

    // Generate platform-specific content
    const platformContent: Record<string, any> = {};

    for (const platform of platforms) {
      platformContent[platform] = await this.prepareForPlatform(platform, title, description, content);
    }

    return {
      title,
      platforms,
      platformContent,
      publishPlan: platforms.map(p => ({
        platform: p,
        status: 'ready',
        content: platformContent[p],
        scheduledFor: task.input.scheduleTime || 'immediate',
      })),
      crossPlatformLinks: platforms.length > 1 ? this.generateCrossPlatformLinks(platforms) : [],
      status: 'ready_for_publishing',
    };
  }

  private async prepareForPlatform(platform: string, title: string, description: string, content: string): Promise<any> {
    const prompt = `Prepare content for ${platform}:\nTitle: ${title}\nDescription: ${description}\nContent: ${content.substring(0, 1000)}\n\nGenerate:\n1. Platform-optimized title (${this.getTitleLimit(platform)} chars max)\n2. Platform-optimized description\n3. Relevant hashtags (5-10)\n4. Best posting time\n5. Content format requirements`;

    const prep = await aiService.generate(prompt, `You are a social media publishing expert. Adapt content for ${platform}.`);

    return {
      optimizedTitle: title.substring(0, this.getTitleLimit(platform)),
      description: description || title,
      hashtags: this.getDefaultHashtags(content),
      bestTime: '12:00 PM - 2:00 PM',
      characterLimit: this.getCharacterLimit(platform),
      contentPreview: content.substring(0, this.getCharacterLimit(platform)),
      postReady: true,
    };
  }

  private getTitleLimit(platform: string): number {
    const limits: Record<string, number> = { youtube: 100, instagram: 2200, tiktok: 150, x: 280, linkedin: 300 };
    return limits[platform] || 100;
  }

  private getCharacterLimit(platform: string): number {
    const limits: Record<string, number> = { youtube: 5000, instagram: 2200, tiktok: 2200, x: 280, linkedin: 3000 };
    return limits[platform] || 5000;
  }

  private getDefaultHashtags(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const tags = words.filter(w => w.length > 4 && w.length < 20).slice(0, 5);
    return [...new Set(tags)].map(t => `#${t.replace(/[^a-z0-9]/g, '')}`);
  }

  private generateCrossPlatformLinks(platforms: string[]): Array<{ from: string; to: string; text: string }> {
    const links: Array<{ from: string; to: string; text: string }> = [];
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        links.push({ from: platforms[i], to: platforms[j], text: `Find this on ${platforms[j]}` });
      }
    }
    return links;
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'publisher',
  name: 'Publisher Employee',
  department: 'publishing',
  role: 'Content Publisher',
  description: 'Publish content across multiple platforms: YouTube, Instagram, TikTok, X, LinkedIn',
  skills: ['multi-platform-publishing', 'social-media', 'hashtag-optimization', 'cross-posting'],
  allowedTools: ['youtube', 'instagram', 'publisher'],
  createInstance: () => new PublisherEmployee(),
});
