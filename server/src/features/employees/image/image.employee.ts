import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class ImageEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'image',
      name: 'Image Employee',
      role: 'Image Generation Specialist',
      goal: 'Generate high-quality images including thumbnails, illustrations, and scene images from descriptions',
      instructions: 'Create detailed image generation prompts based on content requirements.',
      allowedTools: ['image'],
      promptTemplate: 'Generate image prompts and specifications based on the following requirements',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const description = task.input.imageDescription || task.input.description || task.title;
    const imageType = task.input.imageType || 'illustration';
    const style = task.input.style || 'realistic';
    const count = task.input.count || 1;

    const promptResponse = await aiService.generate(
      `Create ${count} detailed image generation prompt(s) for: ${description}
Image type: ${imageType}
Style: ${style}

For each prompt, specify:
1. A detailed text-to-image prompt (in English, descriptive, includes style and mood)
2. Aspect ratio (16:9, 1:1, 4:3, 9:16)
3. Suggested negative prompt (what to avoid)

Return as JSON array.`,
      'You are an expert image prompt engineer. Create detailed, effective prompts for AI image generation.'
    );

    let images: any[] = [];
    try {
      const cleaned = promptResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      images = JSON.parse(cleaned);
    } catch {
      images = Array.from({ length: count }, (_, i) => ({
        prompt: description,
        aspectRatio: '16:9',
        negativePrompt: 'blurry, low quality',
      }));
    }

    return {
      imageType,
      style,
      imagesGenerated: images.length,
      images: images.map((img: any, i: number) => ({
        index: i + 1,
        prompt: img.prompt || img,
        aspectRatio: img.aspectRatio || '16:9',
        negativePrompt: img.negativePrompt || '',
        // In production: img.url = await imageTool.generate(img.prompt)
        url: `https://placeholder.example/image-${i + 1}.png`,
      })),
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'image',
  name: 'Image Employee',
  department: 'media',
  role: 'Image Generation Specialist',
  description: 'Generate high-quality images including thumbnails, illustrations, and scene images',
  skills: ['image-generation', 'prompt-engineering', 'illustration', 'thumbnail-design'],
  allowedTools: ['image'],
  createInstance: () => new ImageEmployee(),
});
