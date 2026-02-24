import { createClient } from './client';
import {
  toWorkflow,
  toScenario,
  toVersion,
  toStep,
  toEdge,
  fromStep,
  fromEdge,
} from './transforms';
import type {
  Workflow,
  Scenario,
  ScenarioVersion,
  WorkflowStep,
  WorkflowEdge,
  NavTreeWorkflow,
  NavTreeScenario,
  ActorDefinition,
  PhaseDefinition,
  UUID,
  ScenarioType,
} from '@/types/workflow';

// =========================================================
// Fetch operations
// =========================================================

/** Fetch all workflows with their scenarios for the nav tree */
export async function fetchWorkflowTree(): Promise<NavTreeWorkflow[]> {
  const supabase = createClient();

  const { data: workflows, error: wErr } = await supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: true });

  if (wErr) throw wErr;
  if (!workflows) return [];

  const { data: scenarios, error: sErr } = await supabase
    .from('scenarios')
    .select('*, scenario_versions(id, version_number, is_latest)')
    .order('display_order', { ascending: true });

  if (sErr) throw sErr;

  const scenarioMap = new Map<string, NavTreeScenario[]>();
  for (const s of scenarios ?? []) {
    const versions = (s.scenario_versions ?? []) as Array<{
      id: string;
      version_number: number;
      is_latest: boolean;
    }>;
    const latest = versions.find((v) => v.is_latest) ?? versions[0];

    const entry: NavTreeScenario = {
      id: s.id,
      name: s.name,
      scenarioType: s.scenario_type as ScenarioType,
      versionCount: versions.length,
      latestVersionId: latest?.id ?? '',
    };

    const existing = scenarioMap.get(s.workflow_id) ?? [];
    existing.push(entry);
    scenarioMap.set(s.workflow_id, existing);
  }

  return workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    scenarios: scenarioMap.get(w.id) ?? [],
  }));
}

/** Fetch a single workflow */
export async function fetchWorkflow(workflowId: UUID): Promise<Workflow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error) return null;
  return toWorkflow(data);
}

/** Fetch scenarios for a workflow */
export async function fetchScenarios(workflowId: UUID): Promise<Scenario[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toScenario);
}

/** Fetch the latest version for a scenario */
export async function fetchLatestVersion(scenarioId: UUID): Promise<ScenarioVersion | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scenario_versions')
    .select('*')
    .eq('scenario_id', scenarioId)
    .eq('is_latest', true)
    .single();

  if (error) return null;
  return toVersion(data);
}

/** Fetch steps and edges for a version */
export async function fetchVersionData(
  versionId: UUID
): Promise<{ steps: WorkflowStep[]; edges: WorkflowEdge[] }> {
  const supabase = createClient();

  const [stepsRes, edgesRes] = await Promise.all([
    supabase
      .from('workflow_steps')
      .select('*')
      .eq('version_id', versionId)
      .order('step_number', { ascending: true }),
    supabase
      .from('workflow_edges')
      .select('*')
      .eq('version_id', versionId),
  ]);

  if (stepsRes.error) throw stepsRes.error;
  if (edgesRes.error) throw edgesRes.error;

  return {
    steps: (stepsRes.data ?? []).map(toStep),
    edges: (edgesRes.data ?? []).map(toEdge),
  };
}

// =========================================================
// Create operations
// =========================================================

export async function createWorkflow(
  name: string,
  description: string,
  actors: ActorDefinition[],
  phases: PhaseDefinition[]
): Promise<Workflow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workflows')
    .insert({ name, description, actors, phases })
    .select()
    .single();

  if (error) throw error;
  return toWorkflow(data);
}

export async function createScenario(
  workflowId: UUID,
  name: string,
  scenarioType: ScenarioType,
  order: number,
  description = ''
): Promise<Scenario> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scenarios')
    .insert({
      workflow_id: workflowId,
      name,
      description,
      scenario_type: scenarioType,
      display_order: order,
    })
    .select()
    .single();

  if (error) throw error;
  return toScenario(data);
}

export async function createVersion(
  scenarioId: UUID,
  versionNumber: number,
  source: ScenarioVersion['source'],
  label?: string
): Promise<ScenarioVersion> {
  const supabase = createClient();

  // Mark previous versions as not latest
  await supabase
    .from('scenario_versions')
    .update({ is_latest: false })
    .eq('scenario_id', scenarioId)
    .eq('is_latest', true);

  const { data, error } = await supabase
    .from('scenario_versions')
    .insert({
      scenario_id: scenarioId,
      version_number: versionNumber,
      source,
      label: label ?? null,
      is_latest: true,
    })
    .select()
    .single();

  if (error) throw error;
  return toVersion(data);
}

/** Insert steps for a version */
export async function insertSteps(steps: WorkflowStep[]): Promise<WorkflowStep[]> {
  if (steps.length === 0) return [];
  const supabase = createClient();
  const rows = steps.map(fromStep);
  const { data, error } = await supabase
    .from('workflow_steps')
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []).map(toStep);
}

/** Insert edges for a version */
export async function insertEdges(edges: WorkflowEdge[]): Promise<WorkflowEdge[]> {
  if (edges.length === 0) return [];
  const supabase = createClient();
  const rows = edges.map(fromEdge);
  const { data, error } = await supabase
    .from('workflow_edges')
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []).map(toEdge);
}

// =========================================================
// Update operations
// =========================================================

/** Save all steps for a version (delete existing + reinsert) */
export async function saveVersionData(
  versionId: UUID,
  steps: WorkflowStep[],
  edges: WorkflowEdge[]
): Promise<void> {
  const supabase = createClient();

  // Delete existing edges first (FK constraint), then steps
  await supabase.from('workflow_edges').delete().eq('version_id', versionId);
  await supabase.from('workflow_steps').delete().eq('version_id', versionId);

  // Insert new data
  if (steps.length > 0) {
    const stepRows = steps.map(fromStep);
    const { error: sErr } = await supabase.from('workflow_steps').insert(stepRows);
    if (sErr) throw sErr;
  }

  if (edges.length > 0) {
    const edgeRows = edges.map(fromEdge);
    const { error: eErr } = await supabase.from('workflow_edges').insert(edgeRows);
    if (eErr) throw eErr;
  }
}

// =========================================================
// Delete operations
// =========================================================

export async function deleteWorkflow(id: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('workflows').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteScenario(id: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw error;
}
