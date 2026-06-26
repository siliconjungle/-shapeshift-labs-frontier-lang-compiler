export interface JsTsProjectCommonJsRuntimeInteropProof {
  readonly id?: string;
  readonly kind?: 'frontier.lang.commonJsRuntimeInteropProof' | string;
  readonly schema?: 'frontier.lang.commonJsRuntimeInteropProof.v1' | string;
  readonly status: 'passed' | 'failed' | string;
  readonly proofLevel?: 'commonjs-runtime-interop' | string;
  readonly sourcePath: string;
  readonly sourceHash: string;
  readonly identityKey?: string;
  readonly moduleSpecifier: string;
  readonly importedName?: string;
  readonly localName?: string;
  readonly importKind?: string;
  readonly commonJs?: boolean;
  readonly interopHelper?: string;
  readonly packageRuntimeCondition?: string;
  readonly packageRuntimeConditionEdgeKind?: string;
  readonly outputTargetSymbolId: string;
  readonly workerTargetSymbolId?: string;
  readonly exportAssignmentShapeHash?: string;
  readonly runtimeTraceHash?: string;
  readonly helperTraceHash?: string;
  readonly evidenceHash: string;
  readonly proofHash?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly runtimeInteropEquivalenceClaim: false;
}
