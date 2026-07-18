import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { aiService } from '../../../services/ai/ai.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

export class QaEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'qa',
      name: 'QA & Compliance Officer',
      role: 'QA & Compliance Officer',
      goal: 'Gate content before publishing: check plagiarism, copyright, brand safety, and platform-policy compliance',
      instructions: 'Be strict and risk-averse. Flag anything that could breach copyright, platform policy, or brand-safety guidelines. Return a clear pass/block verdict with reasons.',
      allowedTools: ['analysis'],
      promptTemplate: 'Run a compliance and brand-safety review on the following content',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const content = task.input.content || '';
    const platform = task.input.platform || 'general';
    const brandGuidelines = task.input.brandGuidelines || 'standard professional brand safety';

    const systemPrompt = 'You are a strict QA and compliance officer. Return structured JSON only.';
    const userPrompt = `Review the following content for compliance before publishing on "${platform}".
Brand guidelines: ${brandGuidelines}

Content:
${String(content).substring(0, 5000)}

Return JSON with:
{
  "plagiarismRisk": "low" | "medium" | "high",
  "copyrightIssues": string[],
  "brandSafetyIssues": string[],
  "policyViolations": string[],
  "riskScore": number (0-100, higher = riskier),
  "verdict": "pass" | "block" | "revise",
  "reasons": string[]
}`;

    const raw = await aiService.generate(userPrompt, systemPrompt);

    let report: any = {};
    try {
      report = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      report = { verdict: 'revise', riskScore: 50, reasons: [raw] };
    }

    const verdict = report.verdict || (report.riskScore > 60 ? 'block' : 'pass');
    const passed = verdict === 'pass';

    return {
      platform,
      report,
      verdict,
      passed,
      requiresRevision: verdict === 'revise',
      blocked: verdict === 'block',
      status: passed ? 'approved' : 'flagged',
    };
  }
}

// Auto-register
EmployeeRegistry.register({
  type: 'qa',
  name: 'QA & Compliance Officer',
  department: 'content',
  role: 'QA & Compliance Officer',
  description: 'Plagiarism, copyright, brand-safety, and platform-policy compliance checks — the pre-publish risk gate',
  skills: ['plagiarism-detection', 'copyright-check', 'brand-safety', 'policy-compliance'],
  allowedTools: ['analysis'],
  createInstance: () => new QaEmployee(),
});
