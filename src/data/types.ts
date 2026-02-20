/** The three workflow views */
export type ViewId = 'current' | 'digitized' | 'transformed';

/** Actors that perform steps (each maps to a swimlane row) */
export type ActorId =
  | 'vendors'
  | 'madigan-pm'
  | 'madigan-dev-exec'
  | 'madigan-exec-approval'
  | 'ownership'
  | 'billing-platform';

/** Classification of a step's nature */
export type StepType = 'manual' | 'automated' | 'data-driven' | 'hybrid';

/** Process phases / sections */
export type ProcessPhase =
  | 'pre-draw'
  | 'invoice-receipt'
  | 'invoice-processing'
  | 'invoice-tabulation'
  | 'draw-assembly'
  | 'post-approval'
  | 'payment-check'
  | 'payment-ach';

/** A swimlane definition */
export interface Lane {
  id: string;
  label: string;
  shortLabel: string;
  actors: ActorId[];
  color: string;
  order: number;
}

/** Impact assessment for a process step (each rated 1-5) */
export interface ImpactScore {
  /** How often the pain point occurs. 1 = infrequent, 5 = constant */
  consistency: number;
  /** Financial impact of the pain point. 1 = low cost, 5 = very costly */
  cost: number;
  /** Ability to control/change the pain point. 1 = external/no leverage, 5 = easily within control */
  control: number;
}

/** A single process step */
export interface WorkflowStep {
  id: string;
  stepNumber?: number;
  title: string;
  description: string;
  actor: ActorId;
  phase: ProcessPhase;
  stepType: StepType;
  documents?: string[];
  painPoints?: string[];
  improvements?: string[];
  toolsUsed?: string[];
  /** Horizontal column index for layout */
  column: number;
  /** For parallel payment paths */
  branch?: 'check' | 'ach';
  /** Sub-items for steps with detailed lists */
  subItems?: string[];
  /** Impact assessment scores (each 1-5). Total Change Impact = sum (3-15) */
  impact?: ImpactScore;
}

/** A connection between two steps */
export interface WorkflowEdge {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  label?: string;
  edgeType?: 'default' | 'conditional';
  animated?: boolean;
}

/** Complete workflow definition for a single view */
export interface WorkflowView {
  id: ViewId;
  label: string;
  description: string;
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
}
