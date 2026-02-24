'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type {
  Workflow,
  Scenario,
  ScenarioVersion,
  WorkflowStep,
  WorkflowEdge,
  NavTreeWorkflow,
  ActiveSelection,
  ActorDefinition,
  PhaseDefinition,
  ScenarioType,
  UUID,
} from '@/types/workflow';
import {
  fetchWorkflowTree,
  fetchWorkflow,
  fetchScenarios,
  fetchLatestVersion,
  fetchVersionData,
  createWorkflow as apiCreateWorkflow,
  createScenario as apiCreateScenario,
  createVersion as apiCreateVersion,
  saveVersionData,
  deleteWorkflow as apiDeleteWorkflow,
  deleteScenario as apiDeleteScenario,
  updateWorkflow as apiUpdateWorkflow,
} from '@/lib/supabase/queries';

// =========================================================
// Context Value
// =========================================================

interface WorkflowContextValue {
  // Nav tree data
  tree: NavTreeWorkflow[];
  treeLoading: boolean;

  // Active selection
  selection: ActiveSelection | null;

  // Active workflow detail
  activeWorkflow: Workflow | null;
  activeScenarios: Scenario[];
  activeVersion: ScenarioVersion | null;

  // Steps & edges for the active version
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  dataLoading: boolean;

  // Actors & phases for the active workflow
  actors: ActorDefinition[];
  phases: PhaseDefinition[];

  // Navigation actions
  selectScenario: (workflowId: UUID, scenarioId: UUID) => void;
  selectVersion: (versionId: UUID) => void;

  // CRUD actions
  addWorkflow: (name: string, description: string, actors: ActorDefinition[], phases: PhaseDefinition[]) => Promise<UUID>;
  removeWorkflow: (id: UUID) => Promise<void>;
  addScenario: (workflowId: UUID, name: string, type: ScenarioType, order: number) => Promise<UUID>;
  removeScenario: (id: UUID) => Promise<void>;

  // Update workflow metadata
  updateActors: (actors: ActorDefinition[]) => Promise<void>;
  updatePhases: (phases: PhaseDefinition[]) => Promise<void>;

  // Save version data
  saveData: (steps: WorkflowStep[], edges: WorkflowEdge[]) => Promise<void>;

  // Refresh
  refreshTree: () => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

// =========================================================
// Provider
// =========================================================

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<NavTreeWorkflow[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);

  const [selection, setSelection] = useState<ActiveSelection | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<Scenario[]>([]);
  const [activeVersion, setActiveVersion] = useState<ScenarioVersion | null>(null);

  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Derived
  const actors = activeWorkflow?.actors ?? [];
  const phases = activeWorkflow?.phases ?? [];

