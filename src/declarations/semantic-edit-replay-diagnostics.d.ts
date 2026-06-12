import type { SemanticEditReplayStatus } from './semantic-edit-script.js';

export type SemanticEditReplayDiagnosticCategory = 'stale-anchor' | 'overlap' | 'missing-source' | 'projection-mismatch' | 'matched-source' | 'reanchored' | 'replay' | string;
export type SemanticEditReplayDiagnosticSeverity = 'info' | 'warning' | 'error' | string;
export type SemanticEditReplayDiagnosticScope = 'replay' | 'edit' | string;

export interface SemanticEditReplayDiagnostic {
  readonly code: string;
  readonly category: SemanticEditReplayDiagnosticCategory;
  readonly severity: SemanticEditReplayDiagnosticSeverity;
  readonly scope: SemanticEditReplayDiagnosticScope;
  readonly status?: SemanticEditReplayStatus | string;
  readonly operationId?: string;
  readonly sourcePath?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly editKind?: 'replace' | 'insert' | 'delete' | string;
  readonly start?: number;
  readonly end?: number;
  readonly expectedHash?: string;
  readonly actualHash?: string;
  readonly replacementHash?: string;
  readonly overlapOperationIds?: readonly string[];
}
