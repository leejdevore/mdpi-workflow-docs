'use client';

import { useCallback } from 'react';
import { Columns3 } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import type { PhaseDefinition } from '@/types/workflow';
import { slugify } from '@/lib/utils';
import { EntityManagementPanel } from './EntityManagementPanel';

interface PhaseManagementPanelProps {
  onClose: () => void;
}

export function PhaseManagementPanel({ onClose }: PhaseManagementPanelProps) {
  const { phases, steps, updatePhases } = useWorkflowContext();

  const getStepCount = useCallback(
    (phaseId: string) => steps.filter((s) => s.phaseId === phaseId).length,
    [steps]
  );

  const createItem = useCallback(
    (name: string, nextColor: string, order: number): PhaseDefinition => ({
      id: slugify(name),
      label: name,
      color: nextColor,
      order,
    }),
    []
  );

  return (
    <EntityManagementPanel<PhaseDefinition>
      title="Manage Phases"
      icon={<Columns3 className="w-5 h-5 text-slate-600" />}
      entityName="phase"
      items={phases}
      getStepCount={getStepCount}
      onSave={updatePhases}
      createItem={createItem}
      onClose={onClose}
    />
  );
}
