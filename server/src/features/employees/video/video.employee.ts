import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class VideoEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'video',
      name: 'Video Employee',
      role: 'Video Production Specialist',
      goal: 'Convert storyboards into scenes, generate clips, and produce final video content',
      instructions: 'Break down video scripts into scenes with timing, visual descriptions, and audio sync points.',
      allowedTools: ['video', 'image'],
      promptTemplate: 'Create a video production plan from the following script',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const script = task.input.script || task.input.content || task.title;
    const duration = task.input.targetDuration || 60;
    const style = task.input.videoStyle || 'educational';

    const planPrompt = `Convert this script into a video production plan:
${script.substring(0, 3000)}

Target duration: ${duration} seconds
Style: ${style}

For each scene specify:
1. Scene number and description
2. Duration in seconds
3. Visual description (what's on screen)
4. Narration text
5. Transition type
6. Required assets (images, animations)

Return as JSON array of scenes.`;

    const planResponse = await aiService.generate(planPrompt,
      'You are a video production director. Create detailed scene-by-scene production plans.'
    );

    let scenes: any[] = [];
    try {
      const cleaned = planResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      scenes = JSON.parse(cleaned);
    } catch {
      scenes = [
        { scene: 1, description: 'Introduction', duration: 10, narration: script.substring(0, 100) },
        { scene: 2, description: 'Main content', duration: Math.max(duration - 20, 10), narration: script.substring(100, 300) },
        { scene: 3, description: 'Conclusion', duration: 10, narration: script.substring(300, 400) },
      ];
    }

    const totalDuration = scenes.reduce((acc: number, s: any) => acc + (s.duration || s.durationSeconds || 10), 0);

    return {
      script,
      style,
      totalDurationSeconds: totalDuration,
      sceneCount: scenes.length,
      scenes: scenes.map((s: any, i: number) => ({
        sceneNumber: i + 1,
        description: s.description || s.visual || '',
        duration: s.duration || s.durationSeconds || 10,
        narration: s.narration || s.narrationText || '',
        transition: s.transition || s.transitionType || 'cut',
        assets: s.assets || s.requiredAssets || [],
      })),
      estimatedRenderTime: Math.ceil(totalDuration * 0.5), // rough estimate
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'video',
  name: 'Video Employee',
  department: 'media',
  role: 'Video Production Specialist',
  description: 'Convert storyboards into scenes, generate clips, and produce final video content',
  skills: ['storyboarding', 'scene-planning', 'video-production', 'timing'],
  allowedTools: ['video', 'image'],
  createInstance: () => new VideoEmployee(),
});
