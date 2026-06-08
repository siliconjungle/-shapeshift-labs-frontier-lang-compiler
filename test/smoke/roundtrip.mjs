import { assert } from './helpers.mjs';
import { failedAdapterImport } from './adapter-contract.mjs';
import { estreeAdapterImport } from './js-ts-adapters.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { stubNativeProjection } from './native-projection.mjs';
import {
  classifyNativeImportRoundtripReadiness,
  compileNativeSource,
  createNativeRoundtripEvidence,
  importNativeSource,
  NativeImportRoundtripReadinessStatuses,
  projectNativeImportToSource
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
const exactMapImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/roundtrip-exact-map.js',
  sourceText: 'export function roundtripExactMap() { return true; }\n'
});
const exactMapCompile = compileNativeSource(exactMapImport, {
  sourceMapId: 'roundtrip-exact-output-map',
  targetPath: 'dist/roundtrip-exact-map.js'
});
const exactMapAudit = exactMapCompile.metadata.roundtripEvidence.audit;
assert.equal(exactMapAudit.disposition, 'reversible');
assert.equal(exactMapAudit.paths.reversible.selected, true);
assert.equal(exactMapAudit.paths.reversible.available, true);
assert.equal(exactMapAudit.paths.preservedSource.available, true);
assert.equal(exactMapAudit.paths.stubOnly.selected, false);
assert.equal(exactMapAudit.sourceMaps.outputExact, true);
assert.equal(exactMapAudit.sourceMaps.output.precision, 'exact');
assert.equal(exactMapAudit.hashChecks.sourceHashVerified, true);
assert.equal(exactMapAudit.hashChecks.outputMatchesSourceHash, true);
assert.equal(exactMapAudit.semanticEquivalenceClaim, false);
assert.equal(exactMapAudit.semanticEquivalence.claimed, false);
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
const scannedPreservedProjection = projectNativeImportToSource(scannedJsImport);
const preservedAudit = scannedPreservedProjection.metadata.roundtripEvidence.audit;
assert.equal(preservedAudit.paths.preservedSource.available, true);
assert.equal(preservedAudit.sourcePreservation.exactSourceAvailable, true);
assert.equal(preservedAudit.commentsTrivia.comments >= 1, true);
const stubAudit = createNativeRoundtripEvidence(scannedJsImport, { projection: stubNativeProjection }).metadata.roundtripEvidence.audit;
assert.equal(stubAudit.disposition, 'stub-only');
assert.equal(stubAudit.paths.stubOnly.selected, true);
assert.equal(stubAudit.generatedStubs.available, true);
assert.equal(stubAudit.generatedStubs.declarationCount >= 1, true);
assert.equal(stubAudit.generatedStubs.emittedDeclarationCount >= 1, true);
assert.equal(stubAudit.semanticEquivalence.claimed, false);
const blockedRoundtrip = classifyNativeImportRoundtripReadiness(failedAdapterImport);
assert.equal(blockedRoundtrip.status, 'blocked');
assert.equal(blockedRoundtrip.semanticMergeReadiness, 'blocked');
assert.equal(blockedRoundtrip.evidence.failedEvidenceIds.length >= 1, true);
const incompleteRoundtrip = classifyNativeImportRoundtripReadiness(incompleteLightweightJsImport);
assert.equal(incompleteRoundtrip.status, 'needs-review');
assert.equal(incompleteRoundtrip.checks.universalAst.semanticSymbols, 0);
assert.equal(incompleteRoundtrip.reasons.some((reason) => reason.includes('semantic index')), true);
const estimatedMapAdapter = {
  id: 'roundtrip-estimated-map-adapter',
  sourceLanguage: 'javascript',
  target: 'rust',
  coverage: {
    readiness: 'needs-review',
    handledLossKinds: ['declarationOnlyCoverage', 'partialSemanticIndex', 'sourceMapApproximation', 'sourcePreservation']
  },
  project() {
    return {
      output: 'pub fn roundtrip_estimated_map_adapter() {}\n',
      readiness: 'needs-review'
    };
  }
};
const estimatedMapCompile = compileNativeSource(incompleteLightweightJsImport, {
  target: 'rust',
  targetAdapters: [estimatedMapAdapter],
  targetAdapter: 'roundtrip-estimated-map-adapter',
  sourceMapId: 'roundtrip-estimated-output-map',
  targetPath: 'dist/roundtrip-estimated.rs',
  emitOnBlocked: true
});
const estimatedMapAudit = estimatedMapCompile.metadata.roundtripEvidence.audit;
assert.equal(estimatedMapCompile.outputMode, 'target-adapter');
assert.equal(estimatedMapAudit.disposition, 'adapter-projected');
assert.equal(estimatedMapAudit.paths.adapterProjected.selected, true);
assert.equal(estimatedMapAudit.adapterProjection.adapterId, 'roundtrip-estimated-map-adapter');
assert.equal(estimatedMapAudit.targetCoverage.lossClass, 'targetAdapterProjection');
assert.equal(estimatedMapAudit.sourceMaps.outputEstimated, true);
assert.equal(estimatedMapAudit.sourceMaps.output.precision, 'estimated');
assert.equal(estimatedMapAudit.sourceMaps.output.byOrigin['file-fallback'], 1);
assert.equal(estimatedMapAudit.hashChecks.targetOutputHashPresent, true);
assert.equal(estimatedMapAudit.hashChecks.outputMatchesSourceHash, false);
assert.equal(estimatedMapAudit.semanticEquivalenceClaim, false);
assert.equal(estimatedMapAudit.semanticEquivalence.claimed, false);
assert.throws(() => importNativeSource({
  language: 'javascript',
  sourcePath: 'bad-map.js',
  sourceText: 'export function badMap() {}\n',
  mappings: [{ id: 'map_without_reference', precision: 'unknown' }]
}), /Source-map mapping 1 must reference/);
