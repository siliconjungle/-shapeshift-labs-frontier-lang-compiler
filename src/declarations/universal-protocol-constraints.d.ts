import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalProtocolConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalProtocolConstraintAction =
  | 'skip'
  | 'attach-protocol-constraint-record'
  | 'review-protocol-constraint-loss'
  | 'collect-protocol-constraint-evidence'
  | 'reject';

export interface UniversalProtocolRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly name?: string;
  readonly symbolName?: string;
  readonly protocolName?: string;
  readonly traitName?: string;
  readonly interfaceName?: string;
  readonly symbolId?: string;
  readonly protocolKind?: string;
  readonly kind?: string;
  readonly symbolKind?: string;
  readonly declarationKind?: string;
  readonly typeKind?: string;
  readonly predicate?: string;
  readonly relationKind?: string;
  readonly subjectName?: string;
  readonly receiverName?: string;
  readonly implementedFor?: string;
  readonly requirementNames?: readonly string[];
  readonly requirements?: readonly string[];
  readonly methods?: readonly string[];
  readonly members?: readonly string[];
  readonly associatedTypeNames?: readonly string[];
  readonly associatedTypes?: readonly string[];
  readonly genericParameterNames?: readonly string[];
  readonly typeParameters?: readonly string[];
  readonly genericParameters?: readonly string[];
  readonly boundNames?: readonly string[];
  readonly bounds?: readonly string[];
  readonly traitBounds?: readonly string[];
  readonly protocolBounds?: readonly string[];
  readonly whereBounds?: readonly string[];
  readonly implementationKinds?: readonly string[];
  readonly implKinds?: readonly string[];
  readonly implementations?: readonly string[];
  readonly dispatchKinds?: readonly string[];
  readonly dispatchModes?: readonly string[];
  readonly coherenceKinds?: readonly string[];
  readonly coherenceRules?: readonly string[];
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & {
    readonly factKinds?: readonly string[];
    readonly traits?: readonly string[];
    readonly autoTraits?: readonly string[];
  };
}

export interface UniversalProtocolRecord {
  readonly id: string;
  readonly role: string;
  readonly name?: string;
  readonly symbolId?: string;
  readonly protocolKind?: string;
  readonly subjectName?: string;
  readonly requirementNames: readonly string[];
  readonly associatedTypeNames: readonly string[];
  readonly genericParameterNames: readonly string[];
  readonly boundNames: readonly string[];
  readonly implementationKinds: readonly string[];
  readonly dispatchKinds: readonly string[];
  readonly coherenceKinds: readonly string[];
  readonly constraintKinds: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds: readonly string[];
}

export interface UniversalProtocolConstraintRecord {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceProtocolIds: readonly string[];
  readonly targetProtocolIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalProtocolConstraintEvidence {
  readonly kind: 'frontier.lang.universalProtocolConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalProtocolConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalProtocolConstraintStatus;
  readonly action: UniversalProtocolConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceProtocols: readonly UniversalProtocolRecord[];
  readonly targetProtocols: readonly UniversalProtocolRecord[];
  readonly protocolConstraints: readonly UniversalProtocolConstraintRecord[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly protocolEquivalenceClaim: false;
    readonly implementationCoherenceClaim: false;
    readonly dispatchEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalProtocolConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly protocols?: readonly UniversalProtocolRecordInput[];
  readonly sourceProtocols?: readonly UniversalProtocolRecordInput[];
  readonly targetProtocols?: readonly UniversalProtocolRecordInput[];
  readonly protocolConstraints?: readonly UniversalProtocolRecordInput[];
  readonly sourceProtocolConstraints?: readonly UniversalProtocolRecordInput[];
  readonly targetProtocolConstraints?: readonly UniversalProtocolRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalProtocolConstraintQuery {
  readonly protocolConstraintStatus?: UniversalProtocolConstraintStatus | string | readonly string[];
  readonly protocolConstraintAction?: UniversalProtocolConstraintAction | string | readonly string[];
  readonly protocolConstraintRequiredKind?: string | readonly string[];
  readonly protocolConstraintRepresentedKind?: string | readonly string[];
  readonly protocolConstraintMissingKind?: string | readonly string[];
  readonly protocolConstraintMissingEvidence?: string | readonly string[];
  readonly protocolConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalProtocolConstraintStatuses: readonly UniversalProtocolConstraintStatus[];
export declare function createUniversalProtocolConstraintEvidence(input?: UniversalProtocolConstraintInput): UniversalProtocolConstraintEvidence;
export declare function protocolConstraintMatches(evidence?: Partial<UniversalProtocolConstraintEvidence>, query?: UniversalProtocolConstraintQuery): boolean;
