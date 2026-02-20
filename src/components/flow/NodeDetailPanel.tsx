'use client';

import { X, FileText, AlertTriangle, Lightbulb, Wrench, BarChart3 } from 'lucide-react';
import type { WorkflowStep } from '@/data/types';
import { stepTypeColors, getImpactColor, getImpactBgColor, getTotalImpactColor } from '@/styles/flow-theme';

interface NodeDetailPanelProps {
  step: WorkflowStep | null;
  onClose: () => void;
}

const impactLabels = {
  consistency: { label: 'Consistency', description: 'How often this pain point occurs (1 = infrequent, 5 = constant)' },
  cost: { label: 'Cost', description: 'Financial impact (1 = low cost, 5 = very costly)' },
  control: { label: 'Control', description: 'Ability to change (1 = external/no leverage, 5 = easily within control)' },
} as const;

export function NodeDetailPanel({ step, onClose }: NodeDetailPanelProps) {
  if (!step) return null;

  const colors = stepTypeColors[step.stepType];
  const impact = step.impact;
  const totalImpact = impact ? impact.consistency + impact.cost + impact.control : null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto transition-transform">
      {/* Header */}
      <div
        className="sticky top-0 p-4 border-b"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            {step.stepNumber != null && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mb-1"
                style={{ backgroundColor: colors.badge }}
              >
                {step.stepNumber}
              </span>
            )}
            <h2 className="text-lg font-bold" style={{ color: colors.text }}>
              {step.title}
            </h2>
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: colors.border, color: 'white' }}
            >
              {step.stepType}
            </span>
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
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Description</h3>
          <p className="text-sm text-slate-600">{step.description}</p>
        </div>

        {/* Impact Assessment */}
        {impact && totalImpact != null && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Change Impact Assessment
            </h3>

            <div className="space-y-2.5">
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
                    {/* Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(value / 5) * 100}%`,
                          backgroundColor: getImpactColor(value),
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{info.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Total Score */}
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
        )}

        {/* Sub-items */}
        {step.subItems && step.subItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Details</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              {step.subItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5 text-xs">{String.fromCharCode(97 + i)}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents */}
        {step.documents && step.documents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Documents
            </h3>
            <ul className="text-sm text-slate-600 space-y-1">
              {step.documents.map((doc, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pain Points */}
        {step.painPoints && step.painPoints.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Pain Points
            </h3>
            <ul className="text-sm text-slate-600 space-y-1">
              {step.painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {step.improvements && step.improvements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              Improvements
            </h3>
            <ul className="text-sm text-slate-600 space-y-1">
              {step.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  {imp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tools Used */}
        {step.toolsUsed && step.toolsUsed.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Wrench className="w-4 h-4" />
              Tools
            </h3>
            <div className="flex flex-wrap gap-1">
              {step.toolsUsed.map((tool, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-3 text-xs text-slate-400 space-y-1">
          <p>Phase: {step.phase}</p>
          <p>Actor: {step.actor}</p>
          {step.branch && <p>Payment Path: {step.branch.toUpperCase()}</p>}
        </div>
      </div>
    </div>
  );
}
