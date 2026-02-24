import type {
  Workflow,
  Scenario,
  ScenarioVersion,
  WorkflowStep,
  WorkflowEdge,
  ActorDefinition,
  PhaseDefinition,
} from '@/types/workflow';
import type { MarkdownExportOptions, ExportAttachment } from '@/types/export';

// =========================================================
// Public API
// =========================================================

export interface GenerateMarkdownParams {
  workflow: Workflow;
  scenario: Scenario;
  version: ScenarioVersion;
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
  options: MarkdownExportOptions;
  attachments?: ExportAttachment[];
}

/**
 * Generate a structured markdown document from workflow data.
 * The output serves as instructions for an AI coding agent to build
 * a workflow app module.
 *
 * Pure function — no side effects, no React/Supabase dependencies.
 */
export function generateWorkflowMarkdown(params: GenerateMarkdownParams): string {
  const { workflow, scenario, version, steps, edges, actors, phases, options, attachments } = params;

  const sections: string[] = [];

  sections.push(generateHeader(workflow, scenario, version));
  sections.push(generateTableOfContents(options, attachments));
  sections.push(generateProcessOverview(workflow, steps, edges, actors, phases));
  sections.push(generateActorsTable(actors));
  sections.push(generatePhasesTable(phases));

  if (options.includeProcessNarrative) {
    sections.push(generateProcessNarrative(steps, actors, phases, options));
  }

  sections.push(generateEdgesTable(edges, steps));

  if (options.includeTechnicalSpec) {
    const techSections: string[] = [];
    techSections.push('## Technical Specification\n');

    if (options.includeDataModels) {
      techSections.push(generateDataModels(steps, actors, phases));
    }
    if (options.includeBusinessRules) {
      techSections.push(generateBusinessRules(steps, edges));
    }
    if (options.includeEdgeCases) {
      techSections.push(generateEdgeCases(steps, edges));
    }

    sections.push(techSections.join('\n'));
  }

  if (options.includeImpactScores) {
    sections.push(generateImpactAnalysis(steps));
  }

  if (attachments && attachments.length > 0) {
    sections.push(generateAttachmentsSection(attachments));
  }

  sections.push(generateFooter());

  return sections.filter(Boolean).join('\n---\n\n');
}

// =========================================================
// Section generators
// =========================================================

function generateHeader(workflow: Workflow, scenario: Scenario, version: ScenarioVersion): string {
  const date = new Date().toISOString().split('T')[0];
  return [
    `# ${escapeMarkdown(workflow.name)} — ${escapeMarkdown(scenario.name)} Specification\n`,
    `> Exported from MDPI Workflow Docs on ${date}`,
    `> Scenario: ${scenario.scenarioType} | Version: ${version.versionNumber} | Source: ${version.source}`,
    '',
  ].join('\n');
}

function generateTableOfContents(options: MarkdownExportOptions, attachments?: ExportAttachment[]): string {
  const toc = ['## Table of Contents\n'];
  toc.push('- [Process Overview](#process-overview)');
  toc.push('- [Actors](#actors)');
  toc.push('- [Phases](#phases)');

  if (options.includeProcessNarrative) {
    toc.push('- [Process Narrative](#process-narrative)');
  }

  toc.push('- [Process Flow](#process-flow)');

  if (options.includeTechnicalSpec) {
    toc.push('- [Technical Specification](#technical-specification)');
    if (options.includeDataModels) toc.push('  - [Data Models](#data-models)');
    if (options.includeBusinessRules) toc.push('  - [Business Rules](#business-rules)');
    if (options.includeEdgeCases) toc.push('  - [Edge Cases](#edge-cases)');
  }

  if (options.includeImpactScores) {
    toc.push('- [Impact Analysis](#impact-analysis)');
  }

  if (attachments && attachments.length > 0) {
    toc.push('- [Attachments](#attachments)');
  }

  toc.push('');
  return toc.join('\n');
}

function generateProcessOverview(
  workflow: Workflow,
  steps: WorkflowStep[],
  edges: WorkflowEdge[],
  actors: ActorDefinition[],
  phases: PhaseDefinition[],
): string {
  const lines = ['## Process Overview\n'];

  if (workflow.description) {
    lines.push(escapeMarkdown(workflow.description));
    lines.push('');
  }

  lines.push(
    `This workflow contains **${steps.length}** steps connected by **${edges.length}** edges, ` +
    `spanning **${phases.length}** phases performed by **${actors.length}** actors.`,
  );
  lines.push('');

  return lines.join('\n');
}

