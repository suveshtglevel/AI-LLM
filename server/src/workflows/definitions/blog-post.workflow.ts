import { WorkflowRegistry } from '../workflow.registry';

WorkflowRegistry.register({
  id: 'blog-post',
  name: 'Blog Post Writing',
  description: 'Research, write, review, and publish a SEO-optimized blog post',
  version: '1.0.0',
  category: 'content',
  estimatedDurationMinutes: 20,
  tags: ['blog', 'writing', 'seo', 'content'],
  defaultInput: {
    tone: 'professional',
    contentType: 'blog',
  },
  steps: [
    {
      id: 'research',
      employeeType: 'research',
      title: 'Research topic',
      description: 'Gather information, statistics, and references',
      dependsOn: [],
      approvalRequired: false,
    },
    {
      id: 'writer',
      employeeType: 'writer',
      title: 'Write blog post',
      description: 'Write SEO-optimized blog post with headings, subheadings, and meta description',
      input: { contentType: 'blog' },
      dependsOn: ['research'],
      approvalRequired: false,
    },
    {
      id: 'reviewer',
      employeeType: 'reviewer',
      title: 'Review and optimize',
      description: 'Grammar check, SEO audit, readability score, fact-check',
      dependsOn: ['writer'],
      approvalRequired: false,
    },
    {
      id: 'image',
      employeeType: 'image',
      title: 'Create featured image',
      description: 'Generate blog thumbnail and in-article illustrations',
      input: { imageType: 'illustration', count: 3 },
      dependsOn: ['writer'],
      approvalRequired: false,
    },
    {
      id: 'publisher',
      employeeType: 'publisher',
      title: 'Publish to blog',
      description: 'Format and publish blog post with metadata and images',
      dependsOn: ['reviewer', 'image'],
      approvalRequired: true,
    },
  ],
});
