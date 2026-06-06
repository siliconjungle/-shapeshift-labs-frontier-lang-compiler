import { assert } from './helpers.mjs';
import { failedAdapterImport } from './adapter-contract.mjs';
import { estreeAdapterImport } from './js-ts-adapters.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { stubNativeProjection } from './native-projection.mjs';
import {
  classifyNativeImportRoundtripReadiness,
  importNativeSource,
  NativeImportRoundtripReadinessStatuses
} from './compiler-api.mjs';

const incompleteLightweightJsImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/incomplete.js',
  sourceText: 'export function incomplete(\n'
});
assert.equal(incompleteLightweightJsImport.kind, 'frontier.lang.importResult');
assert.equal(incompleteLightweightJsImport.semanticIndex.symbols.length, 0);
assert.equal(incompleteLightweightJsImport.losses.length > 0, true);
assert.equal(incompleteLightweightJsImport.metadata.nativeImportLossSummary.exactAst, false);
assert.equal(incompleteLightweightJsImport.metadata.nativeImportLossSummary.hasLosses, true);
assert.equal(incompleteLightweightJsImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(incompleteLightweightJsImport.evidence.some((record) => record.metadata?.nativeImportLossSummary?.semanticMergeReadiness === 'needs-review'), true);
assert.equal(incompleteLightweightJsImport.mergeCandidates[0].readiness, 'needs-review');
const unverifiedAstImport = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/unverified-ast.js',
  rootId: 'program',
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program', children: ['fn_unverified'] },
    fn_unverified: { id: 'fn_unverified', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: 'src/unverified-ast.js', startLine: 1, endLine: 1 } }
  }
});
assert.equal(unverifiedAstImport.metadata.nativeImportLossSummary.exactAst, false);
assert.equal(unverifiedAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(unverifiedAstImport.losses.some((loss) => loss.kind === 'unverifiedNativeAst'), true);
assert.equal(unverifiedAstImport.mergeCandidates[0].readiness, 'needs-review');
const verifiedAstImport = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/verified-ast.js',
  rootId: 'program',
  exactAst: true,
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program', children: ['fn_verified'] },
    fn_verified: { id: 'fn_verified', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: 'src/verified-ast.js', startLine: 1, endLine: 1 } }
  }
});
assert.equal(verifiedAstImport.metadata.nativeImportLossSummary.exactAst, true);
assert.equal(verifiedAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(verifiedAstImport.losses.length, 0);
for (const status of ['exact', 'preserved-source', 'stub-only', 'blocked', 'needs-review']) {
  assert.equal(NativeImportRoundtripReadinessStatuses.includes(status), true);
}
const exactRoundtrip = classifyNativeImportRoundtripReadiness(estreeAdapterImport);
assert.equal(exactRoundtrip.kind, 'frontier.lang.nativeImportRoundtripReadiness');
assert.equal(exactRoundtrip.status, 'exact');
assert.equal(exactRoundtrip.semanticMergeReadiness, 'ready');
assert.equal(exactRoundtrip.projectionMode, 'preserved-source');
assert.equal(exactRoundtrip.checks.nativeImport.exactAst, true);
assert.equal(exactRoundtrip.checks.universalAst.valid, true);
assert.equal(exactRoundtrip.checks.universalAst.sourceMapMappings >= 1, true);
assert.equal(exactRoundtrip.checks.projectedSource.sourceHashVerified, true);
const preservedRoundtrip = classifyNativeImportRoundtripReadiness(scannedJsImport);
assert.equal(preservedRoundtrip.status, 'preserved-source');
assert.equal(preservedRoundtrip.semanticMergeReadiness, 'needs-review');
assert.equal(preservedRoundtrip.projectionMode, 'preserved-source');
assert.equal(preservedRoundtrip.checks.projectedSource.sourceHashVerified, true);
assert.equal(preservedRoundtrip.reasons.some((reason) => reason.includes('preserved')), true);
const stubRoundtrip = classifyNativeImportRoundtripReadiness(scannedJsImport, { projection: stubNativeProjection });
assert.equal(stubRoundtrip.status, 'stub-only');
assert.equal(stubRoundtrip.projectionMode, 'native-source-stubs');
assert.equal(stubRoundtrip.checks.projectedSource.readiness, 'needs-review');
const blockedRoundtrip = classifyNativeImportRoundtripReadiness(failedAdapterImport);
assert.equal(blockedRoundtrip.status, 'blocked');
assert.equal(blockedRoundtrip.semanticMergeReadiness, 'blocked');
assert.equal(blockedRoundtrip.evidence.failedEvidenceIds.length >= 1, true);
const incompleteRoundtrip = classifyNativeImportRoundtripReadiness(incompleteLightweightJsImport);
assert.equal(incompleteRoundtrip.status, 'needs-review');
assert.equal(incompleteRoundtrip.checks.universalAst.semanticSymbols, 0);
assert.equal(incompleteRoundtrip.reasons.some((reason) => reason.includes('semantic index')), true);
assert.throws(() => importNativeSource({
  language: 'javascript',
  sourcePath: 'bad-map.js',
  sourceText: 'export function badMap() {}\n',
  mappings: [{ id: 'map_without_reference', precision: 'unknown' }]
}), /Source-map mapping 1 must reference/);
