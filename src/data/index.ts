import { ViewId, WorkflowView } from './types';
import { currentState } from './current-state';

export { lanes, getLaneForActor } from './lanes';
export type { Lane, ViewId, ActorId, StepType, ImpactScore, WorkflowStep, WorkflowEdge, WorkflowView } from './types';

const views: Record<ViewId, WorkflowView> = {
  current: currentState,
  // Placeholder views - will be populated in Phase 2
  digitized: {
    id: 'digitized',
    label: 'Digitized',
    description: 'Automated version of the existing draw process',
    steps: [],
    edges: [],
  },
  transformed: {
    id: 'transformed',
    label: 'Digitally Transformed',
    description: 'Data-rich, fully reimagined draw process',
    steps: [],
    edges: [],
  },
};

export function getWorkflowView(viewId: ViewId): WorkflowView {
  return views[viewId];
}

export function getAllViewIds(): ViewId[] {
  return ['current', 'digitized', 'transformed'];
}
