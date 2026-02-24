import type {
  Workflow,
  Scenario,
  ScenarioVersion,
  WorkflowStep,
  WorkflowEdge,
  ActorDefinition,
  PhaseDefinition,
  ImpactScore,
  StepType,
  NodeShape,
  ScenarioType,
} from '@/types/workflow';

// =========================================================
// DB row types (snake_case from Supabase)
// =========================================================

export interface DbWorkflow {
  id: string;
  name: string;
  description: string;
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
  created_at: string;
  updated_at: string;
}

export interface DbScenario {
  id: string;
  workflow_id: string;
  name: string;
  description: string;
  scenario_type: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbScenarioVersion {
  id: string;
  scenario_id: string;
  version_number: number;
  label: string | null;
  source: string;
  is_latest: boolean;
  created_at: string;
}

export interface DbWorkflowStep {
  id: string;
  version_id: string;
  step_number: number | null;
  title: string;
  description: string;
  actor_id: string;
  phase_id: string;
  step_type: string;
  documents: string[];
  pain_points: string[];
  improvements: string[];
  tools_used: string[];
  column: number;
  branch: string | null;
  sub_items: string[];
  shape: string;
  impact: ImpactScore | null;
  position_x: number | null;
  position_y: number | null;
}

export interface DbWorkflowEdge {
  id: string;
  version_id: string;
  source_step_id: string;
  target_step_id: string;
  label: string | null;
  edge_type: string;
  animated: boolean;
}

// =========================================================
// DB → Domain transforms
// =========================================================

export function toWorkflow(row: DbWorkflow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    actors: row.actors ?? [],
    phases: row.phases ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toScenario(row: DbScenario): Scenario {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    name: row.name,
    description: row.description,
    scenarioType: row.scenario_type as ScenarioType,
    order: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toVersion(row: DbScenarioVersion): ScenarioVersion {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    versionNumber: row.version_number,
    label: row.label ?? undefined,
    source: row.source as ScenarioVersion['source'],
    isLatest: row.is_latest,
    createdAt: row.created_at,
  };
}

export function toStep(row: DbWorkflowStep): WorkflowStep {
  return {
    id: row.id,
    versionId: row.version_id,
    stepNumber: row.step_number ?? undefined,
    title: row.title,
    description: row.description,
    actorId: row.actor_id,
    phaseId: row.phase_id,
    stepType: row.step_type as StepType,
    documents: row.documents ?? [],
    painPoints: row.pain_points ?? [],
    improvements: row.improvements ?? [],
    toolsUsed: row.tools_used ?? [],
    column: row.column,
    branch: row.branch ?? undefined,
    subItems: row.sub_items ?? [],
    shape: (row.shape as NodeShape) ?? 'process',
    impact: row.impact ?? undefined,
    positionX: row.position_x ?? undefined,
    positionY: row.position_y ?? undefined,
  };
}

export function toEdge(row: DbWorkflowEdge): WorkflowEdge {
  return {
    id: row.id,
    versionId: row.version_id,
    sourceStepId: row.source_step_id,
    targetStepId: row.target_step_id,
    label: row.label ?? undefined,
    edgeType: (row.edge_type as WorkflowEdge['edgeType']) ?? 'default',
    animated: row.animated ?? false,
  };
}

// =========================================================
// Domain → DB transforms (for inserts/updates)
// =========================================================

export function fromStep(step: WorkflowStep): Omit<DbWorkflowStep, 'id'> & { id?: string } {
  return {
    id: step.id,
    version_id: step.versionId,
    step_number: step.stepNumber ?? null,
    title: step.title,
    description: step.description,
    actor_id: step.actorId,
    phase_id: step.phaseId,
    step_type: step.stepType,
    documents: step.documents ?? [],
    pain_points: step.painPoints ?? [],
    improvements: step.improvements ?? [],
    tools_used: step.toolsUsed ?? [],
    column: step.column,
    branch: step.branch ?? null,
    sub_items: step.subItems ?? [],
    shape: step.shape ?? 'process',
    impact: step.impact ?? null,
    position_x: step.positionX ?? null,
    position_y: step.positionY ?? null,
  };
}

export function fromEdge(edge: WorkflowEdge): Omit<DbWorkflowEdge, 'id'> & { id?: string } {
  return {
    id: edge.id,
    version_id: edge.versionId,
    source_step_id: edge.sourceStepId,
    target_step_id: edge.targetStepId,
    label: edge.label ?? null,
    edge_type: edge.edgeType ?? 'default',
    animated: edge.animated ?? false,
  };
}
