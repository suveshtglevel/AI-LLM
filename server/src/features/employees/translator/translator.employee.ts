import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { ContentDocument } from '../../projects/knowledge.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class TranslatorEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'translator',
      name: 'Translator & Localizer',
      role: 'Translator & Localizer',
      goal: 'Translate and culturally adapt content and subtitles into target languages while preserving tone and intent',
      instructions: 'Translate faithfully, adapt idioms and cultural references for the target locale, and preserve markdown/subtitle structure. Never invent facts.',
      allowedTools: ['summarization'],
      promptTemplate: 'Translate and localize the following content into the requested target languages',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const content = task.input.content || '';
    const sourceLang = task.input.sourceLang || 'en';
    const targetLangs: string[] = task.input.targetLangs || task.input.targetLanguages || ['es'];
    const format = task.input.format || 'markdown';

    const translations: Record<string, string> = {};

    for (const lang of targetLangs) {
      const systemPrompt = `You are a professional translator and localizer. Translate from ${sourceLang} to ${lang}. Preserve ${format} structure. Adapt idioms and cultural references naturally. Return only the translated content.`;
      const userPrompt = `Translate and localize the following ${format} content into ${lang}:\n\n${String(content).substring(0, 6000)}`;

      const translated = await aiService.generate(userPrompt, systemPrompt);
      translations[lang] = translated;

      try {
        await ContentDocument.create({
          projectId: task.projectId,
          taskId: task.taskId,
          employeeType: 'translator',
          content: translated,
          format,
          metadata: { sourceLang, targetLang: lang },
          version: 1,
        });
      } catch { /* non-critical */ }
    }

    return {
      sourceLang,
      targetLangs,
      translations,
      languageCount: targetLangs.length,
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'translator',
  name: 'Translator & Localizer',
  department: 'content',
  role: 'Translator & Localizer',
  description: 'Multi-language translation, localization, subtitle translation, and cultural adaptation',
  skills: ['translation', 'localization', 'subtitle-translation', 'cultural-adaptation'],
  allowedTools: ['summarization'],
  createInstance: () => new TranslatorEmployee(),
});
