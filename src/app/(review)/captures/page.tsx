'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { fetchCaptureSessions, fetchCaptureEntries, type CaptureSession } from '@/lib/supabase/capture-queries';
import { CaptureSessionCard } from '@/components/review/CaptureSessionCard';

export default function CapturesPage() {
  const [sessions, setSessions] = useState<CaptureSession[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const allSessions = await fetchCaptureSessions();
      setSessions(allSessions);

      // Load entry counts for each session
      const counts: Record<string, number> = {};
      await Promise.all(
        allSessions.map(async (s) => {
          try {
            const entries = await fetchCaptureEntries(s.id);
            counts[s.id] = entries.length;
          } catch {
            counts[s.id] = 0;
          }
        }),
      );
      setEntryCounts(counts);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <Link
          href="/"
          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Camera className="h-5 w-5 text-blue-500" />
        <h1 className="text-lg font-semibold text-slate-800">
          Workflow Captures
        </h1>
        <div className="flex-1" />
        <button
          onClick={loadSessions}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Camera className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              No captures yet
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Use the Workflow Capture companion app to record workflow steps in
              real-time. They&apos;ll appear here for AI processing and review.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {sessions.map((session) => (
              <CaptureSessionCard
                key={session.id}
                session={session}
                entryCount={entryCounts[session.id]}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
