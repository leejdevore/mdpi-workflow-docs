-- ============================================================
-- 005: Capture Sessions — real-time workflow capture data
-- ============================================================
-- Used by the Workflow Capture companion app (Tauri desktop)
-- to store captured workflow steps, screenshots, and recordings
-- that get processed by AI into structured workflows.

-- ─── capture_sessions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'processing', 'processed')),
  session_metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capture_sessions_status ON capture_sessions(status);
CREATE INDEX idx_capture_sessions_workflow ON capture_sessions(workflow_id)
  WHERE workflow_id IS NOT NULL;

-- ─── capture_entries ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
  entry_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  screenshot_path TEXT,
  voice_transcript TEXT,
  voice_audio_path TEXT,
  active_app TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capture_entries_session ON capture_entries(session_id, entry_number);

-- ─── capture_recordings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
  recording_type TEXT NOT NULL CHECK (recording_type IN ('screen', 'voice')),
  file_path TEXT,
  duration_seconds INTEGER,
  file_size BIGINT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capture_recordings_session ON capture_recordings(session_id);

-- ─── Helper function (idempotent) ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Updated-at trigger ─────────────────────────────────
CREATE TRIGGER set_capture_sessions_updated_at
  BEFORE UPDATE ON capture_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS policies (open access for now) ──────────────────
ALTER TABLE capture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to capture_sessions"
  ON capture_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to capture_entries"
  ON capture_entries FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to capture_recordings"
  ON capture_recordings FOR ALL USING (true) WITH CHECK (true);

-- ─── Storage bucket for screenshots/recordings ──────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('capture-media', 'capture-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on capture-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'capture-media');

CREATE POLICY "Allow public insert on capture-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'capture-media');

CREATE POLICY "Allow public update on capture-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'capture-media');

CREATE POLICY "Allow public delete on capture-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'capture-media');
