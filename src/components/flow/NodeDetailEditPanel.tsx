'use client';

import { useState, useCallback } from 'react';
import { X, Trash2, Plus, Minus, Save, BarChart3 } from 'lucide-react';
import type { WorkflowStep, StepType, ActorId, ProcessPhase, ImpactScore } from '@/data/types';
import { stepTypeColors, getImpactColor, getImpactBgColor, getTotalImpactColor } from '@/styles/flow-theme';

interface NodeDetailEditPanelProps {
  step: WorkflowStep;
  onSave: (updates: Partial<WorkflowStep>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const stepTypes: StepType[] = ['manual', 'automated', 'data-driven', 'hybrid'];
const actors: ActorId[] = ['vendors', 'madigan-pm', 'madigan-dev-exec', 'madigan-exec-approval', 'ownership', 'billing-platform'];
const phases: ProcessPhase[] = ['pre-draw', 'invoice-receipt', 'invoice-processing', 'invoice-tabulation', 'draw-assembly', 'post-approval', 'payment-check', 'payment-ach'];

const impactLabels = {
  consistency: { label: 'Consistency', description: 'How often this pain point occurs (1 = infrequent, 5 = constant)' },
  cost: { label: 'Cost', description: 'Financial impact (1 = low cost, 5 = very costly)' },
  control: { label: 'Control', description: 'Ability to change (1 = external/no leverage, 5 = easily within control)' },
} as const;

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1 mb-1">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            placeholder={placeholder}
            className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function NodeDetailEditPanel({ step, onSave, onDelete, onClose }: NodeDetailEditPanelProps) {
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);
  const [stepType, setStepType] = useState<StepType>(step.stepType);
  const [actor, setActor] = useState<ActorId>(step.actor);
  const [phase, setPhase] = useState<ProcessPhase>(step.phase);
  const [stepNumber, setStepNumber] = useState(step.stepNumber ?? 0);
  const [documents, setDocuments] = useState<string[]>(step.documents ?? []);
  const [painPoints, setPainPoints] = useState<string[]>(step.painPoints ?? []);
  const [improvements, setImprovements] = useState<string[]>(step.improvements ?? []);
  const [toolsUsed, setToolsUsed] = useState<string[]>(step.toolsUsed ?? []);
  const [subItems, setSubItems] = useState<string[]>(step.subItems ?? []);
  const [impact, setImpact] = useState<ImpactScore>(
    step.impact ?? { consistency: 1, cost: 1, control: 1 }
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const colors = stepTypeColors[stepType];
  const totalImpact = impact.consistency + impact.cost + impact.control;

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      stepType,
      actor,
      phase,
      stepNumber: stepNumber || undefined,
      documents: documents.filter(Boolean),
      painPoints: painPoints.filter(Boolean),
      improvements: improvements.filter(Boolean),
      toolsUsed: toolsUsed.filter(Boolean),
      subItems: subItems.filter(Boolean),
      impact,
    });
    onClose();
  }, [title, description, stepType, actor, phase, stepNumber, documents, painPoints, improvements, toolsUsed, subItems, impact, onSave, onClose]);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 p-4 border-b z-10"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={stepNumber}
                onChange={(e) => setStepNumber(parseInt(e.target.value) || 0)}
                className="w-12 text-center text-xs font-bold rounded-full text-white py-1"
                style={{ backgroundColor: colors.badge }}
                min={0}
              />
              <select
                value={stepType}
                onChange={(e) => setStepType(e.target.value as StepType)}
                className="text-xs font-medium px-2 py-1 rounded-full border-none text-white cursor-pointer"
                style={{ backgroundColor: colors.border }}
              >
                {stepTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold bg-transparent border-b-2 border-transparent focus:border-slate-400 focus:outline-none transition-colors"
              style={{ color: colors.text }}
              placeholder="Step title..."
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
            placeholder="Describe this step..."
          />
        </div>

        {/* Impact Assessment */}
        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            Change Impact Assessment
          </h3>

          <div className="space-y-3">
            {(Object.keys(impactLabels) as Array<keyof typeof impactLabels>).map((key) => {
              const value = impact[key];
              const info = impactLabels[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{info.label}</span>
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: getImpactColor(value),
                        backgroundColor: getImpactBgColor(value),
                      }}
                    >
                      {value}/5
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={value}
                    onChange={(e) =>
                      setImpact((prev) => ({ ...prev, [key]: parseInt(e.target.value) }))
                    }
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                    style={{
                      accentColor: getImpactColor(value),
                    }}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">{info.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Change Impact Score</span>
            <span
              className="text-lg font-bold px-3 py-1 rounded-lg"
              style={{
                color: 'white',
                backgroundColor: getTotalImpactColor(totalImpact),
              }}
            >
              {totalImpact}/15
            </span>
          </div>
        </div>

        {/* Actor & Phase */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Actor</label>
            <select
              value={actor}
              onChange={(e) => setActor(e.target.value as ActorId)}
              className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {actors.map((a) => (
                <option key={a} value={a}>{a.replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Phase</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as ProcessPhase)}
              className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {phases.map((p) => (
                <option key={p} value={p}>{p.replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lists */}
        <ListEditor label="Documents" items={documents} onChange={setDocuments} placeholder="Document name..." />
        <ListEditor label="Sub-items" items={subItems} onChange={setSubItems} placeholder="Sub-item..." />
        <ListEditor label="Pain Points" items={painPoints} onChange={setPainPoints} placeholder="Pain point..." />
        <ListEditor label="Improvements" items={improvements} onChange={setImprovements} placeholder="Improvement..." />
        <ListEditor label="Tools Used" items={toolsUsed} onChange={setToolsUsed} placeholder="Tool name..." />

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="text-sm bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex items-center gap-1 text-sm bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
