-- ============================================================
-- Workflow Exports
-- ============================================================
CREATE TABLE workflow_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  markdown_content TEXT NOT NULL,
  export_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exports_workflow ON workflow_exports(workflow_id);
CREATE INDEX idx_exports_version ON workflow_exports(version_id);

CREATE TRIGGER workflow_exports_updated_at
  BEFORE UPDATE ON workflow_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Export Attachments
-- ============================================================
CREATE TABLE export_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES workflow_exports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_export ON export_attachments(export_id);

-- ============================================================
-- Row Level Security (open access — no auth)
-- ============================================================
ALTER TABLE workflow_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON workflow_exports FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE export_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON export_attachments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Storage bucket for export attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('export-attachments', 'export-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow all uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'export-attachments');

CREATE POLICY "Allow all reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'export-attachments');

CREATE POLICY "Allow all deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'export-attachments');
