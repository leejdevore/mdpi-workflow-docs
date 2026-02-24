'use client';

import { useCallback } from 'react';
import { Users } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import type { ActorDefinition } from '@/types/workflow';
import { slugify } from '@/lib/utils';
import { EntityManagementPanel } from './EntityManagementPanel';

interface ActorManagementPanelProps {
  onClose: () => void;
}

export function ActorManagementPanel({ onClose }: ActorManagementPanelProps) {
  const { actors, steps, updateActors } = useWorkflowContext();

  const getStepCount = useCallback(
    (actorId: string) => steps.filter((s) => s.actorId === actorId).length,
    [steps]
  );

  const createItem = useCallback(
    (name: string, nextColor: string, order: number): ActorDefinition => ({
      id: slugify(name),
      label: name,
      shortLabel: name.length > 12 ? name.slice(0, 12) : name,
      color: nextColor,
      order,
    }),
    []
  );

  const renderExtraFields = useCallback(
    (
      item: ActorDefinition,
      onChange: (id: string, field: keyof ActorDefinition, value: string) => void
    ) => (
      <input
        type="text"
        value={item.shortLabel}
        onChange={(e) => onChange(item.id, 'shortLabel', e.target.value)}
        className="w-20 text-xs text-slate-500 border-0 border-b border-transparent focus:border-slate-300 outline-none bg-transparent px-1 py-0.5"
        placeholder="Short"
        title="Short label for lane header"
      />
    ),
    []
  );

  return (
    <EntityManagementPanel<ActorDefinition>
      title="Manage Swimlane Actors"
      icon={<Users className="w-5 h-5 text-slate-600" />}
      entityName="actor"
      items={actors}
      getStepCount={getStepCount}
      onSave={updateActors}
      createItem={createItem}
      renderExtraFields={renderExtraFields}
      swatchShape="circle"
      onClose={onClose}
    />
  );
}
