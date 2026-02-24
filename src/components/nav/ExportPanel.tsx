'use client';

import { useCallback, useMemo, useState } from 'react';
import { X, FileDown, Save, ArrowRight, ArrowLeft, Eye, Code } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { generateWorkflowMarkdown } from '@/lib/markdown-generator';
import { downloadMarkdownFile } from '@/lib/download';
import { createExport, uploadAttachment } from '@/lib/supabase/export-queries';
import { MarkdownPreview } from './MarkdownPreview';
import { AttachmentUploader } from './AttachmentUploader';
import type { MarkdownExportOptions, PendingAttachment, ExportMetadata } from '@/types/export';
import { DEFAULT_EXPORT_OPTIONS } from '@/types/export';

interface ExportPanelProps {
  onClose: () => void;
}

type Step = 'configure' | 'preview';
type PreviewMode = 'rendered' | 'raw';

const OPTION_LABELS: { key: keyof MarkdownExportOptions; label: string }[] = [
  { key: 'includeProcessNarrative', label: 'Process Narrative' },
  { key: 'includeTechnicalSpec', label: 'Technical Specification' },
  { key: 'includeDataModels', label: 'Data Models' },
  { key: 'includeBusinessRules', label: 'Business Rules' },
  { key: 'includeEdgeCases', label: 'Edge Cases' },
  { key: 'includeImpactScores', label: 'Impact Scores' },
  { key: 'includePainPoints', label: 'Pain Points' },
  { key: 'includeImprovements', label: 'Improvements' },
];

export function ExportPanel({ onClose }: ExportPanelProps) {
  const {
    activeWorkflow,
    activeScenarios,
    activeVersion,
    steps,
    edges,
    actors,
    phases,
    selection,
  } = useWorkflowContext();

  const activeScenario = useMemo(
    () => activeScenarios.find((s) => s.id === selection?.scenarioId),
    [activeScenarios, selection?.scenarioId],
  );

  // --- State ---
  const [step, setStep] = useState<Step>('configure');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('rendered');
  const [title, setTitle] = useState(
    `${activeWorkflow?.name ?? 'Workflow'} — ${activeScenario?.name ?? 'Scenario'} Export`,
  );
  const [options, setOptions] = useState<MarkdownExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Handlers ---

  const toggleOption = useCallback((key: keyof MarkdownExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!activeWorkflow || !activeScenario || !activeVersion) {
      toast.error('No workflow data available to export');
      return;
    }

    const md = generateWorkflowMarkdown({
      workflow: activeWorkflow,
      scenario: activeScenario,
      version: activeVersion,
      steps,
      edges,
      actors,
      phases,
      options,
    });

    setGeneratedMarkdown(md);
    setEditedMarkdown(md);
    setStep('preview');
  }, [activeWorkflow, activeScenario, activeVersion, steps, edges, actors, phases, options]);

  const handleDownload = useCallback(() => {
    const filename = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    downloadMarkdownFile(filename, editedMarkdown);
    toast.success('Markdown file downloaded');
  }, [title, editedMarkdown]);

  const handleSave = useCallback(async () => {
    if (!activeWorkflow || !activeScenario || !activeVersion || !selection) {
      toast.error('Missing workflow data');
      return;
    }

    setSaving(true);
    try {
      const metadata: ExportMetadata = {
        workflowName: activeWorkflow.name,
        scenarioName: activeScenario.name,
        scenarioType: activeScenario.scenarioType,
        versionNumber: activeVersion.versionNumber,
        stepCount: steps.length,
        edgeCount: edges.length,
        actorCount: actors.length,
        phaseCount: phases.length,
        exportedAt: new Date().toISOString(),
      };

      const exportRecord = await createExport({
        workflowId: selection.workflowId,
        scenarioId: selection.scenarioId,
        versionId: selection.versionId,
        title,
        markdownContent: editedMarkdown,
        exportMetadata: metadata,
      });

      // Upload attachments
      for (const att of attachments) {
        await uploadAttachment({
          exportId: exportRecord.id,
          workflowId: selection.workflowId,
          file: att.file,
          displayOrder: att.displayOrder,
        });
      }

      toast.success('Export saved successfully');
      onClose();
    } catch (err) {
      console.error('Failed to save export:', err);
      toast.error('Failed to save export');
    } finally {
      setSaving(false);
    }
  }, [activeWorkflow, activeScenario, activeVersion, selection, title, editedMarkdown, attachments, steps, edges, actors, phases, onClose]);

  // --- Guard ---
  if (!activeWorkflow || !activeScenario) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Export to Markdown</h2>
              <p className="text-xs text-slate-500">
                {step === 'configure' ? 'Configure export options' : 'Preview and save'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" title="Close">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'configure' ? (
            <ConfigureStep
              title={title}
              onTitleChange={setTitle}
              options={options}
              onToggleOption={toggleOption}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              workflowName={activeWorkflow.name}
              scenarioName={activeScenario.name}
            />
          ) : (
            <PreviewStep
              markdown={editedMarkdown}
              onMarkdownChange={setEditedMarkdown}
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg shrink-0">
          <div>
            {step === 'preview' && (
              <button
                onClick={() => setStep('configure')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>

            {step === 'configure' ? (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Preview
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download .md
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save to Database'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Sub-components
// =========================================================

function ConfigureStep({
  title,
  onTitleChange,
  options,
  onToggleOption,
  attachments,
  onAttachmentsChange,
  workflowName,
  scenarioName,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  options: MarkdownExportOptions;
  onToggleOption: (key: keyof MarkdownExportOptions) => void;
  attachments: PendingAttachment[];
  onAttachmentsChange: (attachments: PendingAttachment[]) => void;
  workflowName: string;
  scenarioName: string;
}) {
  return (
    <div className="space-y-5">
      {/* Context info */}
      <div className="text-xs text-slate-400">
        Exporting: <span className="text-slate-600 font-medium">{workflowName}</span> →{' '}
        <span className="text-slate-600 font-medium">{scenarioName}</span>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
          Export Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Export title..."
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Sections to Include
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OPTION_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => onToggleOption(key)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <AttachmentUploader attachments={attachments} onChange={onAttachmentsChange} />
    </div>
  );
}

function PreviewStep({
  markdown,
  onMarkdownChange,
  previewMode,
  onPreviewModeChange,
}: {
  markdown: string;
  onMarkdownChange: (md: string) => void;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5 w-fit">
        <button
          onClick={() => onPreviewModeChange('rendered')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
            previewMode === 'rendered'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => onPreviewModeChange('raw')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
            previewMode === 'raw'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Edit Raw
        </button>
      </div>

      {/* Content */}
      <div className="border border-slate-200 rounded-lg overflow-hidden" style={{ height: '60vh' }}>
        {previewMode === 'rendered' ? (
          <div className="h-full overflow-y-auto p-4">
            <MarkdownPreview content={markdown} />
          </div>
        ) : (
          <textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            className="w-full h-full p-4 text-xs font-mono text-slate-800 bg-slate-50 resize-none focus:outline-none"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
