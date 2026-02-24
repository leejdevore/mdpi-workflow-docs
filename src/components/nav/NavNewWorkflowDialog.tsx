'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { lanes } from '@/data/lanes';
import { phaseLabels, phaseColors } from '@/styles/flow-theme';
import type { ActorDefinition, PhaseDefinition } from '@/types/workflow';

interface NavNewWorkflowDialogProps {
  onClose: () => void;
}

/** Build default actors from existing lanes data */
function getDefaultActors(): ActorDefinition[] {
  return lanes.map((lane) => ({
    id: lane.id,
    label: lane.label,
    shortLabel: lane.shortLabel,
    color: lane.color,
    order: lane.order,
  }));
}

/** Build default phases from existing phase maps */
function getDefaultPhases(): PhaseDefinition[] {
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

export function NavNewWorkflowDialog({ onClose }: NavNewWorkflowDialogProps) {
  const { addWorkflow, selectScenario } = useWorkflowContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const wfId = await addWorkflow(
        name.trim(),
        description.trim(),
        getDefaultActors(),
        getDefaultPhases()
      );
      // Select the first scenario of the new workflow
      // We need to wait a tick for the tree to refresh
      setTimeout(() => {
        // Find the workflow in the updated tree — the context will have refreshed
        // For now, just close the dialog; user can click in the nav
        onClose();
      }, 100);
    } catch (err) {
      console.error('Failed to create workflow:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">New Workflow</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label
              htmlFor="wf-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Name
            </label>
            <input
              id="wf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Permits, Inspections..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="wf-desc"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="wf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workflow..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <p className="text-xs text-slate-500">
            Three default scenarios (Current State, Digitized, Digitally Transformed)
            will be created automatically.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
