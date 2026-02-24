import { createClient } from './client';
import type { WorkflowExport, ExportMetadata, ExportAttachment } from '@/types/export';
import type { UUID } from '@/types/workflow';

// =========================================================
// DB row types (snake_case from Supabase)
// =========================================================

interface DbWorkflowExport {
  id: string;
  workflow_id: string;
  scenario_id: string;
  version_id: string;
  title: string;
  markdown_content: string;
  export_metadata: ExportMetadata;
  created_at: string;
  updated_at: string;
}

interface DbExportAttachment {
  id: string;
  export_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  display_order: number;
  created_at: string;
}

// =========================================================
// DB → Domain transforms
// =========================================================

function toExport(row: DbWorkflowExport): WorkflowExport {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    scenarioId: row.scenario_id,
    versionId: row.version_id,
    title: row.title,
    markdownContent: row.markdown_content,
    exportMetadata: row.export_metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAttachment(row: DbExportAttachment): ExportAttachment {
  return {
    id: row.id,
    exportId: row.export_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

// =========================================================
// Export CRUD operations
// =========================================================

/** Create a new markdown export record */
export async function createExport(params: {
  workflowId: UUID;
  scenarioId: UUID;
  versionId: UUID;
  title: string;
  markdownContent: string;
  exportMetadata: ExportMetadata;
}): Promise<WorkflowExport> {
  if (!params.workflowId) throw new Error('workflowId is required');
  if (!params.title.trim()) throw new Error('Export title is required');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('workflow_exports')
    .insert({
      workflow_id: params.workflowId,
      scenario_id: params.scenarioId,
      version_id: params.versionId,
      title: params.title,
      markdown_content: params.markdownContent,
      export_metadata: params.exportMetadata,
    })
    .select()
    .single();

  if (error) throw error;
  return toExport(data);
}

/** Fetch all exports for a workflow */
export async function fetchExportsForWorkflow(workflowId: UUID): Promise<WorkflowExport[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workflow_exports')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toExport);
}

/** Fetch a single export by ID */
export async function fetchExport(exportId: UUID): Promise<WorkflowExport | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workflow_exports')
    .select('*')
    .eq('id', exportId)
    .single();

  if (error) return null;
  return toExport(data);
}

/** Delete an export and its attachments (cascade) */
export async function deleteExport(exportId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('workflow_exports')
    .delete()
    .eq('id', exportId);
  if (error) throw error;
}

// =========================================================
// Attachment operations
// =========================================================

/** Upload a file to Supabase Storage and create an attachment record */
export async function uploadAttachment(params: {
  exportId: UUID;
  workflowId: UUID;
  file: File;
  displayOrder: number;
}): Promise<ExportAttachment> {
  const supabase = createClient();
  const filePath = `${params.workflowId}/${params.exportId}/${params.file.name}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('export-attachments')
    .upload(filePath, params.file, {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Create DB record
  const { data, error } = await supabase
    .from('export_attachments')
    .insert({
      export_id: params.exportId,
      file_name: params.file.name,
      file_path: filePath,
      file_size: params.file.size,
      mime_type: params.file.type || 'application/octet-stream',
      display_order: params.displayOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return toAttachment(data);
}

/** Fetch all attachments for an export */
export async function fetchAttachments(exportId: UUID): Promise<ExportAttachment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('export_attachments')
    .select('*')
    .eq('export_id', exportId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toAttachment);
}

/** Delete an attachment record and its storage file */
export async function deleteAttachment(attachmentId: UUID, filePath: string): Promise<void> {
  const supabase = createClient();

  // Delete from storage first
  await supabase.storage.from('export-attachments').remove([filePath]);

  // Then delete DB record
  const { error } = await supabase
    .from('export_attachments')
    .delete()
    .eq('id', attachmentId);

  if (error) throw error;
}

/** Get the public URL for an attachment file */
export function getAttachmentPublicUrl(filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('export-attachments').getPublicUrl(filePath);
  return data.publicUrl;
}
