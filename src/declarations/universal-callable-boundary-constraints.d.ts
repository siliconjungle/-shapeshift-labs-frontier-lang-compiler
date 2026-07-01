import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalCallableBoundaryConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalCallableBoundaryConstraintAction = 'skip' | 'attach-callable-boundary-record' | 'review-callable-boundary-loss' | 'collect-callable-boundary-evidence' | 'reject';

export interface UniversalCallableBoundaryRecordInput {
  readonly id?: string; readonly kind?: string; readonly role?: 'source' | 'target' | string; readonly name?: string; readonly symbolName?: string; readonly functionName?: string; readonly methodName?: string; readonly callableName?: string; readonly symbolId?: string;
  readonly callableKind?: string; readonly typeKind?: string; readonly signatureHash?: string; readonly contractHash?: string; readonly callSignatureHash?: string; readonly arity?: number | string; readonly parameterCount?: number | string;
  readonly requiredParameters?: number | string; readonly requiredParameterCount?: number | string; readonly optionalParameters?: number | string; readonly optionalParameterCount?: number | string;
  readonly parameterOrder?: unknown; readonly orderedParameters?: unknown; readonly defaultParameters?: unknown; readonly defaults?: unknown; readonly restParameter?: unknown; readonly rest?: unknown; readonly variadic?: boolean;
  readonly namedArguments?: unknown; readonly keywordArguments?: unknown; readonly receiverKind?: string; readonly receiver?: string; readonly thisBinding?: string; readonly selfBinding?: string;
  readonly returnKind?: string; readonly returnType?: string; readonly asyncKind?: string; readonly asyncMode?: string; readonly generatorKind?: string; readonly yieldKind?: string;
  readonly callbackKind?: string; readonly closureCapture?: string; readonly captureKind?: string; readonly overloadSet?: unknown; readonly overloads?: unknown; readonly dispatchKind?: string; readonly dispatchMode?: string;
  readonly constructorKind?: string; readonly callingConvention?: string; readonly abiKind?: string; readonly ffiBoundary?: unknown; readonly foreignFunction?: unknown; readonly exceptionModel?: string; readonly effectKind?: string; readonly effects?: unknown;
  readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export type UniversalCallableBoundaryRecordInputValue = UniversalCallableBoundaryRecordInput | string | number | boolean;

export interface UniversalCallableBoundaryRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly callableKind?: string; readonly signatureHash?: string;
  readonly arity?: number | string; readonly requiredParameters?: number | string; readonly optionalParameters?: number | string; readonly parameterOrder?: unknown; readonly defaultParameters?: unknown;
  readonly restParameter?: unknown; readonly variadic?: boolean; readonly namedArguments?: unknown; readonly receiverKind?: string; readonly thisBinding?: string; readonly selfBinding?: string;
  readonly returnKind?: string; readonly asyncKind?: string; readonly generatorKind?: string; readonly callbackKind?: string; readonly closureCapture?: string; readonly overloadSet?: unknown;
  readonly dispatchKind?: string; readonly constructorKind?: string; readonly callingConvention?: string; readonly ffiBoundary?: unknown; readonly exceptionModel?: string; readonly effectKind?: string | unknown;
  readonly constraintKinds: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalCallableBoundaryConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceCallableBoundaryIds: readonly string[]; readonly targetCallableBoundaryIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalCallableBoundaryConstraintEvidence {
  readonly kind: 'frontier.lang.universalCallableBoundaryConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalCallableBoundaryConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalCallableBoundaryConstraintStatus; readonly action: UniversalCallableBoundaryConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalCallableBoundaryRecord[]; readonly targetRecords: readonly UniversalCallableBoundaryRecord[];
  readonly callableBoundaryConstraints: readonly UniversalCallableBoundaryConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly callableEquivalenceClaim: false; readonly signatureEquivalenceClaim: false; readonly dispatchEquivalenceClaim: false; readonly abiEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalCallableBoundaryConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string; readonly imports?: readonly Record<string, unknown>[];
  readonly callableRecords?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly callSignatureRecords?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly functionSignatureRecords?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly methodSignatureRecords?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly callbackRecords?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly closureRecords?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly callsiteRecords?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly ffiRecords?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly callableBoundaryRecords?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly sourceCallableBoundaryRecords?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly targetCallableBoundaryRecords?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly callableBoundaryConstraints?: readonly UniversalCallableBoundaryRecordInputValue[]; readonly sourceCallableBoundaryConstraints?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly targetCallableBoundaryConstraints?: readonly UniversalCallableBoundaryRecordInputValue[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalCallableBoundaryConstraintQuery {
  readonly callableBoundaryConstraintStatus?: UniversalCallableBoundaryConstraintStatus | string | readonly string[];
  readonly callableBoundaryConstraintAction?: UniversalCallableBoundaryConstraintAction | string | readonly string[];
  readonly callableBoundaryConstraintRequiredKind?: string | readonly string[];
  readonly callableBoundaryConstraintRepresentedKind?: string | readonly string[];
  readonly callableBoundaryConstraintMissingKind?: string | readonly string[];
  readonly callableBoundaryConstraintMissingEvidence?: string | readonly string[];
  readonly callableBoundaryConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalCallableBoundaryConstraintStatuses: readonly UniversalCallableBoundaryConstraintStatus[];
export declare function createUniversalCallableBoundaryConstraintEvidence(input?: UniversalCallableBoundaryConstraintInput): UniversalCallableBoundaryConstraintEvidence;
export declare function callableBoundaryConstraintMatches(evidence?: Partial<UniversalCallableBoundaryConstraintEvidence>, query?: UniversalCallableBoundaryConstraintQuery): boolean;
