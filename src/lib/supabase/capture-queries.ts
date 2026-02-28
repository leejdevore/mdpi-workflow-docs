import { createClient } from './client';

// ─── Types ────────────────────────────────────────────────

export interface CaptureSession {
  id: string;
  workflowId: string | null;
  title: string;
  status: 'active' | 'completed' | 'processing' | 'processed';
  sessionMetadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
}

export interface CaptureEntry {
  id: string;
  sessionId: string;
  entryNumber: number;
  title: string;
  notes: string;
  screenshotPath: string | null;
  voiceTranscript: string | null;
  voiceAudioPath: string | null;
  activeApp: string | null;
  capturedAt: string;
}

export interface CaptureRecording {
  id: string;
  sessionId: string;
  recordingType: 'screen' | 'voice';
  filePath: string | null;
  durationSeconds: number | null;
  fileSize: number | null;
  startedAt: string;
  endedAt: string | null;
}

// ─── Fetch functions ───────────────────────────────────────

/** Fetch capture sessions, optionally filtered by status */
export async function fetchCaptureSessions(
  status?: string,
): Promise<CaptureSession[]> {
  const supabase = createClient();
  let query = supabase
    .from('capture_sessions')
    .select('*')
    .order('started_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toCaptureSession);
}

/** Fetch a single capture session by ID */
export async function fetchCaptureSession(
  sessionId: string,
): Promise<CaptureSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('capture_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) return null;
  return toCaptureSession(data);
}

/** Fetch all entries for a capture session */
export async function fetchCaptureEntries(
  sessionId: string,
): Promise<CaptureEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('capture_entries')
    .select('*')
    .eq('session_id', sessionId)
    .order('entry_number', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toCaptureEntry);
}

/** Fetch recordings for a capture session */
export async function fetchCaptureRecordings(
  sessionId: string,
): Promise<CaptureRecording[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('capture_recordings')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;
  return (data ?? []).map(toCaptureRecording);
}

/** Update the status of a capture session */
export async function updateCaptureSessionStatus(
  sessionId: string,
  status: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('capture_sessions')
    .update({ status })
    .eq('id', sessionId);
  if (error) throw error;
}

// ─── Transforms (DB snake_case → domain camelCase) ───────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCaptureSession(row: any): CaptureSession {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    title: row.title,
    status: row.status,
    sessionMetadata: row.session_metadata ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCaptureEntry(row: any): CaptureEntry {
  return {
    id: row.id,
    sessionId: row.session_id,
    entryNumber: row.entry_number,
    title: row.title,
    notes: row.notes ?? '',
    screenshotPath: row.screenshot_path,
    voiceTranscript: row.voice_transcript,
    voiceAudioPath: row.voice_audio_path,
    activeApp: row.active_app,
    capturedAt: row.captured_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCaptureRecording(row: any): CaptureRecording {
  return {
    id: row.id,
    sessionId: row.session_id,
    recordingType: row.recording_type,
    filePath: row.file_path,
    durationSeconds: row.duration_seconds,
    fileSize: row.file_size,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}
