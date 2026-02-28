'use client';

import Link from 'next/link';
import { Clock, ChevronRight, CheckCircle, Loader2, Circle, Cpu } from 'lucide-react';
import type { CaptureSession } from '@/lib/supabase/capture-queries';

interface CaptureSessionCardProps {
  session: CaptureSession;
  entryCount?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: 'Active', color: 'text-amber-600 bg-amber-50', icon: Circle },
  completed: { label: 'Completed', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-purple-600 bg-purple-50', icon: Loader2 },
  processed: { label: 'Processed', color: 'text-green-600 bg-green-50', icon: Cpu },
};

export function CaptureSessionCard({ session, entryCount }: CaptureSessionCardProps) {
  const statusConfig = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  const startedDate = new Date(session.startedAt);
  const formattedDate = startedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/captures/${session.id}`}
      className="group block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 truncate">
            {session.title}
          </h3>

          <div className="flex items-center gap-3 mt-1.5">
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}
            >
              <StatusIcon className={`h-3 w-3 ${session.status === 'processing' ? 'animate-spin' : ''}`} />
              {statusConfig.label}
            </span>

            {/* Date */}
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="h-3 w-3" />
              {formattedDate} at {formattedTime}
            </span>

            {/* Entry count */}
            {entryCount !== undefined && (
              <span className="text-[10px] text-slate-400">
                {entryCount} step{entryCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 mt-1 shrink-0" />
      </div>
    </Link>
  );
}
