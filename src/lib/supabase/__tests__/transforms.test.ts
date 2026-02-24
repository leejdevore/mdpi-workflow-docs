import { describe, it, expect } from 'vitest';
import {
  toWorkflow,
  toScenario,
  toVersion,
  toStep,
  toEdge,
  fromStep,
  fromEdge,
  type DbWorkflow,
  type DbScenario,
  type DbScenarioVersion,
  type DbWorkflowStep,
  type DbWorkflowEdge,
} from '../transforms';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const dbWorkflow: DbWorkflow = {
  id: 'w1',
  name: 'Test Workflow',
  description: 'A workflow for testing',
  actors: [{ id: 'a1', label: 'Actor 1', shortLabel: 'A1', color: '#000', order: 0 }],
  phases: [{ id: 'p1', label: 'Phase 1', color: '#111', order: 0 }],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
};

const dbScenario: DbScenario = {
  id: 's1',
  workflow_id: 'w1',
  name: 'Existing',
  description: 'The existing process',
  scenario_type: 'existing',
  display_order: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
};

const dbVersion: DbScenarioVersion = {
  id: 'v1',
  scenario_id: 's1',
  version_number: 1,
  label: 'Initial',
  source: 'seed',
  is_latest: true,
  created_at: '2025-01-01T00:00:00Z',
};

const dbStep: DbWorkflowStep = {
  id: 'step1',
  version_id: 'v1',
  step_number: 1,
  title: 'Receive Invoice',
  description: 'First step',
  actor_id: 'vendors',
  phase_id: 'invoice-receipt',
  step_type: 'manual',
  documents: ['Invoice.pdf'],
  pain_points: ['Slow'],
  improvements: ['Automate'],
  tools_used: ['Email'],
  column: 0,
  branch: 'check',
  sub_items: ['Sub 1'],
  shape: 'document',
  impact: { consistency: 3, cost: 4, control: 2 },
  position_x: 100,
  position_y: 200,
};

const dbEdge: DbWorkflowEdge = {
  id: 'e1',
  version_id: 'v1',
  source_step_id: 'step1',
  target_step_id: 'step2',
  label: 'Yes',
  edge_type: 'conditional',
  animated: true,
};

// ---------------------------------------------------------------------------
// DB -> Domain
// ---------------------------------------------------------------------------

describe('toWorkflow', () => {
  it('maps all fields from DB row to domain model', () => {
    const result = toWorkflow(dbWorkflow);
    expect(result).toEqual({
      id: 'w1',
      name: 'Test Workflow',
      description: 'A workflow for testing',
      actors: dbWorkflow.actors,
      phases: dbWorkflow.phases,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });
  });

  it('defaults actors and phases to empty arrays when null', () => {
    const row = { ...dbWorkflow, actors: null as unknown as DbWorkflow['actors'], phases: null as unknown as DbWorkflow['phases'] };
    const result = toWorkflow(row);
    expect(result.actors).toEqual([]);
    expect(result.phases).toEqual([]);
  });
});

describe('toScenario', () => {
  it('maps DB scenario to domain model', () => {
    const result = toScenario(dbScenario);
    expect(result).toEqual({
      id: 's1',
      workflowId: 'w1',
      name: 'Existing',
      description: 'The existing process',
      scenarioType: 'existing',
      order: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });
  });
});

describe('toVersion', () => {
  it('maps DB version to domain model', () => {
    const result = toVersion(dbVersion);
    expect(result).toEqual({
      id: 'v1',
      scenarioId: 's1',
      versionNumber: 1,
      label: 'Initial',
      source: 'seed',
      isLatest: true,
      createdAt: '2025-01-01T00:00:00Z',
    });
  });

  it('converts null label to undefined', () => {
    const row = { ...dbVersion, label: null };
    const result = toVersion(row);
    expect(result.label).toBeUndefined();
  });
});

