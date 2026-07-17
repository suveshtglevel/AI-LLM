import { ToolResult } from '../../../types';
import { aiService } from '../../../services/ai/ai.service';
import { logger } from '../../../config/logger';
import { ToolRegistry } from '../../../registries/tool.registry';

// Auto-register
ToolRegistry.register({
  name: 'summarization',
  description: 'Summarize documents and text content with AI',
  category: 'analysis',
  createInstance: () => new SummarizationTool(),
});

export class SummarizationTool {
  async summarize(text: string, maxLength?: number): Promise<ToolResult> {
    logger.debug('SummarizationTool: summarizing text', {
      textLength: text.length,
      maxLength,
    });

    try {
      const summary = await aiService.summarize(text, maxLength);

      return {
        success: true,
        data: {
          originalLength: text.length,
          summaryLength: summary.length,
          summary,
        },
      };
    } catch (error) {
      logger.error('SummarizationTool: Summarization failed', error);
      return {
        success: false,
        error: `Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async summarizeMultiple(documents: string[]): Promise<ToolResult> {
    logger.debug('SummarizationTool: summarizing multiple documents', {
      count: documents.length,
    });

    try {
      const combined = documents.map((doc, i) => `Document ${i + 1}:\n${doc}`).join('\n\n---\n\n');
      const summary = await aiService.summarize(combined);

      return {
        success: true,
        data: {
          documentCount: documents.length,
          summary,
        },
      };
    } catch (error) {
      logger.error('SummarizationTool: Multi-document summarization failed', error);
      return {
        success: false,
        error: `Multi-document summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
