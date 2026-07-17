import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class VoiceEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'voice',
      name: 'Voice Employee',
      role: 'Voice & Narration Specialist',
      goal: 'Convert text into professional narration, generate timestamps, and prepare audio for export',
      instructions: 'Generate natural-sounding narration scripts with timing annotations. Format output for TTS processing.',
      allowedTools: ['tts'],
      promptTemplate: 'Convert the following text into a narration script',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const text = task.input.text || task.input.content || '';
    const voiceType = task.input.voiceType || 'natural';
    const language = task.input.language || 'en';

    // Parse text into narration segments with timing estimates
    const words = text.split(/\s+/);
    const wordsPerSecond = voiceType === 'slow' ? 2.5 : voiceType === 'fast' ? 4.5 : 3.5;
    const totalDuration = Math.ceil(words.length / wordsPerSecond);

    const segments = this.generateSegments(text, wordsPerSecond);

    return {
      text,
      voiceType,
      language,
      totalDurationSeconds: totalDuration,
      wordCount: words.length,
      segments,
      narrationReady: true,
      estimatedAudioSizeKb: Math.ceil(totalDuration * 16), // ~16KB per second for MP3
      format: 'mp3',
      status: 'completed',
    };
  }

  private generateSegments(text: string, wps: number): Array<{ text: string; startTime: number; duration: number }> {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    let currentTime = 0;
    const segments: Array<{ text: string; startTime: number; duration: number }> = [];

    for (const para of paragraphs) {
      const wordCount = para.split(/\s+/).length;
      const duration = Math.ceil(wordCount / wps);
      segments.push({
        text: para.substring(0, 200),
        startTime: currentTime,
        duration,
      });
      currentTime += duration;
    }

    return segments;
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'voice',
  name: 'Voice Employee',
  department: 'media',
  role: 'Voice & Narration Specialist',
  description: 'Convert text into professional narration, generate timestamps, and prepare audio for export',
  skills: ['tts', 'narration', 'audio-timing', 'voice-selection'],
  allowedTools: ['tts'],
  createInstance: () => new VoiceEmployee(),
});
