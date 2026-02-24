-- ============================================================
-- Workflows
-- ============================================================
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  actors JSONB NOT NULL DEFAULT '[]',
  phases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Scenarios
-- ============================================================
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('existing', 'digitized', 'transformed', 'custom')),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenarios_workflow ON scenarios(workflow_id);

-- ============================================================
-- Scenario Versions
-- ============================================================
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  label TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv-import', 'ai-generated', 'seed')),
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, version_number)
);

CREATE INDEX idx_versions_scenario ON scenario_versions(scenario_id);
CREATE INDEX idx_versions_latest ON scenario_versions(scenario_id, is_latest) WHERE is_latest = true;

-- ============================================================
-- Workflow Steps
-- ============================================================
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  step_number INT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  actor_id TEXT NOT NULL,
  phase_id TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('manual', 'automated', 'data-driven', 'hybrid')),
  documents JSONB DEFAULT '[]',
  pain_points JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  tools_used JSONB DEFAULT '[]',
  "column" INT NOT NULL DEFAULT 0,
  branch TEXT,
  sub_items JSONB DEFAULT '[]',
  shape TEXT DEFAULT 'process',
  impact JSONB,
  position_x FLOAT,
  position_y FLOAT
);

CREATE INDEX idx_steps_version ON workflow_steps(version_id);

-- ============================================================
-- Workflow Edges
-- ============================================================
CREATE TABLE workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  source_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  target_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  label TEXT,
  edge_type TEXT DEFAULT 'default' CHECK (edge_type IN ('default', 'conditional')),
  animated BOOLEAN DEFAULT false
);

CREATE INDEX idx_edges_version ON workflow_edges(version_id);

-- ============================================================
-- Meta-Workflows
-- ============================================================
CREATE TABLE meta_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meta_workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_workflow_id UUID NOT NULL REFERENCES meta_workflows(id) ON DELETE CASCADE,
  child_workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  is_branch BOOLEAN NOT NULL DEFAULT false,
  branch_scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_meta_nodes_meta ON meta_workflow_nodes(meta_workflow_id);

CREATE TABLE meta_workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_workflow_id UUID NOT NULL REFERENCES meta_workflows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES meta_workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES meta_workflow_nodes(id) ON DELETE CASCADE,
  label TEXT
);

CREATE INDEX idx_meta_edges_meta ON meta_workflow_edges(meta_workflow_id);

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER meta_workflows_updated_at
  BEFORE UPDATE ON meta_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (open access — no auth)
-- ============================================================
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON workflows FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON scenarios FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE scenario_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON scenario_versions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON workflow_steps FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON workflow_edges FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE meta_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON meta_workflows FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE meta_workflow_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON meta_workflow_nodes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE meta_workflow_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON meta_workflow_edges FOR ALL USING (true) WITH CHECK (true);
