'use client';

import { useState, useEffect } from 'react';
import type { WorkflowStep, WorkflowEdge, UUID } from '@/types/workflow';
import { fetchLatestVersion, fetchVersionData } from '@/lib/supabase/queries';

/**
 * Fetches steps and edges for a given scenario ID.
 * Used by comparison components (slider, overlay) that need
 * data from scenarios other than the currently active one.
 */
export function useScenarioData(scenarioId: UUID | null) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scenarioId) {
      setSteps([]);
      setEdges([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchLatestVersion(scenarioId)
      .then((version) => {
        if (cancelled) return null;
        if (!version) return { steps: [] as WorkflowStep[], edges: [] as WorkflowEdge[] };
        return fetchVersionData(version.id);
      })
      .then((data) => {
        if (cancelled || !data) return;
        setSteps(data.steps);
        setEdges(data.edges);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load scenario data:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  return { steps, edges, loading };
}
