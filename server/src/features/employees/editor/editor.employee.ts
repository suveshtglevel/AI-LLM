import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class EditorEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'editor',
      name: 'Editor Employee',
      role: 'Video Editor',
      goal: 'Merge video clips, add subtitles, transitions, sync voiceover, and add background music',
      instructions: 'Plan the post-production editing pipeline including visual effects, audio mixing, and subtitle generation.',
      allowedTools: ['video'],
      promptTemplate: 'Create an editing plan for the following video assets',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const assets = task.input.assets || task.input.scenes || [];
    const script = task.input.script || task.input.narration || '';
    const addSubtitles = task.input.subtitles !== false;
    const backgroundMusic = task.input.backgroundMusic || 'ambient';

    // Generate subtitle tracks from narration
    const subtitles = addSubtitles ? this.generateSubtitles(script) : [];

    // Create editing timeline
    const timeline = this.createTimeline(assets, backgroundMusic);

    return {
      assetCount: assets.length,
      subtitleTracks: addSubtitles ? 1 : 0,
      subtitleCount: subtitles.length,
      subtitles,
      timeline,
      backgroundMusic,
      totalDurationSeconds: timeline.reduce((acc: number, t: any) => acc + (t.duration || 0), 0),
      editingSteps: [
        'Import all assets',
        'Arrange clips on timeline',
        addSubtitles ? 'Generate and sync subtitles' : null,
        'Add transitions between clips',
        backgroundMusic ? 'Add background music track' : null,
        'Sync voiceover with video',
        'Color grade and enhance',
        'Export final video',
      ].filter(Boolean),
      status: 'completed',
    };
  }

  private generateSubtitles(text: string): Array<{ start: number; end: number; text: string }> {
    const words = text.split(/\s+/);
    const subs: Array<{ start: number; end: number; text: string }> = [];
    const chunkSize = 8;
    let time = 0;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const duration = chunkSize * 0.35;
      subs.push({ start: Math.round(time * 10) / 10, end: Math.round((time + duration) * 10) / 10, text: chunk });
      time += duration;
    }

    return subs;
  }

  private createTimeline(assets: any[], bgMusic: string): Array<{
    type: string;
    source: string;
    duration: number;
    transitions: string[];
  }> {
    if (!assets.length) {
      return [{ type: 'placeholder', source: 'intro', duration: 30, transitions: ['fade_in', 'fade_out'] }];
    }

    return assets.map((asset: any, i: number) => ({
      type: asset.type || 'video',
      source: asset.url || asset.source || `clip-${i + 1}`,
      duration: asset.duration || 10,
      transitions: [
        i === 0 ? 'fade_in' : 'crossfade',
        i === assets.length - 1 ? 'fade_out' : 'crossfade',
      ],
    }));
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'editor',
  name: 'Editor Employee',
  department: 'media',
  role: 'Video Editor',
  description: 'Merge video clips, add subtitles, transitions, sync voiceover, and add background music',
  skills: ['video-editing', 'subtitling', 'audio-mixing', 'transitions', 'color-grading'],
  allowedTools: ['video'],
  createInstance: () => new EditorEmployee(),
});
