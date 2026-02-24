import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler = () => chain;

  chain.select = vi.fn().mockImplementation(handler);
  chain.insert = vi.fn().mockImplementation(handler);
  chain.update = vi.fn().mockImplementation(handler);
  chain.delete = vi.fn().mockImplementation(handler);
  chain.eq = vi.fn().mockImplementation(handler);
  chain.order = vi.fn().mockImplementation(handler);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (resolve?: ((value: { data: unknown; error: unknown }) => unknown) | null) =>
    Promise.resolve(resolvedValue).then(resolve ?? undefined);

  return chain;
}

const mockSupabaseFrom = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock('../client', () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
    storage: {
      from: mockStorageFrom,
    },
  }),
}));

import { createExport, fetchExportsForWorkflow, deleteExport, getAttachmentPublicUrl } from '../export-queries';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Validation tests
// ---------------------------------------------------------------------------

describe('createExport validation', () => {
  it('throws when workflowId is empty', async () => {
    await expect(
      createExport({
        workflowId: '',
        scenarioId: 's1',
        versionId: 'v1',
        title: 'Test',
        markdownContent: '# Test',
        exportMetadata: {
          workflowName: 'W',
          scenarioName: 'S',
          scenarioType: 'existing',
          versionNumber: 1,
          stepCount: 0,
          edgeCount: 0,
          actorCount: 0,
          phaseCount: 0,
          exportedAt: new Date().toISOString(),
        },
      }),
    ).rejects.toThrow('workflowId is required');
  });

  it('throws when title is empty', async () => {
    await expect(
      createExport({
        workflowId: 'w1',
        scenarioId: 's1',
        versionId: 'v1',
        title: '   ',
        markdownContent: '# Test',
        exportMetadata: {
          workflowName: 'W',
          scenarioName: 'S',
          scenarioType: 'existing',
          versionNumber: 1,
          stepCount: 0,
          edgeCount: 0,
          actorCount: 0,
          phaseCount: 0,
          exportedAt: new Date().toISOString(),
        },
      }),
    ).rejects.toThrow('Export title is required');
  });

  it('calls supabase insert with valid params', async () => {
    const dbRow = {
      id: 'exp1',
      workflow_id: 'w1',
      scenario_id: 's1',
      version_id: 'v1',
      title: 'My Export',
      markdown_content: '# Test',
      export_metadata: { workflowName: 'W', scenarioName: 'S', scenarioType: 'existing', versionNumber: 1, stepCount: 5, edgeCount: 3, actorCount: 2, phaseCount: 2, exportedAt: '2025-01-01T00:00:00Z' },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    const chain = createChainMock({ data: dbRow, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await createExport({
      workflowId: 'w1',
      scenarioId: 's1',
      versionId: 'v1',
      title: 'My Export',
      markdownContent: '# Test',
      exportMetadata: dbRow.export_metadata,
    });

    expect(result.id).toBe('exp1');
    expect(result.title).toBe('My Export');
    expect(result.workflowId).toBe('w1');
    expect(mockSupabaseFrom).toHaveBeenCalledWith('workflow_exports');
    expect(chain.insert).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Fetch tests
// ---------------------------------------------------------------------------

describe('fetchExportsForWorkflow', () => {
  it('returns transformed exports', async () => {
    const rows = [
      {
        id: 'exp1',
        workflow_id: 'w1',
        scenario_id: 's1',
        version_id: 'v1',
        title: 'Export 1',
        markdown_content: '# Doc',
        export_metadata: {},
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];
    const chain = createChainMock({ data: rows, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await fetchExportsForWorkflow('w1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('exp1');
    expect(result[0].workflowId).toBe('w1');
  });
});

// ---------------------------------------------------------------------------
// Delete tests
// ---------------------------------------------------------------------------

describe('deleteExport', () => {
  it('calls supabase delete with correct ID', async () => {
    const chain = createChainMock({ data: null, error: null });
    mockSupabaseFrom.mockReturnValue(chain);

    await deleteExport('exp1');
    expect(mockSupabaseFrom).toHaveBeenCalledWith('workflow_exports');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'exp1');
  });
});

// ---------------------------------------------------------------------------
// Storage URL tests
// ---------------------------------------------------------------------------

describe('getAttachmentPublicUrl', () => {
  it('returns public URL from storage', () => {
    mockStorageFrom.mockReturnValue({
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.example.com/file.pdf' } }),
    });

    const url = getAttachmentPublicUrl('w1/exp1/file.pdf');
    expect(url).toBe('https://storage.example.com/file.pdf');
    expect(mockStorageFrom).toHaveBeenCalledWith('export-attachments');
  });
});
