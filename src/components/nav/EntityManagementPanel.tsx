'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { slugify } from '@/lib/utils';

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

/** Minimal shape required for items managed by this panel */
export interface ManagedEntity {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface EntityManagementPanelProps<T extends ManagedEntity> {
  /** Panel title, e.g. "Manage Swimlane Actors" */
  title: string;
  /** Icon rendered next to the title */
  icon: ReactNode;
  /** Singular entity name for placeholders, e.g. "actor" */
  entityName: string;
  /** Current items from the workflow context */
  items: T[];
  /** Count steps referencing a given entity ID */
  getStepCount: (id: string) => number;
  /** Persist changes */
  onSave: (items: T[]) => Promise<void>;
  /** Create a new entity from a name. Returns the new item. */
  createItem: (name: string, nextColor: string, order: number) => T;
  /** Optional extra fields rendered per-row (e.g., actor shortLabel) */
  renderExtraFields?: (item: T, onChange: (id: string, field: keyof T, value: string) => void) => ReactNode;
  /** Color swatch shape: 'circle' for actors, 'rounded' for phases */
  swatchShape?: 'circle' | 'rounded';
  /** Close the panel */
  onClose: () => void;
}

export function EntityManagementPanel<T extends ManagedEntity>({
  title,
  icon,
  entityName,
  items,
  getStepCount,
  onSave,
  createItem,
  renderExtraFields,
  swatchShape = 'rounded',
  onClose,
}: EntityManagementPanelProps<T>) {
  const { activeWorkflow } = useWorkflowContext();
  const [localItems, setLocalItems] = useState<T[]>(() => items.map((item) => ({ ...item })));
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');

  const hasChanges = JSON.stringify(localItems) !== JSON.stringify(items);

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    const id = slugify(name);
    if (localItems.some((item) => item.id === id)) return;

    const usedColors = new Set(localItems.map((item) => item.color));
    const nextColor = PRESET_COLORS.find((c) => !usedColors.has(c)) ?? PRESET_COLORS[0];

    setLocalItems((prev) => [...prev, createItem(name, nextColor, prev.length)]);
    setNewName('');
  }, [newName, localItems, createItem]);

  const handleRemove = useCallback((id: string) => {
    setLocalItems((prev) =>
      prev.filter((item) => item.id !== id).map((item, i) => ({ ...item, order: i }))
    );
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setLocalItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((item, i) => ({ ...item, order: i }));
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setLocalItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((item, i) => ({ ...item, order: i }));
    });
  }, []);

  const handleUpdateField = useCallback(
    (id: string, field: keyof T, value: string) => {
      setLocalItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(localItems);
      onClose();
    } catch (err) {
      console.error(`Failed to save ${entityName}s:`, err);
      toast.error(`Failed to save ${entityName}s`);
    } finally {
      setSaving(false);
    }
  }, [localItems, onSave, onClose, entityName]);

  const swatchClass = swatchShape === 'circle' ? 'rounded-full' : 'rounded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
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
              Workflow:{' '}
              <span className="font-medium text-slate-700">
                {activeWorkflow.name}
              </span>
            </p>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {localItems.map((item, index) => {
            const refCount = getStepCount(item.id);
            return (
              <div
                key={item.id}
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
                    disabled={index === localItems.length - 1}
                    className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Color picker */}
                <div className="relative group">
                  <button
                    type="button"
                    className={`w-6 h-6 ${swatchClass} border-2 border-slate-300 cursor-pointer hover:border-blue-400 transition-colors`}
                    style={{ backgroundColor: item.color }}
                    title="Change color"
                  />
                  <div className="hidden group-hover:flex absolute z-10 left-0 top-full mt-1 p-1.5 bg-white rounded-md shadow-lg border border-slate-200 gap-1 flex-wrap w-28">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateField(item.id, 'color' as keyof T, c)}
                        className={`w-5 h-5 ${swatchClass} border ${
                          c === item.color
                            ? 'border-blue-500 ring-1 ring-blue-300'
                            : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateField(item.id, 'label' as keyof T, e.target.value)
                  }
                  className="flex-1 text-sm border-0 border-b border-transparent focus:border-slate-300 outline-none bg-transparent px-1 py-0.5 min-w-0"
                  placeholder={`${entityName} name...`}
                />

                {/* Extra fields (e.g., actor shortLabel) */}
                {renderExtraFields?.(item, handleUpdateField)}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={refCount > 0}
                  title={
                    refCount > 0
                      ? `Cannot delete: ${refCount} step(s) use this ${entityName}`
                      : `Remove ${entityName}`
                  }
                  className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {refCount > 0 && (
                  <span
                    className="text-[10px] text-slate-400 flex-shrink-0"
                    title={`${refCount} step(s)`}
                  >
                    {refCount}
                  </span>
                )}
              </div>
            );
          })}

          {/* Add new item */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`New ${entityName} name...`}
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
