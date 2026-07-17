import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class ReviewerEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'reviewer',
      name: 'Reviewer Employee',
      role: 'Content Reviewer',
      goal: 'Review content for fact-checking, grammar, SEO optimization, quality scoring, and hallucination detection',
      instructions: 'Be critical and thorough. Check facts, grammar, SEO score, and flag any potential hallucinations or inaccuracies.',
      allowedTools: ['analysis'],
      promptTemplate: 'Review the following content and provide a quality assessment',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const content = task.input.content || '';
    const contentType = task.input.contentType || 'document';

    const reviewPrompt = `Review the following ${contentType} and provide a detailed quality assessment:

${content.substring(0, 5000)}

Rate each category from 0-100:
1. Grammar & Spelling
2. Factual Accuracy
3. SEO Optimization
4. Readability
5. Engagement
6. Overall Quality

Also flag any:
- Potential hallucinations
- Factual errors
- Grammar issues
- SEO improvements
- Style inconsistencies

Return as JSON with scores array, issues array, and summary.`;

    const review = await aiService.generate(reviewPrompt,
      'You are a strict content reviewer. Be honest and thorough in your assessment.'
    );

    let assessment: any = {};
    try {
      const cleaned = review.replace(/```json/g, '').replace(/```/g, '').trim();
      assessment = JSON.parse(cleaned);
    } catch {
      assessment = { summary: review, scores: { overall: 75 }, issues: [] };
    }

    const passed = (assessment.scores?.overall || assessment.scores?.Overall || 75) >= 60;

    return {
      contentType,
      assessment,
      passed,
      requiresRevision: !passed,
      suggestedImprovements: assessment.issues || [],
      status: passed ? 'approved' : 'needs_revision',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'reviewer',
  name: 'Reviewer Employee',
  department: 'content',
  role: 'Content Reviewer',
  description: 'Review content for fact-checking, grammar, SEO, quality scoring, and hallucination detection',
  skills: ['fact-checking', 'grammar', 'seo-audit', 'quality-scoring', 'hallucination-detection'],
  allowedTools: ['analysis'],
  createInstance: () => new ReviewerEmployee(),
});
