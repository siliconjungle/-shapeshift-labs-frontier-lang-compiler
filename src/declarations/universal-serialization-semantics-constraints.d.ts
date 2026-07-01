import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalSerializationSemanticsConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalSerializationSemanticsConstraintAction = 'skip' | 'attach-serialization-semantics-record' | 'review-serialization-semantics-loss' | 'collect-serialization-semantics-evidence' | 'reject';

export interface UniversalSerializationSemanticsRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly name?: string; readonly symbolName?: string; readonly typeName?: string; readonly schemaName?: string; readonly symbolId?: string;
  readonly format?: string; readonly wireFormat?: string; readonly serializationFormat?: string; readonly kind?: string; readonly codec?: string; readonly runtimeCodec?: string; readonly schema?: string; readonly schemaId?: string;
  readonly fieldNaming?: string; readonly naming?: string; readonly fieldOrder?: string; readonly order?: string; readonly omittedFields?: string; readonly omissionPolicy?: string;
  readonly defaultValues?: string; readonly defaultValueSemantics?: string; readonly nullSemantics?: string; readonly nullability?: string; readonly unknownFields?: string; readonly unknownFieldPolicy?: string;
  readonly enumEncoding?: string; readonly tagEncoding?: string; readonly endianness?: string; readonly alignment?: string; readonly varint?: string; readonly varintEncoding?: string;
  readonly schemaVersion?: string; readonly version?: string; readonly compatibility?: string; readonly canonicalization?: string; readonly deterministic?: string | boolean;
  readonly precision?: string; readonly precisionLoss?: string; readonly roundtrip?: string; readonly roundtripStability?: string; readonly validation?: string; readonly escaping?: string; readonly securityEscaping?: string;
  readonly streaming?: string; readonly framing?: string; readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[];
  readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[]; readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export interface UniversalSerializationSemanticsRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly format?: string; readonly codec?: string; readonly schema?: string;
  readonly fieldNaming?: string; readonly fieldOrder?: string; readonly omittedFields?: string; readonly defaultValues?: string; readonly nullSemantics?: string; readonly unknownFields?: string;
  readonly enumEncoding?: string; readonly endianness?: string; readonly alignment?: string; readonly varint?: string; readonly schemaVersion?: string; readonly compatibility?: string;
  readonly canonicalization?: string; readonly deterministic?: string | boolean; readonly precision?: string; readonly roundtrip?: string; readonly validation?: string; readonly escaping?: string;
  readonly streaming?: string; readonly framing?: string; readonly constraintKinds: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalSerializationSemanticsConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceSerializationSemanticsIds: readonly string[]; readonly targetSerializationSemanticsIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalSerializationSemanticsConstraintEvidence {
  readonly kind: 'frontier.lang.universalSerializationSemanticsConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalSerializationSemanticsConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalSerializationSemanticsConstraintStatus; readonly action: UniversalSerializationSemanticsConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalSerializationSemanticsRecord[]; readonly targetRecords: readonly UniversalSerializationSemanticsRecord[];
  readonly serializationSemanticsConstraints: readonly UniversalSerializationSemanticsConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly serializationEquivalenceClaim: false; readonly wireEquivalenceClaim: false; readonly roundtripEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalSerializationSemanticsConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string; readonly imports?: readonly Record<string, unknown>[];
  readonly serializationRecords?: readonly UniversalSerializationSemanticsRecordInput[]; readonly wireFormatRecords?: readonly UniversalSerializationSemanticsRecordInput[]; readonly codecRecords?: readonly UniversalSerializationSemanticsRecordInput[];
  readonly schemaRecords?: readonly UniversalSerializationSemanticsRecordInput[]; readonly serializationSemanticsRecords?: readonly UniversalSerializationSemanticsRecordInput[];
  readonly sourceSerializationSemanticsRecords?: readonly UniversalSerializationSemanticsRecordInput[]; readonly targetSerializationSemanticsRecords?: readonly UniversalSerializationSemanticsRecordInput[];
  readonly serializationSemanticsConstraints?: readonly UniversalSerializationSemanticsRecordInput[]; readonly sourceSerializationSemanticsConstraints?: readonly UniversalSerializationSemanticsRecordInput[];
  readonly targetSerializationSemanticsConstraints?: readonly UniversalSerializationSemanticsRecordInput[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalSerializationSemanticsConstraintQuery {
  readonly serializationSemanticsConstraintStatus?: UniversalSerializationSemanticsConstraintStatus | string | readonly string[];
  readonly serializationSemanticsConstraintAction?: UniversalSerializationSemanticsConstraintAction | string | readonly string[];
  readonly serializationSemanticsConstraintRequiredKind?: string | readonly string[];
  readonly serializationSemanticsConstraintRepresentedKind?: string | readonly string[];
  readonly serializationSemanticsConstraintMissingKind?: string | readonly string[];
  readonly serializationSemanticsConstraintMissingEvidence?: string | readonly string[];
  readonly serializationSemanticsConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalSerializationSemanticsConstraintStatuses: readonly UniversalSerializationSemanticsConstraintStatus[];
export declare function createUniversalSerializationSemanticsConstraintEvidence(input?: UniversalSerializationSemanticsConstraintInput): UniversalSerializationSemanticsConstraintEvidence;
export declare function serializationSemanticsConstraintMatches(evidence?: Partial<UniversalSerializationSemanticsConstraintEvidence>, query?: UniversalSerializationSemanticsConstraintQuery): boolean;
