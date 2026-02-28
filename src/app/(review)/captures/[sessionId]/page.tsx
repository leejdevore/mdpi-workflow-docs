'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ReactFlowProvider } from '@xyflow/react';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import {
  fetchCaptureSession,
  fetchCaptureEntries,
  fetchCaptureRecordings,
  type CaptureSession,
  type CaptureEntry,
  type CaptureRecording,
} from '@/lib/supabase/capture-queries';
import { CaptureEntryCard } from '@/components/review/CaptureEntryCard';
import { RecordingPlayer } from '@/components/review/RecordingPlayer';
import { ReviewActions } from '@/components/review/ReviewActions';
import { SwimlaneDiagram } from '@/components/flow/SwimlaneDiagram';
import { EditModeProvider } from '@/contexts/EditModeContext';
import type {
  Workflow,
  WorkflowStep,
  WorkflowEdge,
  ActorDefinition,
  PhaseDefinition,
} from '@/types/workflow';
import { createClient } from '@/lib/supabase/client';
import { toStep, toEdge } from '@/lib/supabase/transforms';

export default function CaptureReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const [session, setSession] = useState<CaptureSession | null>(null);
  const [entries, setEntries] = useState<CaptureEntry[]>([]);
  const [recordings, setRecordings] = useState<CaptureRecording[]>([]);
  const [loading, setLoading] = useState(true);

  // Workflow data (only if session is processed)
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sess, ents, recs] = await Promise.all([
        fetchCaptureSession(sessionId),
        fetchCaptureEntries(sessionId),
        fetchCaptureRecordings(sessionId),
      ]);

      setSession(sess);
      setEntries(ents);
      setRecordings(recs);

      // If the session has a linked workflow, load it
      if (sess?.workflowId) {
        await loadWorkflow(sess.workflowId);
      }
    } catch (err) {
      console.error('Failed to load capture data:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadWorkflow = async (workflowId: string) => {
    try {
      const supabase = createClient();

      // Fetch workflow
      const { data: wf } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (!wf) return;

      const actors: ActorDefinition[] = wf.actors ?? [];
      const phases: PhaseDefinition[] = wf.phases ?? [];

      setWorkflow({
        id: wf.id,
        name: wf.name,
        description: wf.description,
        actors,
        phases,
        createdAt: wf.created_at,
        updatedAt: wf.updated_at,
      });

      // Fetch the latest scenario + version
      const { data: scenarios } = await supabase
        .from('scenarios')
        .select('id')
        .eq('workflow_id', workflowId)
        .order('display_order', { ascending: true })
        .limit(1);

      if (!scenarios?.length) return;

      const { data: versions } = await supabase
        .from('scenario_versions')
        .select('id')
        .eq('scenario_id', scenarios[0].id)
        .order('version_number', { ascending: false })
        .limit(1);

      if (!versions?.length) return;

      const versionId = versions[0].id;

      // Fetch steps and edges
      const [{ data: stepsData }, { data: edgesData }] = await Promise.all([
        supabase
          .from('workflow_steps')
          .select('*')
          .eq('version_id', versionId)
          .order('step_number', { ascending: true }),
        supabase
          .from('workflow_edges')
          .select('*')
          .eq('version_id', versionId),
      ]);

      setSteps((stepsData ?? []).map(toStep));
      setEdges((edgesData ?? []).map(toEdge));
    } catch (err) {
      console.error('Failed to load workflow:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      setSession((prev) =>
        prev ? { ...prev, status: newStatus as CaptureSession['status'] } : null,
      );
      // Reload data to get the workflow
      loadData();
    },
    [loadData],
  );

  // ─── Loading ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Camera className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-sm font-medium text-slate-600">
          Session not found
        </h3>
        <Link
          href="/captures"
          className="mt-3 text-xs text-blue-600 hover:underline"
        >
          Back to captures
        </Link>
      </div>
    );
  }

  // ─── Status badge ────────────────────────────────────

  const statusColors: Record<string, string> = {
    active: 'text-amber-700 bg-amber-50 border-amber-200',
    completed: 'text-blue-700 bg-blue-50 border-blue-200',
    processing: 'text-purple-700 bg-purple-50 border-purple-200',
    processed: 'text-green-700 bg-green-50 border-green-200',
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <Link
          href="/captures"
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-800 truncate">
            {session.title}
          </h1>
          <p className="text-[10px] text-slate-400">
            {new Date(session.startedAt).toLocaleString()} &middot;{' '}
            {entries.length} step{entries.length !== 1 ? 's' : ''}
            {recordings.length > 0 &&
              ` \u00b7 ${recordings.length} recording${recordings.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            statusColors[session.status] ?? statusColors.active
          }`}
        >
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </div>

      {/* Split view */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left panel: Raw capture data */}
        <div className="w-[400px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Captured Steps
            </h2>
            {entries.map((entry) => (
              <CaptureEntryCard key={entry.id} entry={entry} />
            ))}

            {recordings.length > 0 && (
              <>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-3">
                  Recordings
                </h2>
                {recordings.map((rec) => (
                  <RecordingPlayer key={rec.id} recording={rec} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right panel: Generated workflow diagram */}
        <div className="flex-1 bg-slate-50 flex flex-col">
          {workflow && steps.length > 0 ? (
            <EditModeProvider viewMode="tabs">
              <ReactFlowProvider>
                <SwimlaneDiagram
                  steps={steps}
                  edges={edges}
                  actors={workflow.actors}
                  phases={workflow.phases}
                />
              </ReactFlowProvider>
            </EditModeProvider>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <Camera className="h-10 w-10 text-slate-300 mb-3" />
              {session.status === 'processed' ? (
                <>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">
                    Workflow generated
                  </h3>
                  <p className="text-xs text-slate-400">
                    The AI-generated workflow will appear here once the data
                    loads.
                  </p>
                </>
              ) : session.status === 'processing' ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400 mb-3" />
                  <h3 className="text-sm font-medium text-slate-600 mb-1">
                    Processing...
                  </h3>
                  <p className="text-xs text-slate-400">
                    Claude is analyzing the captured steps and generating a
                    workflow diagram.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">
                    No workflow generated yet
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click &quot;Process with AI&quot; below to generate a
                    structured workflow from the captured steps.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <ReviewActions
        sessionId={session.id}
        status={session.status}
        workflowId={session.workflowId}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
