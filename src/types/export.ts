import type { UUID } from './workflow';

// =========================================================
// Export domain entities
// =========================================================

/** A saved markdown export of a workflow scenario */
export interface WorkflowExport {
  id: UUID;
  workflowId: UUID;
  scenarioId: UUID;
  versionId: UUID;
  title: string;
  markdownContent: string;
  exportMetadata: ExportMetadata;
  createdAt: string;
  updatedAt: string;
}

/** Snapshot metadata captured at export time */
export interface ExportMetadata {
  workflowName: string;
  scenarioName: string;
  scenarioType: string;
  versionNumber: number;
  stepCount: number;
  edgeCount: number;
  actorCount: number;
  phaseCount: number;
  exportedAt: string;
}

/** A file attached to an export */
export interface ExportAttachment {
  id: UUID;
  exportId: UUID;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  displayOrder: number;
  createdAt: string;
}

// =========================================================
// Export configuration (UI state)
// =========================================================

/** Options controlling which sections appear in the generated markdown */
export interface MarkdownExportOptions {
  includeProcessNarrative: boolean;
  includeTechnicalSpec: boolean;
  includeDataModels: boolean;
  includeBusinessRules: boolean;
  includeEdgeCases: boolean;
  includeImpactScores: boolean;
  includePainPoints: boolean;
  includeImprovements: boolean;
}

/** Full configuration for an export session */
export interface ExportConfig {
  title: string;
  options: MarkdownExportOptions;
  attachments: PendingAttachment[];
}

/** A file selected by the user but not yet uploaded to storage */
export interface PendingAttachment {
  file: File;
  displayOrder: number;
}

/** Default options — all sections enabled */
export const DEFAULT_EXPORT_OPTIONS: MarkdownExportOptions = {
  includeProcessNarrative: true,
  includeTechnicalSpec: true,
  includeDataModels: true,
  includeBusinessRules: true,
  includeEdgeCases: true,
  includeImpactScores: true,
  includePainPoints: true,
  includeImprovements: true,
};
