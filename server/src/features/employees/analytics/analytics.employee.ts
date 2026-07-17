import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class AnalyticsEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'analytics',
      name: 'Analytics Employee',
      role: 'Performance Analytics Specialist',
      goal: 'Analyze content performance, track metrics, and provide actionable improvement suggestions',
      instructions: 'Analyze engagement data, identify patterns, and provide data-driven recommendations for content optimization.',
      allowedTools: ['analysis'],
      promptTemplate: 'Analyze the following performance data and provide insights',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const metrics = task.input.metrics || {};
    const platform = task.input.platform || 'all';
    const period = task.input.period || 'last_30_days';

    // Default simulated metrics
    const defaultMetrics = {
      views: 15000,
      watchTime: 450000,
      likes: 1200,
      comments: 340,
      shares: 180,
      ctr: 4.2,
      avgWatchDuration: 30,
      retentionRate: 65,
      subscriberGain: 85,
    };

    const mergedMetrics = { ...defaultMetrics, ...metrics };

    const analysisPrompt = `Analyze the following ${platform} content performance metrics for ${period}:

${Object.entries(mergedMetrics).map(([k, v]) => `${k}: ${v}`).join('\n')}

Provide:
1. Overall performance assessment (0-100)
2. Key strengths
3. Areas for improvement
4. Specific actionable recommendations (3-5)
5. Suggested A/B tests
6. Content strategy adjustments

Return as structured JSON.`;

    const analysis = await aiService.generate(analysisPrompt,
      'You are a data-driven content analyst. Provide actionable insights based on performance metrics.'
    );

    let parsedAnalysis: any = {};
    try {
      const cleaned = analysis.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedAnalysis = JSON.parse(cleaned);
    } catch {
      parsedAnalysis = { overallScore: 75, strengths: ['Good engagement'], improvements: ['Increase frequency'] };
    }

    return {
      platform,
      period,
      metrics: mergedMetrics,
      performanceScore: parsedAnalysis.overallScore || 75,
      strengths: parsedAnalysis.strengths || parsedAnalysis.keyStrengths || [],
      improvements: parsedAnalysis.improvements || parsedAnalysis.areasForImprovement || [],
      recommendations: parsedAnalysis.recommendations || parsedAnalysis.actionableRecommendations || [],
      suggestedTests: parsedAnalysis.suggestedTests || parsedAnalysis.suggestedABTests || [],
      benchmarks: {
        avgCTR: 3.5,
        avgRetention: 55,
        topPerformance: 90,
        yourRanking: mergedMetrics.ctr > 4 ? 'above_average' : 'average',
      },
      status: 'completed',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'analytics',
  name: 'Analytics Employee',
  department: 'analytics',
  role: 'Performance Analytics Specialist',
  description: 'Analyze content performance, track metrics, and provide actionable improvement suggestions',
  skills: ['data-analysis', 'metrics-tracking', 'performance-optimization', 'a-b-testing', 'reporting'],
  allowedTools: ['analysis'],
  createInstance: () => new AnalyticsEmployee(),
});
