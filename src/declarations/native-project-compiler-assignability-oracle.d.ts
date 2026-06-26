export interface NativeProjectSymbolGraphCompilerAssignabilityOracleDirectionRecord {
  readonly direction: 'declared-to-apparent' | 'apparent-to-declared' | string;
  readonly fromTypeText?: string;
  readonly toTypeText?: string;
  readonly assignable?: boolean;
}

export interface NativeProjectSymbolGraphCompilerAssignabilityOracleRecord {
  readonly kind: 'typescript-checker-public-api-declared-apparent-assignability-oracle' | string;
  readonly scope: 'public-type-alias-declared-apparent' | string;
  readonly oracle: 'TypeChecker.isTypeAssignableTo' | string;
  readonly declarationKind?: 'type-alias' | string;
  readonly declarationCount?: number;
  readonly typeNodeText?: string;
  readonly declaredTypeText?: string;
  readonly apparentTypeText?: string;
  readonly directions?: readonly NativeProjectSymbolGraphCompilerAssignabilityOracleDirectionRecord[];
  readonly directionCount?: number;
  readonly equivalentByBidirectionalAssignability?: boolean;
  readonly ambiguous?: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerTypeEquivalenceProof {
    readonly assignabilityOracleHash?: string;
    readonly assignabilityOracleScope?: 'declared-apparent-type-only' | string;
    readonly assignabilityOracleCount?: number;
    readonly assignabilityOracleDirectionCount?: number;
  }

  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly assignabilityOracleCount?: number;
    readonly assignabilityOracleDirectionCount?: number;
    readonly assignabilityOracleHash?: string;
    readonly assignabilityOracle?: NativeProjectSymbolGraphCompilerAssignabilityOracleRecord;
    readonly typeEquivalenceAssignabilityOracleHash?: string;
  }
}
