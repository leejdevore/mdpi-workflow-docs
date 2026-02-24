-- Atomic version creation: marks previous versions as not-latest
-- and inserts the new version in a single transaction.
CREATE OR REPLACE FUNCTION create_version_atomic(
  p_scenario_id UUID,
  p_version_number INT,
  p_source TEXT,
  p_label TEXT DEFAULT NULL
)
RETURNS scenario_versions
LANGUAGE plpgsql
AS $$
DECLARE
  v_result scenario_versions;
BEGIN
  UPDATE scenario_versions
  SET is_latest = false
  WHERE scenario_id = p_scenario_id AND is_latest = true;

  INSERT INTO scenario_versions (scenario_id, version_number, source, label, is_latest)
  VALUES (p_scenario_id, p_version_number, p_source, p_label, true)
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
