import type { SemanticImportSidecar } from './semantic-sidecar.js';

export interface SemanticImportSidecarSourceRevisionExample {
  readonly path: string;
  readonly hash: string;
  readonly identityHash: string;
  readonly text?: string;
}

export interface SemanticImportSidecarCompactExample {
  readonly schema: 'frontier.lang.semanticImportSidecar.example.compact.v1';
  readonly baseSource: SemanticImportSidecarSourceRevisionExample;
  readonly headSource: SemanticImportSidecarSourceRevisionExample;
  readonly identityHashes: Readonly<Record<string, string>>;
  readonly sidecar: SemanticImportSidecar;
}

export declare const compactSemanticSidecarExample: SemanticImportSidecarCompactExample;
