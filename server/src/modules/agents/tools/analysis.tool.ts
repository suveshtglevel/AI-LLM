import { ToolResult } from '../../../types';
import { aiService } from '../../../services/ai/ai.service';
import { logger } from '../../../config/logger';
import { ToolRegistry } from '../../../registries/tool.registry';

// Auto-register
ToolRegistry.register({
  name: 'analysis',
  description: 'Analyze collected information and extract insights, patterns, and findings',
  category: 'analysis',
  createInstance: () => new AnalysisTool(),
});

export class AnalysisTool {
  async analyze(data: string, analysisType: string = 'general'): Promise<ToolResult> {
    logger.debug('AnalysisTool: analyzing data', {
      dataLength: data.length,
      analysisType,
    });

    try {
      const analysis = await aiService.analyze(data, analysisType);

      return {
        success: true,
        data: {
          analysisType,
          analysis,
        },
      };
    } catch (error) {
      logger.error('AnalysisTool: Analysis failed', error);
      return {
        success: false,
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async analyzeSources(sources: Array<{ title: string; content: string; url: string }>): Promise<ToolResult> {
    logger.debug('AnalysisTool: analyzing research sources', {
      sourcesCount: sources.length,
    });

    try {
      const sourcesText = sources
        .map(
          (s, i) =>
            `Source ${i + 1}: ${s.title}\nURL: ${s.url}\nContent: ${s.content.substring(0, 3000)}`
        )
        .join('\n\n---\n\n');

      const analysis = await aiService.analyze(
        sourcesText,
        'Extract key insights, patterns, contradictions, and rate source credibility'
      );

      return {
        success: true,
        data: {
          sourcesAnalyzed: sources.length,
          analysis,
        },
      };
    } catch (error) {
      logger.error('AnalysisTool: Source analysis failed', error);
      return {
        success: false,
        error: `Source analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
