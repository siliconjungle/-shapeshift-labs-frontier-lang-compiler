import type { SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';

export interface SemanticImportSidecarQualityWarning {
  readonly code: string;
  readonly severity: 'warning' | string;
  readonly message: string;
  readonly action: string;
  readonly sourcePaths: readonly string[];
}

export interface SemanticImportSidecarProofAdmissionSummary {
  readonly total: number;
  readonly obligations: number;
  readonly discharged: number;
  readonly pending?: number;
  readonly failed: number;
  readonly stale?: number;
  readonly assumed?: number;
  readonly externalToolRequired?: number;
  readonly open: number;
  readonly unknown: number;
  readonly empty: boolean;
  readonly autoMergeProof?: false;
}

export interface SemanticImportSidecarQuality {
  readonly schema: 'frontier.lang.semanticSidecarQuality.v1';
  readonly expected: boolean;
  readonly expectedSatisfied: boolean;
  readonly expectedMissingReasonCodes: readonly string[];
  readonly selected: boolean;
  readonly eligible: boolean;
  readonly imported: boolean;
  readonly importCount: number;
  readonly symbolCount: number;
  readonly ownershipRegionCount: number;
  readonly patchHintCount: number;
  readonly proofSummary: SemanticImportSidecarProofAdmissionSummary;
  readonly evidenceCount: number;
  readonly warningCount: number;
  readonly warnings: readonly SemanticImportSidecarQualityWarning[];
  readonly emptyEvidenceWarnings: readonly SemanticImportSidecarQualityWarning[];
}

export interface SemanticImportSidecarAdmission {
  readonly schema: 'frontier.lang.semanticSidecarAdmission.v1';
  readonly expected: boolean;
  readonly expectedSatisfied: boolean;
  readonly expectedMissingReasonCodes: readonly string[];
  readonly selected: boolean;
  readonly eligible: boolean;
  readonly imported: boolean;
  readonly importCount: number;
  readonly readiness: SemanticMergeReadiness;
  readonly action: string;
  readonly counts: {
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly patchHints: number;
    readonly evidence: number;
    readonly proofRecords: number;
    readonly proofObligations: number;
    readonly proofFailedObligations: number;
  };
  readonly proofSummary: SemanticImportSidecarProofAdmissionSummary;
  readonly warnings: readonly SemanticImportSidecarQualityWarning[];
  readonly emptyEvidenceWarnings: readonly SemanticImportSidecarQualityWarning[];
}
