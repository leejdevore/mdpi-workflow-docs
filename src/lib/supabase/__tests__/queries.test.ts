import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

// Chain-builder for mocking Supabase query builder pattern
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler = () => chain;

  chain.select = vi.fn().mockImplementation(handler);
  chain.insert = vi.fn().mockImplementation(handler);
  chain.update = vi.fn().mockImplementation(handler);
  chain.delete = vi.fn().mockImplementation(handler);
  chain.upsert = vi.fn().mockImplementation(handler);
  chain.eq = vi.fn().mockImplementation(handler);
  chain.in = vi.fn().mockImplementation(handler);
  chain.order = vi.fn().mockImplementation(handler);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);

  // For non-single queries, make chain itself thenable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (resolve?: ((value: { data: unknown; error: unknown }) => unknown) | null) =>
    Promise.resolve(resolvedValue).then(resolve ?? undefined);

  return chain;
}

const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();

vi.mock('../client', () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
    rpc: mockSupabaseRpc,
  }),
}));

// Import after mock setup
import { createWorkflow, createScenario, createVersion } from '../queries';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Validation tests
// ---------------------------------------------------------------------------

describe('createWorkflow validation', () => {
  it('throws when name is empty', async () => {
    await expect(createWorkflow('', 'desc', [], [])).rejects.toThrow('Workflow name is required');
  });

  it('throws when name is whitespace only', async () => {
    await expect(createWorkflow('   ', 'desc', [], [])).rejects.toThrow('Workflow name is required');
  });

  it('calls supabase insert with valid name', async () => {
    const dbRow = {
      id: 'w1',
      name: 'My Workflow',
      description: 'desc',
      actors: [],
      phases: [],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    const chain = createChainMock({ data: dbRow, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await createWorkflow('My Workflow', 'desc', [], []);
    expect(result.name).toBe('My Workflow');
    expect(mockSupabaseFrom).toHaveBeenCalledWith('workflows');
    expect(chain.insert).toHaveBeenCalled();
  });
});

describe('createScenario validation', () => {
  it('throws when workflowId is empty', async () => {
    await expect(createScenario('', 'Test', 'existing', 0)).rejects.toThrow('workflowId is required');
  });

  it('throws when name is empty', async () => {
    await expect(createScenario('w1', '', 'existing', 0)).rejects.toThrow('Scenario name is required');
  });

  it('throws when name is whitespace only', async () => {
    await expect(createScenario('w1', '   ', 'existing', 0)).rejects.toThrow('Scenario name is required');
  });

  it('calls supabase insert with valid params', async () => {
    const dbRow = {
      id: 's1',
      workflow_id: 'w1',
      name: 'Existing',
      description: '',
      scenario_type: 'existing',
      display_order: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    const chain = createChainMock({ data: dbRow, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await createScenario('w1', 'Existing', 'existing', 0);
    expect(result.name).toBe('Existing');
    expect(mockSupabaseFrom).toHaveBeenCalledWith('scenarios');
  });
});

describe('createVersion validation', () => {
  it('throws when scenarioId is empty', async () => {
    await expect(createVersion('', 1, 'seed')).rejects.toThrow('scenarioId is required');
  });

  it('tries RPC first, falls back on error', async () => {
    // RPC fails
    mockSupabaseRpc.mockResolvedValue({ data: null, error: { message: 'function not found' } });

    // Fallback queries
    const updateChain = createChainMock({ data: null, error: null });
    const insertChain = createChainMock({
      data: {
        id: 'v1',
        scenario_id: 's1',
        version_number: 1,
        label: null,
        source: 'seed',
        is_latest: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    });

    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      // First call is the UPDATE (mark old versions not latest)
      if (callCount === 1) return updateChain;
      // Second call is the INSERT
      return insertChain;
    });

    const result = await createVersion('s1', 1, 'seed');
    expect(result.id).toBe('v1');
    expect(result.isLatest).toBe(true);
    expect(mockSupabaseRpc).toHaveBeenCalledWith('create_version_atomic', expect.any(Object));
  });

  it('uses RPC result when available', async () => {
    const rpcResult = {
      id: 'v2',
      scenario_id: 's1',
      version_number: 2,
      label: null,
      source: 'manual',
      is_latest: true,
      created_at: '2025-01-01T00:00:00Z',
    };
    mockSupabaseRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await createVersion('s1', 2, 'manual');
    expect(result.id).toBe('v2');
    expect(result.versionNumber).toBe(2);
    // Should NOT call .from() since RPC succeeded
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });
});
