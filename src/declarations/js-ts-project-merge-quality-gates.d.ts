import type { JsTsSafeMergeConflict } from './js-ts-safe-merge.js';
export type JsTsProjectMergeQualityGateCategory = 'lint' | 'format' | 'test' | 'build' | string;
export interface JsTsProjectMergeQualityGateInput {
  readonly id?: string; readonly gateId?: string; readonly category?: JsTsProjectMergeQualityGateCategory;
  readonly status?: string; readonly result?: string; readonly command?: string; readonly artifactPath?: string; readonly path?: string;
  readonly evidenceId?: string; readonly summary?: string | Record<string, unknown>; readonly reasonCode?: string;
}
export interface JsTsProjectMergeQualityGateRecord {
  readonly id: string; readonly category: JsTsProjectMergeQualityGateCategory; readonly status: string; readonly command?: string;
  readonly artifactPath?: string; readonly evidenceId?: string; readonly summary?: string | Record<string, unknown>; readonly reasonCode?: string;
}
export interface JsTsProjectMergeQualityGateEvidence {
  readonly id: string; readonly kind: string; readonly status: 'passed' | 'failed' | string; readonly summary: string;
  readonly metadata?: Record<string, unknown> & {
    readonly gateId?: string; readonly category?: JsTsProjectMergeQualityGateCategory; readonly command?: string; readonly artifactPath?: string;
    readonly admissionAction?: 'apply' | 'block' | string; readonly nextMissingEvidence?: JsTsProjectMergeQualityGateMissingEvidence;
    readonly autoMergeClaim?: false; readonly semanticEquivalenceClaim?: false;
  };
}
export interface JsTsProjectMergeQualityGateMissingEvidence {
  readonly code?: string; readonly kind: 'quality-gate' | string; readonly scope: 'quality-gates' | string;
  readonly status: 'missing-or-failed' | string; readonly action: 'rerun-gate' | string;
  readonly gateId?: string; readonly category?: JsTsProjectMergeQualityGateCategory; readonly command?: string; readonly artifactPath?: string;
  readonly summary?: string; readonly autoMergeClaim: false; readonly semanticEquivalenceClaim: false;
}
export interface JsTsProjectMergeQualityGateDecision {
  readonly status: 'passed' | 'blocked' | string; readonly action: 'apply' | 'block' | string;
  readonly reviewRequired: boolean; readonly autoApplyCandidate: boolean; readonly reasonCodes: readonly string[];
  readonly nextMissingEvidence?: JsTsProjectMergeQualityGateMissingEvidence;
  readonly autoMergeClaim: false; readonly semanticEquivalenceClaim: false;
}
export interface JsTsProjectMergeQualityGate {
  readonly kind: 'frontier.lang.jsTsProjectMergeQualityGate'; readonly version: 1; readonly id: string; readonly status: 'passed' | 'blocked';
  readonly gates: readonly JsTsProjectMergeQualityGateRecord[]; readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly evidence: readonly JsTsProjectMergeQualityGateEvidence[];
  readonly decision: JsTsProjectMergeQualityGateDecision;
  readonly summary: { readonly gates: number; readonly passed: number; readonly failed: number; readonly lint: number; readonly format: number; readonly test: number; readonly build: number; };
}
