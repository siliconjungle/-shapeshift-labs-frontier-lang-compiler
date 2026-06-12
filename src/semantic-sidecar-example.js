import { createSemanticImportSidecar } from './internal/index-impl/createSemanticImportSidecar.js';

const compactExampleSource = Object.freeze({
  schema: 'frontier.lang.semanticImportSidecar.example.compact.v1',
  baseSource: {
    path: 'src/compact-sidecar.ts',
    hash: 'sha256:base-compact-sidecar-v1',
    identityHash: 'sha256:identity-compact-sidecar-example-v1',
    text: 'export function compactSidecarExample(value: number) {\n  return value + 1;\n}\n'
  },
  headSource: {
    path: 'src/compact-sidecar.ts',
    hash: 'sha256:head-compact-sidecar-v2',
    identityHash: 'sha256:identity-compact-sidecar-example-v1',
    text: 'export function compactSidecarExample(value: number) {\n  return value + 2;\n}\n'
  },
  identityHashes: {
    source: 'sha256:identity-compact-sidecar-example-v1',
    symbol: 'sha256:symbol-compact-sidecar-example-v1',
    signature: 'sha256:signature-compact-sidecar-example-v1'
  }
});

const compactExampleImport = Object.freeze({
  id: 'compact_sidecar_example_import',
  language: 'typescript',
  sourcePath: compactExampleSource.headSource.path,
  sourceHash: compactExampleSource.headSource.hash,
  semanticIndex: {
    id: 'semantic_index_compact_sidecar_example',
    symbols: [{
      id: 'symbol:compactSidecarExample',
      name: 'compactSidecarExample',
      kind: 'function',
      language: 'typescript',
      definitionSpan: {
        path: compactExampleSource.headSource.path,
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2
      },
      signatureHash: compactExampleSource.identityHashes.signature,
      metadata: { ownershipRegionKind: 'body' }
    }],
    relations: [],
    facts: []
  },
  evidence: [{
    id: 'evidence_compact_sidecar_example',
    kind: 'semantic-sidecar-example',
    status: 'passed'
  }]
});

export const compactSemanticSidecarExample = Object.freeze({
  ...compactExampleSource,
  sidecar: createSemanticImportSidecar(compactExampleImport, {
    id: 'semantic_import_compact_sidecar_example',
    generatedAt: 132,
    targetPath: 'dist/compact-sidecar.js',
    metadata: {
      baseSource: compactExampleSource.baseSource,
      headSource: compactExampleSource.headSource,
      identityHashes: compactExampleSource.identityHashes
    }
  })
});