  // --- Load nav tree ---
  const refreshTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const data = await fetchWorkflowTree();
      setTree(data);
    } catch (err) {
      console.error('Failed to load workflow tree:', err);
      toast.error('Failed to load workflows');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  // Auto-select first workflow + scenario when tree loads
  useEffect(() => {
    if (tree.length > 0 && !selection) {
      const firstWorkflow = tree[0];
      const firstScenario = firstWorkflow.scenarios[0];
      if (firstScenario) {
        selectScenarioInternal(firstWorkflow.id, firstScenario.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  // --- Select a scenario ---
  const selectScenarioInternal = useCallback(
    async (workflowId: UUID, scenarioId: UUID) => {
      setDataLoading(true);
      try {
        // Fetch workflow details + scenarios in parallel
        const [wf, scenarios] = await Promise.all([
          fetchWorkflow(workflowId),
          fetchScenarios(workflowId),
        ]);
        setActiveWorkflow(wf);
        setActiveScenarios(scenarios);

        // Get latest version for the selected scenario
        const version = await fetchLatestVersion(scenarioId);
        setActiveVersion(version);

        if (version) {
          const { steps: s, edges: e } = await fetchVersionData(version.id);
          setSteps(s);
          setEdges(e);
          setSelection({ workflowId, scenarioId, versionId: version.id });
        } else {
          setSteps([]);
          setEdges([]);
          setSelection({ workflowId, scenarioId, versionId: '' });
        }
      } catch (err) {
        console.error('Failed to load scenario:', err);
        toast.error('Failed to load scenario');
      } finally {
        setDataLoading(false);
      }
    },
    []
  );

  const selectScenario = useCallback(
    (workflowId: UUID, scenarioId: UUID) => {
      selectScenarioInternal(workflowId, scenarioId);
    },
    [selectScenarioInternal]
  );

  // --- Select a specific version ---
  const selectVersion = useCallback(
    async (versionId: UUID) => {
      setDataLoading(true);
      try {
        const { steps: s, edges: e } = await fetchVersionData(versionId);
        setSteps(s);
        setEdges(e);
        if (selection) {
          setSelection({ ...selection, versionId });
        }
      } catch (err) {
        console.error('Failed to load version:', err);
        toast.error('Failed to load version');
      } finally {
        setDataLoading(false);
      }
    },
    [selection]
  );

  // --- CRUD ---

  const addWorkflow = useCallback(
    async (name: string, description: string, actorDefs: ActorDefinition[], phaseDefs: PhaseDefinition[]) => {
      const wf = await apiCreateWorkflow(name, description, actorDefs, phaseDefs);

      // Create 3 default scenarios
      const types: { name: string; type: ScenarioType; order: number }[] = [
        { name: 'Current State', type: 'existing', order: 0 },
        { name: 'Digitized', type: 'digitized', order: 1 },
        { name: 'Digitally Transformed', type: 'transformed', order: 2 },
      ];

      for (const t of types) {
        const s = await apiCreateScenario(wf.id, t.name, t.type, t.order);
        await apiCreateVersion(s.id, 1, 'manual');
      }

      await refreshTree();
      toast.success('Workflow created');
      return wf.id;
    },
    [refreshTree]
  );

  const removeWorkflow = useCallback(
    async (id: UUID) => {
      await apiDeleteWorkflow(id);
      await refreshTree();
      // If we deleted the active workflow, clear selection
      if (selection?.workflowId === id) {
        setSelection(null);
        setActiveWorkflow(null);
        setActiveScenarios([]);
        setActiveVersion(null);
        setSteps([]);
        setEdges([]);
      }
    },
    [refreshTree, selection]
  );

  const addScenario = useCallback(
    async (workflowId: UUID, name: string, type: ScenarioType, order: number) => {
      const s = await apiCreateScenario(workflowId, name, type, order);
      await apiCreateVersion(s.id, 1, 'manual');
      await refreshTree();
      // Also refresh scenarios list if this is the active workflow
      if (workflowId === selection?.workflowId) {
        const scenarios = await fetchScenarios(workflowId);
        setActiveScenarios(scenarios);
      }
      return s.id;
    },
    [refreshTree, selection]
  );

  const removeScenario = useCallback(
    async (id: UUID) => {
      await apiDeleteScenario(id);
      await refreshTree();
      if (selection?.scenarioId === id) {
        // Switch to first remaining scenario
        if (activeScenarios.length > 1) {
          const remaining = activeScenarios.filter((s) => s.id !== id);
          if (remaining[0] && selection.workflowId) {
            await selectScenarioInternal(selection.workflowId, remaining[0].id);
          }
        }
      }
    },
    [refreshTree, selection, activeScenarios, selectScenarioInternal]
  );

  // --- Update workflow metadata ---
  const updateActors = useCallback(
    async (newActors: ActorDefinition[]) => {
      if (!selection?.workflowId) return;
      const updated = await apiUpdateWorkflow(selection.workflowId, { actors: newActors });
      setActiveWorkflow(updated);
      toast.success('Actors updated');
    },
    [selection]
  );

  const updatePhases = useCallback(
    async (newPhases: PhaseDefinition[]) => {
      if (!selection?.workflowId) return;
      const updated = await apiUpdateWorkflow(selection.workflowId, { phases: newPhases });
      setActiveWorkflow(updated);
      toast.success('Phases updated');
    },
    [selection]
  );

  // --- Save ---
  const saveData = useCallback(
    async (newSteps: WorkflowStep[], newEdges: WorkflowEdge[]) => {
      if (!selection?.versionId) return;
      await saveVersionData(selection.versionId, newSteps, newEdges);
      setSteps(newSteps);
      setEdges(newEdges);
      toast.success('Data saved');
    },
    [selection]
  );

  const value: WorkflowContextValue = {
    tree,
    treeLoading,
    selection,
    activeWorkflow,
    activeScenarios,
    activeVersion,
    steps,
    edges,
    dataLoading,
    actors,
    phases,
    selectScenario,
    selectVersion,
    addWorkflow,
    removeWorkflow,
    addScenario,
    removeScenario,
    updateActors,
    updatePhases,
    saveData,
    refreshTree,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

// =========================================================
// Hook
// =========================================================

export function useWorkflowContext() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error('useWorkflowContext must be used within WorkflowProvider');
  }
  return ctx;
}
