import assert from 'node:assert/strict';
import { importExternalSemanticIndex } from '../dist/index.js';

export function runExternalSemanticCases() {
  for (let index = 0; index < 40; index += 1) {
    const variant = index % 3;
    const external = importExternalSemanticIndex({
      format: variant === 0 ? 'lsp' : variant === 1 ? 'scip' : 'glean',
      language: variant === 0 ? 'javascript' : variant === 1 ? 'rust' : 'typescript',
      payload: variant === 0
        ? {
          uri: `file:///repo/src/external-${index}.js`,
          languageId: 'javascript',
          documentSymbols: [{
            name: `external${index}`,
            kind: 12,
            range: { start: { line: index % 7, character: 0 }, end: { line: index % 7, character: 20 } }
          }],
          diagnostics: index % 9 === 0 ? [{ severity: 2, message: 'fuzz warning' }] : []
        }
        : variant === 1
          ? {
          metadata: { project_root: '/repo' },
          documents: [{
            relative_path: `src/external-${index}.rs`,
            language: 'rust',
            occurrences: [{
              symbol: `scip-rust cargo fuzz 1.0.0 src/external-${index}.rs/ external${index}().`,
              range: [index % 5, 4, 12],
              symbol_roles: 1
            }]
          }]
        }
          : {
          schemaId: `fuzz.${index}`,
          facts: [{
            id: index + 1000,
            predicate: 'typescript.FunctionDeclaration.1',
            key: {
              file: { key: { name: `src/external-${index}.ts` } },
              name: `external${index}`,
              range: {
                start: { line: index % 6, column: 2 },
                end: { line: index % 6, column: 12 }
              }
            }
          }]
        }
    });
    assert.equal(external.kind, 'frontier.lang.externalSemanticIndexImport');
    assert.ok(external.semanticIndex.documents.length >= 1);
    assert.ok(external.semanticIndex.symbols.length >= 1);
    assert.ok(external.summary.sourceMapMappings >= 1);
    assert.ok(['ready-with-losses', 'needs-review'].includes(external.readiness.readiness));
  }
}
