'use client';

import { Video, Mic, Clock, HardDrive } from 'lucide-react';
import type { CaptureRecording } from '@/lib/supabase/capture-queries';

interface RecordingPlayerProps {
  recording: CaptureRecording;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordingPlayer({ recording }: RecordingPlayerProps) {
  const isVideo = recording.recordingType === 'screen';
  const Icon = isVideo ? Video : Mic;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {isVideo ? 'Screen Recording' : 'Voice Recording'}
        </span>
        <div className="flex-1" />
        {recording.durationSeconds != null && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            {formatDuration(recording.durationSeconds)}
          </span>
        )}
        {recording.fileSize != null && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <HardDrive className="h-3 w-3" />
            {formatFileSize(recording.fileSize)}
          </span>
        )}
      </div>

      {recording.filePath && (
        isVideo ? (
          <video
            src={recording.filePath}
            controls
            className="w-full rounded border border-slate-100"
          />
        ) : (
          <audio
            src={recording.filePath}
            controls
            className="w-full h-10"
          />
        )
      )}

      {!recording.filePath && (
        <p className="text-xs text-slate-400 italic">
          Recording file not yet uploaded
        </p>
      )}
    </div>
  );
}
