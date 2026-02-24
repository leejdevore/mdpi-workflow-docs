'use client';

import { useWorkflowContext } from '@/contexts/WorkflowContext';
import type { NavTreeScenario, UUID } from '@/types/workflow';

const scenarioTypeIcons: Record<string, string> = {
  existing: 'E',
  digitized: 'D',
  transformed: 'T',
  custom: 'C',
};

const scenarioTypeColors: Record<string, string> = {
  existing: 'bg-amber-100 text-amber-700',
  digitized: 'bg-blue-100 text-blue-700',
  transformed: 'bg-green-100 text-green-700',
  custom: 'bg-purple-100 text-purple-700',
};

interface NavScenarioItemProps {
  scenario: NavTreeScenario;
  workflowId: UUID;
}

export function NavScenarioItem({ scenario, workflowId }: NavScenarioItemProps) {
  const { selection, selectScenario } = useWorkflowContext();
  const isActive = selection?.scenarioId === scenario.id;

  return (
    <button
      onClick={() => selectScenario(workflowId, scenario.id)}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors rounded-md mx-1 ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <span
        className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
          scenarioTypeColors[scenario.scenarioType] ?? 'bg-slate-100 text-slate-500'
        }`}
      >
        {scenarioTypeIcons[scenario.scenarioType] ?? '?'}
      </span>
      <span className="text-sm truncate flex-1">{scenario.name}</span>
      {scenario.versionCount > 1 && (
        <span className="text-[10px] text-slate-400">
          v{scenario.versionCount}
        </span>
      )}
    </button>
  );
}
