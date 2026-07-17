import { WorkflowRegistry } from '../workflow.registry';

WorkflowRegistry.register({
  id: 'podcast',
  name: 'Podcast Production',
  description: 'End-to-end podcast production: research, script, review, voice recording, and publishing',
  version: '1.0.0',
  category: 'media',
  estimatedDurationMinutes: 30,
  tags: ['podcast', 'audio', 'content', 'voice'],
  defaultInput: {
    tone: 'conversational',
    voiceType: 'natural',
  },
  steps: [
    {
      id: 'research',
      employeeType: 'research',
      title: 'Research podcast topic',
      description: 'Gather accurate information and talking points',
      dependsOn: [],
      approvalRequired: false,
    },
    {
      id: 'writer',
      employeeType: 'writer',
      title: 'Write podcast script',
      description: 'Write conversational script with intro, segments, and outro',
      input: { contentType: 'script', tone: 'conversational' },
      dependsOn: ['research'],
      approvalRequired: false,
    },
    {
      id: 'reviewer',
      employeeType: 'reviewer',
      title: 'Review script',
      description: 'Fact-check and quality review',
      dependsOn: ['writer'],
      approvalRequired: true,
    },
    {
      id: 'voice',
      employeeType: 'voice',
      title: 'Record voice narration',
      description: 'Convert script into natural-sounding narration',
      dependsOn: ['reviewer'],
      approvalRequired: false,
    },
    {
      id: 'publisher',
      employeeType: 'publisher',
      title: 'Publish episode',
      description: 'Prepare and publish podcast episode with metadata',
      dependsOn: ['voice'],
      approvalRequired: true,
    },
  ],
});
