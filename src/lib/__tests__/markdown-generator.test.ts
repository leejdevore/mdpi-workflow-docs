import { describe, it, expect } from 'vitest';
import { generateWorkflowMarkdown, type GenerateMarkdownParams } from '../markdown-generator';
import type { Workflow, Scenario, ScenarioVersion, WorkflowStep, WorkflowEdge, ActorDefinition, PhaseDefinition } from '@/types/workflow';
import type { MarkdownExportOptions, ExportAttachment } from '@/types/export';
import { DEFAULT_EXPORT_OPTIONS } from '@/types/export';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const actors: ActorDefinition[] = [
  { id: 'pm', label: 'Project Manager', shortLabel: 'PM', color: '#3B82F6', order: 0 },
  { id: 'finance', label: 'Finance Team', shortLabel: 'FIN', color: '#22C55E', order: 1 },
];

const phases: PhaseDefinition[] = [
  { id: 'intake', label: 'Intake', color: '#FEF3C7', order: 0 },
  { id: 'processing', label: 'Processing', color: '#DBEAFE', order: 1 },
];

const workflow: Workflow = {
  id: 'w1',
  name: 'Test Workflow',
  description: 'A workflow for testing exports',
  actors,
  phases,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const scenario: Scenario = {
  id: 's1',
  workflowId: 'w1',
  name: 'Existing Process',
  description: 'The current process',
  scenarioType: 'existing',
  order: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const version: ScenarioVersion = {
  id: 'v1',
  scenarioId: 's1',
  versionNumber: 1,
  source: 'seed',
  isLatest: true,
  createdAt: '2025-01-01T00:00:00Z',
};

function makeStep(overrides: Partial<WorkflowStep> & { id: string; title: string }): WorkflowStep {
  return {
    versionId: 'v1',
    description: '',
    actorId: 'pm',
    phaseId: 'intake',
    stepType: 'manual',
    column: 0,
    shape: 'process',
    documents: [],
    painPoints: [],
    improvements: [],
    toolsUsed: [],
    subItems: [],
    ...overrides,
  };
}

const steps: WorkflowStep[] = [
  makeStep({
    id: 'step1',
    title: 'Receive Request',
    stepNumber: 1,
    description: 'PM receives draw request',
    actorId: 'pm',
    phaseId: 'intake',
    column: 0,
    painPoints: ['Manual email parsing'],
    improvements: ['Auto-parse emails'],
    documents: ['Draw Request Form'],
    toolsUsed: ['Email', 'Excel'],
    subItems: ['Check completeness', 'Log in tracker'],
    impact: { consistency: 3, cost: 4, control: 2 },
  }),
  makeStep({
    id: 'step2',
    title: 'Review Invoice',
    stepNumber: 2,
    description: 'Finance reviews the invoice',
    actorId: 'finance',
    phaseId: 'processing',
    column: 1,
    shape: 'decision',
    impact: { consistency: 5, cost: 5, control: 5 },
  }),
  makeStep({
    id: 'step3',
    title: 'Approve Payment',
    stepNumber: 3,
    actorId: 'finance',
    phaseId: 'processing',
    column: 2,
  }),
];

const edges: WorkflowEdge[] = [
  { id: 'e1', versionId: 'v1', sourceStepId: 'step1', targetStepId: 'step2', edgeType: 'default' },
  { id: 'e2', versionId: 'v1', sourceStepId: 'step2', targetStepId: 'step3', label: 'Approved', edgeType: 'conditional' },
];

function makeParams(overrides?: Partial<GenerateMarkdownParams>): GenerateMarkdownParams {
  return {
    workflow,
    scenario,
    version,
    steps,
    edges,
    actors,
    phases,
    options: { ...DEFAULT_EXPORT_OPTIONS },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateWorkflowMarkdown', () => {
  it('produces a non-empty string', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('includes the workflow name and scenario name in the header', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Test Workflow');
    expect(result).toContain('Existing Process');
  });

  it('includes version metadata', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Version: 1');
    expect(result).toContain('Source: seed');
    expect(result).toContain('existing');
  });

  it('includes table of contents', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('## Table of Contents');
    expect(result).toContain('Process Overview');
    expect(result).toContain('Actors');
    expect(result).toContain('Process Narrative');
  });

  it('includes process overview with counts', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('**3** steps');
    expect(result).toContain('**2** edges');
    expect(result).toContain('**2** phases');
    expect(result).toContain('**2** actors');
  });

  it('includes actors table', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Project Manager');
    expect(result).toContain('PM');
    expect(result).toContain('Finance Team');
    expect(result).toContain('FIN');
  });

  it('includes phases table', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Intake');
    expect(result).toContain('Processing');
  });

  it('groups steps by phase in the process narrative', () => {
    const result = generateWorkflowMarkdown(makeParams());
    const intakeIndex = result.indexOf('### Phase: Intake');
    const processingIndex = result.indexOf('### Phase: Processing');
    expect(intakeIndex).toBeGreaterThan(-1);
    expect(processingIndex).toBeGreaterThan(intakeIndex);
  });

  it('includes step details: actor, type, shape', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('**Actor**: Project Manager');
    expect(result).toContain('**Type**: manual');
    expect(result).toContain('**Shape**: process');
  });

  it('includes pain points when option enabled', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Manual email parsing');
  });

  it('excludes pain points when option disabled', () => {
    const result = generateWorkflowMarkdown(makeParams({
      options: { ...DEFAULT_EXPORT_OPTIONS, includePainPoints: false },
    }));
    expect(result).not.toContain('Manual email parsing');
  });

  it('includes improvements when option enabled', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Auto\\-parse emails');
  });

  it('excludes improvements when option disabled', () => {
    const result = generateWorkflowMarkdown(makeParams({
      options: { ...DEFAULT_EXPORT_OPTIONS, includeImprovements: false },
    }));
    expect(result).not.toContain('Auto-parse emails');
    expect(result).not.toContain('Auto\\-parse emails');
  });

  it('includes documents and tools', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Draw Request Form');
    expect(result).toContain('Email');
    expect(result).toContain('Excel');
  });

  it('includes sub-items', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Check completeness');
    expect(result).toContain('Log in tracker');
  });

  it('includes edges table with step titles', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('## Process Flow');
    expect(result).toContain('Receive Request');
    expect(result).toContain('Review Invoice');
    expect(result).toContain('Approved');
  });

  it('includes conditional edges in business rules', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Conditional Routing');
    expect(result).toContain('Approved');
  });

  it('identifies decision steps in business rules', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('Decision Points');
    expect(result).toContain('Review Invoice');
  });

  it('includes impact analysis table when enabled', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('## Impact Analysis');
    expect(result).toContain('15/15');
    expect(result).toContain('9/15');
    expect(result).toContain('Critical');
  });

  it('excludes impact analysis when disabled', () => {
    const result = generateWorkflowMarkdown(makeParams({
      options: { ...DEFAULT_EXPORT_OPTIONS, includeImpactScores: false },
    }));
    expect(result).not.toContain('## Impact Analysis');
  });

  it('sorts impact by total descending', () => {
    const result = generateWorkflowMarkdown(makeParams());
    const reviewIndex = result.indexOf('Review Invoice');
    const receiveIndex = result.indexOf('Receive Request');
    // Review Invoice (15) should appear before Receive Request (9) in the impact table
    // Find them specifically in the Impact Analysis section
    const impactSection = result.slice(result.indexOf('## Impact Analysis'));
    const reviewInImpact = impactSection.indexOf('Review Invoice');
    const receiveInImpact = impactSection.indexOf('Receive Request');
    expect(reviewInImpact).toBeLessThan(receiveInImpact);
  });

  it('includes data models section with TypeScript types', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('### Data Models');
    expect(result).toContain('interface WorkflowStepData');
    expect(result).toContain("'pm'");
    expect(result).toContain("'finance'");
  });

  it('excludes data models when disabled', () => {
    const result = generateWorkflowMarkdown(makeParams({
      options: { ...DEFAULT_EXPORT_OPTIONS, includeDataModels: false },
    }));
    expect(result).not.toContain('### Data Models');
  });

  it('excludes entire tech spec when disabled', () => {
    const result = generateWorkflowMarkdown(makeParams({
      options: { ...DEFAULT_EXPORT_OPTIONS, includeTechnicalSpec: false },
    }));
    expect(result).not.toContain('## Technical Specification');
  });

  it('excludes process narrative when disabled', () => {
    const result = generateWorkflowMarkdown(makeParams({
      options: { ...DEFAULT_EXPORT_OPTIONS, includeProcessNarrative: false },
    }));
    expect(result).not.toContain('## Process Narrative');
  });

  it('includes edge cases section', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('### Edge Cases');
    expect(result).toContain('Terminal Steps');
    expect(result).toContain('Entry Points');
  });

  it('handles empty steps gracefully', () => {
    const result = generateWorkflowMarkdown(makeParams({ steps: [], edges: [] }));
    expect(result).toContain('**0** steps');
    expect(result).toContain('No connections defined');
  });

  it('includes attachments section when provided', () => {
    const attachments: ExportAttachment[] = [
      { id: 'a1', exportId: 'x1', fileName: 'diagram.png', filePath: '/w1/x1/diagram.png', fileSize: 1048576, mimeType: 'image/png', displayOrder: 0, createdAt: '2025-01-01T00:00:00Z' },
    ];
    const result = generateWorkflowMarkdown(makeParams({ attachments }));
    expect(result).toContain('## Attachments');
    expect(result).toContain('diagram.png');
    expect(result).toContain('image/png');
    expect(result).toContain('1.0 MB');
  });

  it('excludes attachments section when empty', () => {
    const result = generateWorkflowMarkdown(makeParams({ attachments: [] }));
    expect(result).not.toContain('## Attachments');
  });

  it('includes footer with agent instructions note', () => {
    const result = generateWorkflowMarkdown(makeParams());
    expect(result).toContain('auto-generated as instructions for an AI coding agent');
  });

  it('escapes markdown special characters in titles', () => {
    const specialSteps = [makeStep({
      id: 'sp1',
      title: 'Step with | pipes & *stars*',
      phaseId: 'intake',
      column: 0,
    })];
    const result = generateWorkflowMarkdown(makeParams({ steps: specialSteps, edges: [] }));
    expect(result).toContain('Step with \\| pipes & \\*stars\\*');
  });
});
