'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ReviewActionsProps {
  sessionId: string;
  status: string;
  workflowId: string | null;
  onStatusChange: (status: string) => void;
}

export function ReviewActions({
  sessionId,
  status,
  workflowId,
  onStatusChange,
}: ReviewActionsProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/capture/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Processing failed');
      } else {
        onStatusChange('processed');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 bg-white">
      {error && (
        <p className="text-xs text-red-600 flex-1">{error}</p>
      )}

      {status === 'completed' && (
        <button
          onClick={handleProcess}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Process with AI
        </button>
      )}

      {status === 'processed' && (
        <>
          {workflowId && (
            <a
              href={`/?workflow=${workflowId}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              View Workflow
            </a>
          )}
          <button
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-process
          </button>
        </>
      )}

      {status === 'processing' && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </div>
      )}

      {status === 'active' && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <XCircle className="h-4 w-4" />
          Session still active — complete it in the capture app first
        </div>
      )}
    </div>
  );
}
