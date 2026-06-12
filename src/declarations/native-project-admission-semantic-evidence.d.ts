export type NativeProjectAdmissionSemanticEvidenceWarningCode =
  | 'missing-ownership-regions'
  | 'missing-patch-hints'
  | (string & {});

export interface NativeProjectAdmissionSemanticEvidenceWarning {
  readonly code: NativeProjectAdmissionSemanticEvidenceWarningCode;
  readonly reasonCode: NativeProjectAdmissionSemanticEvidenceWarningCode;
  readonly severity: 'warning' | string;
  readonly message: string;
  readonly action: string;
  readonly sourcePath?: string;
  readonly sourcePaths: readonly string[];
  readonly semanticSymbols: number;
  readonly ownershipRegions: number;
  readonly patchHints: number;
  readonly semanticImportExpected: boolean;
  readonly changedSource: boolean;
}

export interface NativeProjectAdmissionSemanticEvidence {
  readonly empty: boolean;
  readonly emptySourceCount: number;
  readonly emptySourcePaths: readonly string[];
  readonly symbols: number;
  readonly occurrences: number;
  readonly relations: number;
  readonly facts: number;
  readonly evidenceRecords: number;
  readonly warningCount: number;
  readonly warningReasonCodes: readonly NativeProjectAdmissionSemanticEvidenceWarningCode[];
  readonly warningSourcePaths: readonly string[];
  readonly warnings: readonly NativeProjectAdmissionSemanticEvidenceWarning[];
}
