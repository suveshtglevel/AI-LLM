import { BaseAgent, AgentTask, AgentContext } from './agent.framework';
import { WebSearchTool } from './tools/web-search.tool';
import { ContentExtractorTool } from './tools/content-extractor.tool';
import { SummarizationTool } from './tools/summarization.tool';
import { AnalysisTool } from './tools/analysis.tool';
import { aiService } from '../../services/ai/ai.service';
import { MemoryModel } from '../memory/memory.model';
import { ResearchSource } from '../research/research-source.model';
import { logger } from '../../config/logger';

export class ResearchAgent extends BaseAgent {
  private webSearch: WebSearchTool;
  private contentExtractor: ContentExtractorTool;
  private summarization: SummarizationTool;
  private analysis: AnalysisTool;

  constructor() {
    super({
      name: 'AI Research Specialist',
      goal: 'Find accurate information and create comprehensive research reports with cited sources and actionable insights',
      instructions: 'Be thorough, cite all sources, verify facts, and provide well-structured analysis with clear recommendations',
      model: 'gpt-4o-mini',
    });

    this.webSearch = new WebSearchTool();
    this.contentExtractor = new ContentExtractorTool();
    this.summarization = new SummarizationTool();
    this.analysis = new AnalysisTool();
  }

  protected async initializeContext(task: AgentTask): Promise<AgentContext> {
    logger.info(`ResearchAgent: Initializing context for task "${task.id}"`);

    // Try to load existing memory from MongoDB
    const existingMemory = await MemoryModel.getMemory(task.id, task.userId);

    // Create memory if it doesn't exist
    if (!existingMemory) {
      await MemoryModel.createMemory(task.id, task.userId);
    }

    const context: AgentContext = {
      taskId: task.id,
      userId: task.userId,
      topic: task.topic,
      description: task.description,
      memory: {
        conversationHistory: existingMemory?.conversationHistory?.map((e) => ({
          role: e.role,
          content: e.content,
        })) || [],
        previousResearch: existingMemory?.previousResearch || '',
        importantFacts: existingMemory?.importantFacts?.map((f) => ({
          fact: f.fact,
          source: f.source,
          confidence: f.confidence,
        })) || [],
      },
      collectedData: [],
    };

    // Add system message to conversation
    await MemoryModel.addConversationEntry(task.id, task.userId, {
      role: 'system',
      content: `Starting research task: ${task.topic}. Description: ${task.description || 'No description provided.'}`,
    });

    return context;
  }

  protected async plan(context: AgentContext): Promise<string[]> {
    logger.info(`ResearchAgent: Planning research for "${context.topic}"`);

    // Generate research plan using AI
    const planPrompt = `Create a research plan for the topic: "${context.topic}"

Description: ${context.description || 'No specific description'}

Generate 3-5 search queries that will help gather comprehensive information on this topic.
Return the queries as a JSON array of strings.`;

    try {
      const planResponse = await aiService.generate(planPrompt, `You are a research planning assistant.
Generate specific, targeted search queries that will yield the most relevant results.
Return ONLY a JSON array of strings, no explanation.`);

      // Parse the response as JSON array
      const cleaned = planResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const searchQueries = JSON.parse(cleaned) as string[];

      logger.info(`ResearchAgent: Generated ${searchQueries.length} search queries`, { searchQueries });

      // Store plan in memory
      await MemoryModel.addConversationEntry(context.taskId, context.userId, {
        role: 'assistant',
        content: `Research plan created with queries: ${searchQueries.join(', ')}`,
      });

      return searchQueries;
    } catch (error) {
      // Fallback to default queries if AI parsing fails
      logger.warn('ResearchAgent: AI planning failed, using fallback queries', error);
      const fallbackQueries = [
        `${context.topic} overview and background`,
        `${context.topic} latest research and findings`,
        `${context.topic} key insights and analysis`,
      ];
      return fallbackQueries;
    }
  }

  protected async collectData(
    context: AgentContext,
    searchQuery: string
  ): Promise<Array<{ title: string; content: string; url: string }>> {
    logger.info(`ResearchAgent: Collecting data for query "${searchQuery}"`);

    const collectedResults: Array<{ title: string; content: string; url: string }> = [];

    // Step 1: Search the web
    const searchResult = await this.webSearch.search(searchQuery);
    if (!searchResult.success || !searchResult.data) {
      logger.warn(`ResearchAgent: Search failed for query "${searchQuery}"`);
      return collectedResults;
    }

    const searchResults = searchResult.data as Array<{ url: string; title: string; snippet: string }>;

    // Step 2: Extract content from each result
    for (const result of searchResults) {
      const extractResult = await this.contentExtractor.extract(result.url);
      if (extractResult.success && extractResult.data) {
        const extracted = extractResult.data as {
          url: string;
          title: string;
          content: string;
          extractedData: any;
          metadata: any;
        };

        // Store in MongoDB as a ResearchSource document
        try {
          await ResearchSource.create({
            taskId: context.taskId,
            url: extracted.url,
            title: extracted.title,
            content: extracted.content,
            extractedData: extracted.extractedData,
            metadata: extracted.metadata,
            credibilityScore: 70, // Default score; in production, analyze properly
          });
        } catch (error) {
          logger.error(`ResearchAgent: Failed to save source to MongoDB`, error);
        }

        collectedResults.push({
          title: extracted.title,
          content: extracted.content,
          url: extracted.url,
        });
      }
    }

    logger.info(`ResearchAgent: Collected ${collectedResults.length} sources for query "${searchQuery}"`);

    return collectedResults;
  }

  protected async analyze(context: AgentContext): Promise<string> {
    logger.info(`ResearchAgent: Analyzing ${context.collectedData.length} sources`);

    // Use AnalysisTool to analyze all collected sources
    const analysisResult = await this.analysis.analyzeSources(context.collectedData);

    if (analysisResult.success && analysisResult.data) {
      const data = analysisResult.data as { analysis: string };
      return data.analysis;
    }

    return 'Analysis completed with limited data.';
  }

  protected async generateReport(
    context: AgentContext,
    analysis: string
  ): Promise<{ summary: string; keyInsights: string[]; recommendations: string[] }> {
    logger.info(`ResearchAgent: Generating report for "${context.topic}"`);

    // Use AI Service to generate the final report
    const report = await aiService.generateResearchReport(
      context.topic,
      context.collectedData,
      analysis
    );

    // Save the report to memory
    await MemoryModel.addConversationEntry(context.taskId, context.userId, {
      role: 'assistant',
      content: `Report generated with ${report.keyInsights.length} key insights and ${report.recommendations.length} recommendations.`,
    });

    return report;
  }

  protected async saveMemory(context: AgentContext): Promise<void> {
    logger.info(`ResearchAgent: Saving memory for task "${context.taskId}"`);

    try {
      // Update memory with research findings
      await MemoryModel.addConversationEntry(context.taskId, context.userId, {
        role: 'system',
        content: `Research completed for topic: ${context.topic}. Sources collected: ${context.collectedData.length}.`,
      });

      // Store important facts from collected data
      for (const source of context.collectedData) {
        await MemoryModel.addImportantFact(context.taskId, context.userId, {
          fact: `Information collected from: ${source.title}`,
          source: source.url,
          confidence: 70,
        });
      }
    } catch (error) {
      logger.error('ResearchAgent: Failed to save memory', error);
    }
  }
}