describe('toStep', () => {
  it('maps all DB step fields to domain model', () => {
    const result = toStep(dbStep);
    expect(result).toEqual({
      id: 'step1',
      versionId: 'v1',
      stepNumber: 1,
      title: 'Receive Invoice',
      description: 'First step',
      actorId: 'vendors',
      phaseId: 'invoice-receipt',
      stepType: 'manual',
      documents: ['Invoice.pdf'],
      painPoints: ['Slow'],
      improvements: ['Automate'],
      toolsUsed: ['Email'],
      column: 0,
      branch: 'check',
      subItems: ['Sub 1'],
      shape: 'document',
      impact: { consistency: 3, cost: 4, control: 2 },
      positionX: 100,
      positionY: 200,
    });
  });

  it('converts null arrays to empty arrays', () => {
    const row = {
      ...dbStep,
      documents: null as unknown as string[],
      pain_points: null as unknown as string[],
      improvements: null as unknown as string[],
      tools_used: null as unknown as string[],
      sub_items: null as unknown as string[],
    };
    const result = toStep(row);
    expect(result.documents).toEqual([]);
    expect(result.painPoints).toEqual([]);
    expect(result.improvements).toEqual([]);
    expect(result.toolsUsed).toEqual([]);
    expect(result.subItems).toEqual([]);
  });

  it('converts null step_number to undefined', () => {
    const row = { ...dbStep, step_number: null };
    const result = toStep(row);
    expect(result.stepNumber).toBeUndefined();
  });

  it('converts null branch to undefined', () => {
    const row = { ...dbStep, branch: null };
    const result = toStep(row);
    expect(result.branch).toBeUndefined();
  });

  it('converts null impact to undefined', () => {
    const row = { ...dbStep, impact: null };
    const result = toStep(row);
    expect(result.impact).toBeUndefined();
  });

  it('converts null position to undefined', () => {
    const row = { ...dbStep, position_x: null, position_y: null };
    const result = toStep(row);
    expect(result.positionX).toBeUndefined();
    expect(result.positionY).toBeUndefined();
  });

  it('defaults null shape to process', () => {
    const row = { ...dbStep, shape: null as unknown as string };
    const result = toStep(row);
    expect(result.shape).toBe('process');
  });
});

describe('toEdge', () => {
  it('maps all DB edge fields to domain model', () => {
    const result = toEdge(dbEdge);
    expect(result).toEqual({
      id: 'e1',
      versionId: 'v1',
      sourceStepId: 'step1',
      targetStepId: 'step2',
      label: 'Yes',
      edgeType: 'conditional',
      animated: true,
    });
  });

  it('converts null label to undefined', () => {
    const row = { ...dbEdge, label: null };
    const result = toEdge(row);
    expect(result.label).toBeUndefined();
  });

  it('defaults null animated to false', () => {
    const row = { ...dbEdge, animated: null as unknown as boolean };
    const result = toEdge(row);
    expect(result.animated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Domain -> DB
// ---------------------------------------------------------------------------

describe('fromStep', () => {
  it('maps domain step to DB row', () => {
    const step = toStep(dbStep);
    const result = fromStep(step);
    expect(result).toEqual({
      id: 'step1',
      version_id: 'v1',
      step_number: 1,
      title: 'Receive Invoice',
      description: 'First step',
      actor_id: 'vendors',
      phase_id: 'invoice-receipt',
      step_type: 'manual',
      documents: ['Invoice.pdf'],
      pain_points: ['Slow'],
      improvements: ['Automate'],
      tools_used: ['Email'],
      column: 0,
      branch: 'check',
      sub_items: ['Sub 1'],
      shape: 'document',
      impact: { consistency: 3, cost: 4, control: 2 },
      position_x: 100,
      position_y: 200,
    });
  });

  it('converts undefined optional fields to null', () => {
    const step = toStep({ ...dbStep, step_number: null, branch: null, impact: null, position_x: null, position_y: null });
    const result = fromStep(step);
    expect(result.step_number).toBeNull();
    expect(result.branch).toBeNull();
    expect(result.impact).toBeNull();
    expect(result.position_x).toBeNull();
    expect(result.position_y).toBeNull();
  });
});

describe('fromEdge', () => {
  it('maps domain edge to DB row', () => {
    const edge = toEdge(dbEdge);
    const result = fromEdge(edge);
    expect(result).toEqual({
      id: 'e1',
      version_id: 'v1',
      source_step_id: 'step1',
      target_step_id: 'step2',
      label: 'Yes',
      edge_type: 'conditional',
      animated: true,
    });
  });

  it('converts undefined label to null', () => {
    const edge = toEdge({ ...dbEdge, label: null });
    const result = fromEdge(edge);
    expect(result.label).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Round-trip tests
// ---------------------------------------------------------------------------

describe('round-trip: step', () => {
  it('DB -> domain -> DB preserves data', () => {
    const step = toStep(dbStep);
    const backToDb = fromStep(step);
    // Re-transform to domain to verify
    const roundTripped = toStep(backToDb as DbWorkflowStep);
    expect(roundTripped).toEqual(step);
  });
});

describe('round-trip: edge', () => {
  it('DB -> domain -> DB preserves data', () => {
    const edge = toEdge(dbEdge);
    const backToDb = fromEdge(edge);
    const roundTripped = toEdge(backToDb as DbWorkflowEdge);
    expect(roundTripped).toEqual(edge);
  });
});
