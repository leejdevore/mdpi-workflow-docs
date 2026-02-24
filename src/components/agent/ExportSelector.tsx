'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { fetchExportsForWorkflow } from '@/lib/supabase/export-queries';
import type { WorkflowExport } from '@/types/export';
import type { UUID } from '@/types/workflow';

interface ExportSelectorProps {
  workflowId: UUID;
  selectedExportId: UUID | null;
  onSelect: (exportId: UUID | null) => void;
}

export function ExportSelector({
  workflowId,
  selectedExportId,
  onSelect,
}: ExportSelectorProps) {
  const [exports, setExports] = useState<WorkflowExport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchExportsForWorkflow(workflowId)
      .then((data) => {
        if (!cancelled) setExports(data);
      })
      .catch(() => {
        if (!cancelled) setExports([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  // Auto-select first export if none selected
  useEffect(() => {
    if (!selectedExportId && exports.length > 0) {
      onSelect(exports[0].id);
    }
  }, [exports, selectedExportId, onSelect]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 text-xs text-slate-400">
        <FileText className="h-3.5 w-3.5" />
        Loading exports...
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 text-xs text-slate-400">
        <FileText className="h-3.5 w-3.5" />
        No exports — export a workflow first
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">
      <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <select
        value={selectedExportId ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="">No context (general chat)</option>
        {exports.map((exp) => (
          <option key={exp.id} value={exp.id}>
            {exp.title}
          </option>
        ))}
      </select>
    </div>
  );
}
