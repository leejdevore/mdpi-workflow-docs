'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Save, Users } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import type { ActorDefinition } from '@/types/workflow';

interface ActorManagementPanelProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  '#FEF3C7', // amber-100
  '#DBEAFE', // blue-100
  '#E0E7FF', // indigo-100
  '#EDE9FE', // violet-100
  '#D1FAE5', // emerald-100
  '#FEE2E2', // red-100
  '#FCE7F3', // pink-100
  '#F0FDFA', // teal-100
  '#FEF9C3', // yellow-100
  '#F1F5F9', // slate-100
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ActorManagementPanel({ onClose }: ActorManagementPanelProps) {
  const { actors, steps, updateActors, activeWorkflow } = useWorkflowContext();
  const [localActors, setLocalActors] = useState<ActorDefinition[]>(
    () => actors.map((a) => ({ ...a }))
  );
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');

  const hasChanges =
    JSON.stringify(localActors) !== JSON.stringify(actors);

  /** Count steps that reference a given actor */
  const getStepCount = useCallback(
    (actorId: string) => steps.filter((s) => s.actorId === actorId).length,
    [steps]
  );

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    const id = slugify(name);
    if (localActors.some((a) => a.id === id)) return;

    const usedColors = new Set(localActors.map((a) => a.color));
    const nextColor = PRESET_COLORS.find((c) => !usedColors.has(c)) ?? PRESET_COLORS[0];

    setLocalActors((prev) => [
      ...prev,
      {
        id,
        label: name,
        shortLabel: name.length > 12 ? name.slice(0, 12) : name,
        color: nextColor,
        order: prev.length,
      },
    ]);
    setNewName('');
  }, [newName, localActors]);

  const handleRemove = useCallback(
    (id: string) => {
      setLocalActors((prev) =>
        prev.filter((a) => a.id !== id).map((a, i) => ({ ...a, order: i }))
      );
    },
    []
  );

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setLocalActors((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((a, i) => ({ ...a, order: i }));
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setLocalActors((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((a, i) => ({ ...a, order: i }));
    });
  }, []);

  const handleUpdateField = useCallback(
    (id: string, field: keyof ActorDefinition, value: string) => {
      setLocalActors((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateActors(localActors);
      onClose();
    } catch (err) {
      console.error('Failed to save actors:', err);
    } finally {
      setSaving(false);
    }
  }, [localActors, updateActors, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Manage Swimlane Actors
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {activeWorkflow && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-200">
            <p className="text-xs text-slate-500">
              Workflow: <span className="font-medium text-slate-700">{activeWorkflow.name}</span>
            </p>
          </div>
        )}

        {/* Actor List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {localActors.map((actor, index) => {
            const refCount = getStepCount(actor.id);
            return (
              <div
                key={actor.id}
                className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                {/* Reorder */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === localActors.length - 1}
                    className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Color picker */}
                <div className="relative group">
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full border-2 border-slate-300 cursor-pointer hover:border-blue-400 transition-colors"
                    style={{ backgroundColor: actor.color }}
                    title="Change color"
                  />
                  <div className="hidden group-hover:flex absolute z-10 left-0 top-full mt-1 p-1.5 bg-white rounded-md shadow-lg border border-slate-200 gap-1 flex-wrap w-28">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateField(actor.id, 'color', c)}
                        className={`w-5 h-5 rounded-full border ${
                          c === actor.color ? 'border-blue-500 ring-1 ring-blue-300' : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={actor.label}
                  onChange={(e) => handleUpdateField(actor.id, 'label', e.target.value)}
                  className="flex-1 text-sm border-0 border-b border-transparent focus:border-slate-300 outline-none bg-transparent px-1 py-0.5 min-w-0"
                  placeholder="Actor name..."
                />

                {/* Short label */}
                <input
                  type="text"
                  value={actor.shortLabel}
                  onChange={(e) => handleUpdateField(actor.id, 'shortLabel', e.target.value)}
                  className="w-20 text-xs text-slate-500 border-0 border-b border-transparent focus:border-slate-300 outline-none bg-transparent px-1 py-0.5"
                  placeholder="Short"
                  title="Short label for lane header"
                />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleRemove(actor.id)}
                  disabled={refCount > 0}
                  title={
                    refCount > 0
                      ? `Cannot delete: ${refCount} step(s) use this actor`
                      : 'Remove actor'
                  }
                  className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {refCount > 0 && (
                  <span className="text-[10px] text-slate-400 flex-shrink-0" title={`${refCount} step(s)`}>
                    {refCount}
                  </span>
                )}
              </div>
            );
          })}

          {/* Add new actor */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New actor name..."
              className="flex-1 text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