function generateActorsTable(actors: ActorDefinition[]): string {
  const sorted = [...actors].sort((a, b) => a.order - b.order);
  const lines = ['## Actors\n'];
  lines.push('| # | Actor | Short Label | Lane Color |');
  lines.push('|---|-------|-------------|------------|');

  for (const actor of sorted) {
    lines.push(
      `| ${actor.order + 1} | ${escapeMarkdown(actor.label)} | ${escapeMarkdown(actor.shortLabel)} | \`${actor.color}\` |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

function generatePhasesTable(phases: PhaseDefinition[]): string {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const lines = ['## Phases\n'];
  lines.push('| # | Phase | Color |');
  lines.push('|---|-------|-------|');

  for (const phase of sorted) {
    lines.push(`| ${phase.order + 1} | ${escapeMarkdown(phase.label)} | \`${phase.color}\` |`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateProcessNarrative(
  steps: WorkflowStep[],
  actors: ActorDefinition[],
  phases: PhaseDefinition[],
  options: MarkdownExportOptions,
): string {
  const actorMap = new Map(actors.map((a) => [a.id, a]));
  const phaseMap = new Map(phases.map((p) => [p.id, p]));
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  const lines = ['## Process Narrative\n'];

  for (const phase of sortedPhases) {
    const phaseSteps = steps
      .filter((s) => s.phaseId === phase.id)
      .sort((a, b) => (a.stepNumber ?? a.column) - (b.stepNumber ?? b.column));

    if (phaseSteps.length === 0) continue;

    lines.push(`### Phase: ${escapeMarkdown(phase.label)}\n`);

    for (const step of phaseSteps) {
      const actor = actorMap.get(step.actorId);
      const stepLabel = step.stepNumber != null ? `Step ${step.stepNumber}` : `Step`;

      lines.push(`#### ${stepLabel}: ${escapeMarkdown(step.title)}\n`);
      lines.push(`- **Actor**: ${actor ? escapeMarkdown(actor.label) : step.actorId}`);
      lines.push(`- **Type**: ${step.stepType}`);
      lines.push(`- **Shape**: ${step.shape ?? 'process'}`);

      if (step.description) {
        lines.push(`- **Description**: ${escapeMarkdown(step.description)}`);
      }

      lines.push('');

      if (step.subItems && step.subItems.length > 0) {
        lines.push('**Details:**');
        step.subItems.forEach((item, i) => {
          lines.push(`  ${String.fromCharCode(97 + i)}. ${escapeMarkdown(item)}`);
        });
        lines.push('');
      }

      if (step.documents && step.documents.length > 0) {
        lines.push(`**Documents:** ${step.documents.map(escapeMarkdown).join(', ')}`);
        lines.push('');
      }

      if (options.includePainPoints && step.painPoints && step.painPoints.length > 0) {
        lines.push('**Pain Points:**');
        for (const pp of step.painPoints) {
          lines.push(`- ⚠️ ${escapeMarkdown(pp)}`);
        }
        lines.push('');
      }

      if (options.includeImprovements && step.improvements && step.improvements.length > 0) {
        lines.push('**Improvements:**');
        for (const imp of step.improvements) {
          lines.push(`- ✅ ${escapeMarkdown(imp)}`);
        }
        lines.push('');
      }

      if (step.toolsUsed && step.toolsUsed.length > 0) {
        lines.push(`**Tools:** ${step.toolsUsed.map(escapeMarkdown).join(', ')}`);
        lines.push('');
      }

      if (options.includeImpactScores && step.impact) {
        const total = step.impact.consistency + step.impact.cost + step.impact.control;
        lines.push(`**Impact Score:** ${total}/15`);
        lines.push(`  - Consistency: ${step.impact.consistency}/5`);
        lines.push(`  - Cost: ${step.impact.cost}/5`);
        lines.push(`  - Control: ${step.impact.control}/5`);
        lines.push('');
      }
    }
  }

  // Include steps with unknown phases
  const knownPhaseIds = new Set(phases.map((p) => p.id));
  const orphanSteps = steps.filter((s) => !knownPhaseIds.has(s.phaseId));
  if (orphanSteps.length > 0) {
    lines.push('### Unassigned Steps\n');
    for (const step of orphanSteps) {
      lines.push(`- **${escapeMarkdown(step.title)}** (actor: ${step.actorId}, phase: ${step.phaseId})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateEdgesTable(edges: WorkflowEdge[], steps: WorkflowStep[]): string {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const lines = ['## Process Flow\n'];

  if (edges.length === 0) {
    lines.push('_No connections defined._\n');
    return lines.join('\n');
  }

  lines.push('| # | From | To | Label | Type | Animated |');
  lines.push('|---|------|----|-------|------|----------|');

  edges.forEach((edge, i) => {
    const source = stepMap.get(edge.sourceStepId);
    const target = stepMap.get(edge.targetStepId);
    const from = source ? escapeMarkdown(source.title) : edge.sourceStepId;
    const to = target ? escapeMarkdown(target.title) : edge.targetStepId;
    const label = edge.label ? escapeMarkdown(edge.label) : '—';
    const type = edge.edgeType ?? 'default';
    const animated = edge.animated ? 'Yes' : 'No';

    lines.push(`| ${i + 1} | ${from} | ${to} | ${label} | ${type} | ${animated} |`);
  });

  lines.push('');
  return lines.join('\n');
}

function generateDataModels(steps: WorkflowStep[], actors: ActorDefinition[], phases: PhaseDefinition[]): string {
  const lines = ['### Data Models\n'];
  lines.push('The following TypeScript interfaces represent the data structures for this workflow module:\n');

  // Core workflow step interface
  lines.push('```typescript');
  lines.push('/** Core step data for this workflow */');
  lines.push('interface WorkflowStepData {');
  lines.push('  id: string;');
  lines.push('  title: string;');
  lines.push('  description: string;');
  lines.push(`  actorId: ${actors.map((a) => `'${a.id}'`).join(' | ') || 'string'};`);
  lines.push(`  phaseId: ${phases.map((p) => `'${p.id}'`).join(' | ') || 'string'};`);

  const stepTypes = new Set(steps.map((s) => s.stepType));
  lines.push(`  stepType: ${[...stepTypes].map((t) => `'${t}'`).join(' | ') || 'string'};`);

  lines.push('  documents: string[];');
  lines.push('  painPoints: string[];');
  lines.push('  improvements: string[];');
  lines.push('  toolsUsed: string[];');
  lines.push('  subItems: string[];');
  lines.push('  impact?: { consistency: number; cost: number; control: number };');
  lines.push('}');
  lines.push('```\n');

  // Actor enum
  lines.push('```typescript');
  lines.push('/** Actors/roles in this workflow */');
  lines.push(`type Actor = ${actors.map((a) => `'${a.id}'`).join(' | ') || 'string'};`);
  lines.push('```\n');

  // Phase enum
  lines.push('```typescript');
  lines.push('/** Process phases */');
  lines.push(`type Phase = ${phases.map((p) => `'${p.id}'`).join(' | ') || 'string'};`);
  lines.push('```\n');

  return lines.join('\n');
}

function generateBusinessRules(steps: WorkflowStep[], edges: WorkflowEdge[]): string {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const lines = ['### Business Rules\n'];

  // Rules from step descriptions
  lines.push('**Step Sequencing:**\n');
  for (const step of steps.sort((a, b) => (a.stepNumber ?? a.column) - (b.stepNumber ?? b.column))) {
    if (step.description) {
      lines.push(`- **${escapeMarkdown(step.title)}**: ${escapeMarkdown(step.description)}`);
    }
  }
  lines.push('');

  // Conditional routing rules
  const conditionalEdges = edges.filter((e) => e.edgeType === 'conditional' || e.label);
  if (conditionalEdges.length > 0) {
    lines.push('**Conditional Routing:**\n');
    for (const edge of conditionalEdges) {
      const source = stepMap.get(edge.sourceStepId);
      const target = stepMap.get(edge.targetStepId);
      const from = source ? escapeMarkdown(source.title) : edge.sourceStepId;
      const to = target ? escapeMarkdown(target.title) : edge.targetStepId;
      const condition = edge.label ? escapeMarkdown(edge.label) : 'conditional';
      lines.push(`- When **${condition}**: route from "${from}" → "${to}"`);
    }
    lines.push('');
  }

  // Decision points
  const decisionSteps = steps.filter((s) => s.shape === 'decision');
  if (decisionSteps.length > 0) {
    lines.push('**Decision Points:**\n');
    for (const step of decisionSteps) {
      const outgoing = edges.filter((e) => e.sourceStepId === step.id);
      lines.push(`- **${escapeMarkdown(step.title)}**: ${outgoing.length} outgoing path(s)`);
      for (const edge of outgoing) {
        const target = stepMap.get(edge.targetStepId);
        const label = edge.label ? ` (${escapeMarkdown(edge.label)})` : '';
        lines.push(`  - → ${target ? escapeMarkdown(target.title) : edge.targetStepId}${label}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateEdgeCases(steps: WorkflowStep[], edges: WorkflowEdge[]): string {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const lines = ['### Edge Cases\n'];

  // Branching paths
  const branchedSteps = steps.filter((s) => s.branch);
  if (branchedSteps.length > 0) {
    lines.push('**Parallel Branches:**\n');
    const branchGroups = new Map<string, WorkflowStep[]>();
    for (const step of branchedSteps) {
      const group = branchGroups.get(step.branch!) ?? [];
      group.push(step);
      branchGroups.set(step.branch!, group);
    }
    for (const [branch, branchSteps] of branchGroups) {
      lines.push(`- Branch \`${branch}\`: ${branchSteps.map((s) => escapeMarkdown(s.title)).join(', ')}`);
    }
    lines.push('');
  }

  // Steps with multiple incoming edges (convergence points)
  const incomingCount = new Map<string, number>();
  for (const edge of edges) {
    incomingCount.set(edge.targetStepId, (incomingCount.get(edge.targetStepId) ?? 0) + 1);
  }
  const convergenceSteps = [...incomingCount.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ step: stepMap.get(id), count }))
    .filter((x) => x.step != null);

  if (convergenceSteps.length > 0) {
    lines.push('**Convergence Points** (multiple incoming paths):\n');
    for (const { step, count } of convergenceSteps) {
      lines.push(`- **${escapeMarkdown(step!.title)}**: ${count} incoming edges`);
    }
    lines.push('');
  }

  // Steps with no outgoing edges (terminal steps)
  const hasOutgoing = new Set(edges.map((e) => e.sourceStepId));
  const terminalSteps = steps.filter((s) => !hasOutgoing.has(s.id));
  if (terminalSteps.length > 0) {
    lines.push('**Terminal Steps** (no outgoing connections):\n');
    for (const step of terminalSteps) {
      lines.push(`- ${escapeMarkdown(step.title)}`);
    }
    lines.push('');
  }

  // Steps with no incoming edges (entry points)
  const hasIncoming = new Set(edges.map((e) => e.targetStepId));
  const entrySteps = steps.filter((s) => !hasIncoming.has(s.id));
  if (entrySteps.length > 0) {
    lines.push('**Entry Points** (no incoming connections):\n');
    for (const step of entrySteps) {
      lines.push(`- ${escapeMarkdown(step.title)}`);
    }
    lines.push('');
  }

  if (branchedSteps.length === 0 && convergenceSteps.length === 0 && terminalSteps.length === 0 && entrySteps.length === 0) {
    lines.push('_No edge cases identified._\n');
  }

  return lines.join('\n');
}

function generateImpactAnalysis(steps: WorkflowStep[]): string {
  const stepsWithImpact = steps
    .filter((s) => s.impact)
    .map((s) => {
      const total = s.impact!.consistency + s.impact!.cost + s.impact!.control;
      return { step: s, total };
    })
    .sort((a, b) => b.total - a.total);

  const lines = ['## Impact Analysis\n'];

  if (stepsWithImpact.length === 0) {
    lines.push('_No impact scores assigned._\n');
    return lines.join('\n');
  }

  lines.push('| Step | Consistency | Cost | Control | Total | Priority |');
  lines.push('|------|------------|------|---------|-------|----------|');

  for (const { step, total } of stepsWithImpact) {
    const priority = total <= 6 ? 'Low' : total <= 9 ? 'Medium' : total <= 12 ? 'High' : 'Critical';
    lines.push(
      `| ${escapeMarkdown(step.title)} | ${step.impact!.consistency}/5 | ${step.impact!.cost}/5 | ${step.impact!.control}/5 | ${total}/15 | ${priority} |`,
    );
  }

  lines.push('');

  // Summary
  const avg = stepsWithImpact.reduce((sum, s) => sum + s.total, 0) / stepsWithImpact.length;
  const top3 = stepsWithImpact.slice(0, 3).map((s) => escapeMarkdown(s.step.title));
  lines.push('**Summary:**');
  lines.push(`- Highest impact steps: ${top3.join(', ')}`);
  lines.push(`- Average impact score: ${avg.toFixed(1)}/15`);
  lines.push(`- Steps assessed: ${stepsWithImpact.length}/${steps.length}`);
  lines.push('');

  return lines.join('\n');
}

function generateAttachmentsSection(attachments: ExportAttachment[]): string {
  const sorted = [...attachments].sort((a, b) => a.displayOrder - b.displayOrder);
  const lines = ['## Attachments\n'];
  lines.push('| # | File | Type | Size |');
  lines.push('|---|------|------|------|');

  for (const [i, att] of sorted.entries()) {
    const size = formatFileSize(att.fileSize);
    lines.push(`| ${i + 1} | ${escapeMarkdown(att.fileName)} | ${att.mimeType} | ${size} |`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateFooter(): string {
  return '*This document was auto-generated as instructions for an AI coding agent to build a workflow app module.*\n';
}

// =========================================================
// Utilities
// =========================================================

/** Escape markdown special characters in text content */
function escapeMarkdown(text: string): string {
  return text.replace(/([|\\`*_{}[\]()#+\-!])/g, '\\$1');
}

/** Format bytes to human-readable size */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
