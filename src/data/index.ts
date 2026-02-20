import { ViewId, WorkflowView } from './types';
import { currentState } from './current-state';
import { digitized } from './digitized';
import { transformed } from './transformed';

export { lanes, getLaneForActor } from './lanes';
export type { Lane, ViewId, ActorId, StepType, ImpactScore, WorkflowStep, WorkflowEdge, WorkflowView } from './types';

const views: Record<ViewId, WorkflowView> = {
  current: currentState,
  digitized,
  transformed,
};

export function getWorkflowView(viewId: ViewId): WorkflowView {
  return views[viewId];
}

export function getAllViewIds(): ViewId[] {
  return ['current', 'digitized', 'transformed'];
}
