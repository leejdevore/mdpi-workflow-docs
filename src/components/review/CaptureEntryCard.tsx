'use client';

import { Image, Mic, Monitor } from 'lucide-react';
import type { CaptureEntry } from '@/lib/supabase/capture-queries';

interface CaptureEntryCardProps {
  entry: CaptureEntry;
}

export function CaptureEntryCard({ entry }: CaptureEntryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      {/* Header row */}
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-slate-400 mt-0.5 w-5 text-right shrink-0">
          {entry.entryNumber}.
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-800 truncate">
            {entry.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400">
              {new Date(entry.capturedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            {entry.activeApp && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                <Monitor className="h-2.5 w-2.5" />
                {entry.activeApp}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot */}
      {entry.screenshotPath && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.screenshotPath}
            alt={`Screenshot for step ${entry.entryNumber}`}
            className="w-full h-32 object-cover rounded border border-slate-100"
          />
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
          {entry.notes}
        </p>
      )}

      {/* Voice transcript */}
      {entry.voiceTranscript && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 bg-blue-50 rounded px-2 py-1.5">
          <Mic className="h-3 w-3 mt-0.5 shrink-0 text-blue-400" />
          <span className="italic">{entry.voiceTranscript}</span>
        </div>
      )}

      {/* Voice audio player */}
      {entry.voiceAudioPath && (
        <audio
          src={entry.voiceAudioPath}
          controls
          className="w-full h-8 mt-2"
        />
      )}
    </div>
  );
}
