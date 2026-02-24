/**
 * Seed script: migrates the 3 static data files into Supabase as the "Draws" workflow.
 *
 * Usage (from browser console or a one-off page/API route):
 *   import { seedDrawsWorkflow } from '@/lib/supabase/seed';
 *   await seedDrawsWorkflow();
 */
import { createClient } from './client';
import { currentState } from '@/data/current-state';
import { digitized } from '@/data/digitized';
import { transformed } from '@/data/transformed';
import { lanes } from '@/data/lanes';
import { phaseColors, phaseLabels } from '@/styles/flow-theme';
import type { WorkflowView, WorkflowStep as OldStep, WorkflowEdge as OldEdge } from '@/data/types';
import type { ActorDefinition, PhaseDefinition } from '@/types/workflow';

/** Derive ActorDefinitions from existing lanes */
function buildActors(): ActorDefinition[] {
  return lanes.map((lane) => ({
    id: lane.id,
    label: lane.label,
    shortLabel: lane.shortLabel,
    color: lane.color,
    order: lane.order,
  }));
}

/** Derive PhaseDefinitions from the phase maps */
function buildPhases(): PhaseDefinition[] {
  const phaseOrder = [
    'pre-draw',
    'invoice-receipt',
    'invoice-processing',
    'invoice-tabulation',
    'draw-assembly',
    'post-approval',
    'payment-check',
    'payment-ach',
  ];
  return phaseOrder.map((id, idx) => ({
    id,
    label: phaseLabels[id] ?? id,
    color: phaseColors[id] ?? '#F1F5F9',
    order: idx,
  }));
}

type ScenarioType = 'existing' | 'digitized' | 'transformed';

const scenarioMeta: { view: WorkflowView; type: ScenarioType; order: number }[] = [
  { view: currentState, type: 'existing', order: 0 },
  { view: digitized, type: 'digitized', order: 1 },
  { view: transformed, type: 'transformed', order: 2 },
];

export async function seedDrawsWorkflow() {
  const supabase = createClient();
  const actors = buildActors();
  const phases = buildPhases();

  // 1. Create the "Draws" workflow
  const { data: workflow, error: wErr } = await supabase
    .from('workflows')
    .insert({
      name: 'Draws',
      description: 'Real estate development draw process workflow',
      actors,
      phases,
    })
    .select()
    .single();

  if (wErr) throw new Error(`Failed to create workflow: ${wErr.message}`);
  console.log('Created workflow:', workflow.id);

  // 2. For each scenario, create scenario + version + steps + edges
  for (const { view, type, order } of scenarioMeta) {
    // Create scenario
    const { data: scenario, error: sErr } = await supabase
      .from('scenarios')
      .insert({
        workflow_id: workflow.id,
        name: view.label,
        description: view.description,
        scenario_type: type,
        display_order: order,
      })
      .select()
      .single();

    if (sErr) throw new Error(`Failed to create scenario ${type}: ${sErr.message}`);
    console.log(`Created scenario: ${scenario.id} (${type})`);

    // Create version 1
    const { data: version, error: vErr } = await supabase
      .from('scenario_versions')
      .insert({
        scenario_id: scenario.id,
        version_number: 1,
        source: 'seed',
        is_latest: true,
      })
      .select()
      .single();

    if (vErr) throw new Error(`Failed to create version for ${type}: ${vErr.message}`);
    console.log(`Created version: ${version.id}`);

    // Insert steps — we need to create a mapping from old IDs to new UUIDs for edge FK references
    const oldIdToNewId = new Map<string, string>();

    if (view.steps.length > 0) {
      const stepRows = view.steps.map((step: OldStep) => ({
        version_id: version.id,
        step_number: step.stepNumber ?? null,
        title: step.title,
        description: step.description,
        actor_id: step.actor,
        phase_id: step.phase,
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
        position_x: null,
        position_y: null,
      }));

      // Insert steps one by one to get UUIDs and build the mapping
      for (let i = 0; i < stepRows.length; i++) {
        const { data: newStep, error: stepErr } = await supabase
          .from('workflow_steps')
          .insert(stepRows[i])
          .select()
          .single();

        if (stepErr) throw new Error(`Failed to insert step ${view.steps[i].id}: ${stepErr.message}`);
        oldIdToNewId.set(view.steps[i].id, newStep.id);
      }
      console.log(`Inserted ${view.steps.length} steps`);
    }

    // Insert edges using the ID mapping
    if (view.edges.length > 0) {
      const edgeRows = view.edges
        .map((edge: OldEdge) => {
          const sourceId = oldIdToNewId.get(edge.sourceStepId);
          const targetId = oldIdToNewId.get(edge.targetStepId);
          if (!sourceId || !targetId) {
            console.warn(`Skipping edge ${edge.id}: missing step mapping`);
            return null;
          }
          return {
            version_id: version.id,
            source_step_id: sourceId,
            target_step_id: targetId,
            label: edge.label ?? null,
            edge_type: edge.edgeType ?? 'default',
            animated: edge.animated ?? false,
          };
        })
        .filter(Boolean);

      if (edgeRows.length > 0) {
        const { error: eErr } = await supabase
          .from('workflow_edges')
          .insert(edgeRows);

        if (eErr) throw new Error(`Failed to insert edges for ${type}: ${eErr.message}`);
        console.log(`Inserted ${edgeRows.length} edges`);
      }
    }
  }

  console.log('Seed complete!');
  return workflow.id;
}
