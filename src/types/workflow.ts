/** UUID string type alias for clarity */
export type UUID = string;

/** Scenario maturity level categories */
export type ScenarioType = 'existing' | 'digitized' | 'transformed' | 'custom';

/** Classification of a step's nature */
export type StepType = 'manual' | 'automated' | 'data-driven' | 'hybrid';

/** Workflow shape types for visual representation */
export type NodeShape =
  | 'process'
  | 'decision'
  | 'document'
  | 'data'
  | 'start-end'
  | 'manual-operation'
  | 'subprocess'
  | 'validation';

/** Impact assessment for a process step (each rated 1-5) */
export interface ImpactScore {
  consistency: number;
  cost: number;
  control: number;
}

// =========================================================
// Actor & Phase Definitions (per-workflow, not global)
// =========================================================

export interface ActorDefinition {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  order: number;
}

export interface PhaseDefinition {
  id: string;
  label: string;
  color: string;
  order: number;
}

// =========================================================
// Core Domain Entities
// =========================================================

/** A Workflow is a business process (e.g., "Draws") */
export interface Workflow {
  id: UUID;
  name: string;
  description: string;
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
  createdAt: string;
  updatedAt: string;
}

/** A Scenario is a variant of a workflow (existing, digitized, etc.) */
export interface Scenario {
  id: UUID;
  workflowId: UUID;
  name: string;
  description: string;
  scenarioType: ScenarioType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** A Version is a snapshot of a scenario's steps and edges */
export interface ScenarioVersion {
  id: UUID;
  scenarioId: UUID;
  versionNumber: number;
  label?: string;
  source: 'manual' | 'csv-import' | 'ai-generated' | 'seed';
  isLatest: boolean;
  createdAt: string;
}

/** A single process step (persisted) */
export interface WorkflowStep {
  id: UUID;
  versionId: UUID;
  stepNumber?: number;
  title: string;
  description: string;
  actorId: string;
  phaseId: string;
  stepType: StepType;
  documents?: string[];
  painPoints?: string[];
  improvements?: string[];
  toolsUsed?: string[];
  column: number;
  branch?: string;
  subItems?: string[];
  shape?: NodeShape;
  impact?: ImpactScore;
  positionX?: number;
  positionY?: number;
}

/** A connection between two steps (persisted) */
export interface WorkflowEdge {
  id: UUID;
  versionId: UUID;
  sourceStepId: UUID;
  targetStepId: UUID;
  label?: string;
  edgeType?: 'default' | 'conditional';
  animated?: boolean;
}

// =========================================================
// Meta-Workflow (Workflow-as-Node) Types
// =========================================================

export interface MetaWorkflow {
  id: UUID;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaWorkflowNode {
  id: UUID;
  metaWorkflowId: UUID;
  childWorkflowId: UUID;
  positionX: number;
  positionY: number;
  isBranch: boolean;
  branchScenarioId?: UUID;
}

export interface MetaWorkflowEdge {
  id: UUID;
  metaWorkflowId: UUID;
  sourceNodeId: UUID;
  targetNodeId: UUID;
  label?: string;
}

// =========================================================
// Navigation / UI State
// =========================================================

export interface NavTreeWorkflow {
  id: UUID;
  name: string;
  description: string;
  scenarios: NavTreeScenario[];
}

export interface NavTreeScenario {
  id: UUID;
  name: string;
  scenarioType: ScenarioType;
  versionCount: number;
  latestVersionId: UUID;
}

export interface ActiveSelection {
  workflowId: UUID;
  scenarioId: UUID;
  versionId: UUID;
}
