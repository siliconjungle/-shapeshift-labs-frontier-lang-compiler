import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  compileNativeSource,
  createProjectionTargetLossMatrix,
  createNativeRoundtripEvidence,
  importNativeSource,
  projectNativeImportToSource,
  runNativeTargetProjectionAdapter
} from './compiler-api.mjs';

const preservedNativeSource = 'export function preservedNative() { return true; }\n';
const preservedNativeImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/preserved-native.js',
  sourceText: preservedNativeSource
});
const staleHashImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/stale-hash.js',
  sourceText: preservedNativeSource,
  sourceHash: 'fnv1a32:stale_declared_import_hash'
});
assert.equal(staleHashImport.nativeSource.sourceHash, preservedNativeImport.nativeSource.sourceHash);
assert.equal(staleHashImport.metadata.declaredSourceHash, 'fnv1a32:stale_declared_import_hash');
assert.equal(staleHashImport.metadata.sourceHashVerified, false);
const preservedNativeProjection = projectNativeImportToSource(preservedNativeImport, {
  sourceText: preservedNativeSource
});
assert.equal(preservedNativeProjection.kind, 'frontier.lang.nativeSourceProjection');
assert.equal(preservedNativeProjection.mode, 'preserved-source');
assert.equal(preservedNativeProjection.sourceText, preservedNativeSource);
assert.equal(preservedNativeProjection.lossSummary.highestSeverity, 'none');
assert.equal(preservedNativeProjection.readiness.readiness, 'ready');
assert.equal(preservedNativeProjection.metadata.sourceHashVerified, true);
assert.equal(preservedNativeProjection.metadata.nativeImportLossSummary.highestSeverity, 'warning');
assert.equal(preservedNativeProjection.metadata.roundtripEvidence.status, 'preserved-source');
assert.equal(preservedNativeProjection.metadata.roundtripEvidence.projection.sourceHashVerified, true);
assert.equal(preservedNativeProjection.evidence.some((entry) => entry.metadata?.schema === 'frontier.lang.nativeRoundtripEvidence'), true);
const autoPreservedScannedProjection = projectNativeImportToSource(scannedJsImport);
assert.equal(autoPreservedScannedProjection.mode, 'preserved-source');
assert.equal(autoPreservedScannedProjection.sourceText, scannedJsImport.metadata.sourcePreservation.sourceText);
assert.equal(autoPreservedScannedProjection.metadata.sourcePreservationId, scannedJsImport.metadata.sourcePreservation.id);
export const stubNativeProjection = projectNativeImportToSource(scannedJsImport, { preferPreservedSource: false });
assert.equal(stubNativeProjection.mode, 'native-source-stubs');
assert.match(stubNativeProjection.sourceText, /export function addTodo/);
assert.match(stubNativeProjection.sourceText, /export class TodoStore/);
assert.equal(stubNativeProjection.lossSummary.highestSeverity, 'warning');
assert.equal(stubNativeProjection.losses.some((loss) => loss.kind === 'targetProjectionLoss'), true);
assert.equal(stubNativeProjection.lossSummary.categories.includes('targetProjectionLoss'), true);
assert.equal(stubNativeProjection.readiness.readiness, 'needs-review');
const directStubRoundtripEvidence = createNativeRoundtripEvidence(scannedJsImport, { projection: stubNativeProjection });
assert.equal(directStubRoundtripEvidence.metadata.roundtripEvidence.status, 'stub-only');
assert.equal(directStubRoundtripEvidence.metadata.roundtripEvidence.projection.lossCount >= 1, true);
const sameLanguageNativeCompile = compileNativeSource(preservedNativeImport, {
  sourceMapId: 'smoke-preserved-compile-map',
  targetPath: 'dist/preserved-native.js'
});
assert.equal(sameLanguageNativeCompile.kind, 'frontier.lang.nativeSourceCompileResult');
assert.equal(sameLanguageNativeCompile.target, 'javascript');
assert.equal(sameLanguageNativeCompile.language, 'javascript');
assert.equal(sameLanguageNativeCompile.ok, true);
assert.equal(sameLanguageNativeCompile.outputMode, 'preserved-source');
assert.equal(sameLanguageNativeCompile.output, preservedNativeSource);
assert.equal(sameLanguageNativeCompile.projection.mode, 'preserved-source');
assert.equal(sameLanguageNativeCompile.targetCoverage.supported, true);
assert.equal(sameLanguageNativeCompile.projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 1, true);
assert.equal(sameLanguageNativeCompile.projectionMatrix.summary.languages >= 1, true);
assert.equal(sameLanguageNativeCompile.readiness.readiness, 'needs-review');
assert.equal(sameLanguageNativeCompile.lossSummary.categories.includes('declarationsOnly'), true);
assert.equal(sameLanguageNativeCompile.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(sameLanguageNativeCompile.sourceMap.id, 'smoke-preserved-compile-map');
assert.equal(sameLanguageNativeCompile.sourceMap.targetPath, 'dist/preserved-native.js');
assert.equal(sameLanguageNativeCompile.sourceMap.targetHash, sameLanguageNativeCompile.outputHash);
assert.equal(sameLanguageNativeCompile.sourceMaps.length, 1);
assert.equal(sameLanguageNativeCompile.sourceMap.mappings.length >= 1, true);
assert.equal(sameLanguageNativeCompile.sourceMap.mappings.some((mapping) => mapping.precision === 'exact'), true);
assert.equal(sameLanguageNativeCompile.sourceMap.mappings.some((mapping) => mapping.generatedSpan?.targetPath === 'dist/preserved-native.js'), true);
assert.equal(sameLanguageNativeCompile.metadata.sourceMapIds.includes('smoke-preserved-compile-map'), true);
assert.equal(sameLanguageNativeCompile.metadata.roundtripEvidence.status, 'preserved-source');
assert.equal(sameLanguageNativeCompile.metadata.roundtripEvidence.output.sourceMaps.precision, 'exact');
assert.equal(sameLanguageNativeCompile.metadata.roundtripEvidence.output.sourceMaps.byPrecision.exact >= 1, true);
assert.equal(roundtripEvidenceRecord(sameLanguageNativeCompile).status, 'passed');
const nativeCompileWithoutSourceMap = compileNativeSource(preservedNativeImport, { emitSourceMap: false });
assert.equal(nativeCompileWithoutSourceMap.sourceMaps.length, 0);
assert.equal(nativeCompileWithoutSourceMap.sourceMap, undefined);
const sameLanguageNativeCompileWithLosses = compileNativeSource(preservedNativeImport, { emitOnBlocked: true });
assert.equal(sameLanguageNativeCompileWithLosses.ok, true);
const rustNativeCompileBlocked = compileNativeSource(scannedJsImport, { target: 'rust' });
assert.equal(rustNativeCompileBlocked.target, 'rust');
assert.equal(rustNativeCompileBlocked.language, 'javascript');
assert.equal(rustNativeCompileBlocked.ok, false);
assert.equal(rustNativeCompileBlocked.outputMode, 'target-stubs');
assert.equal(rustNativeCompileBlocked.projection.mode, 'native-source-stubs');
assert.match(rustNativeCompileBlocked.output, /pub fn addTodo/);
assert.match(rustNativeCompileBlocked.output, /pub struct TodoStore/);
assert.equal(rustNativeCompileBlocked.targetCoverage.lossClass, 'missingAdapter');
assert.equal(rustNativeCompileBlocked.losses.some((loss) => loss.severity === 'error' && loss.kind === 'targetProjectionLoss'), true);
assert.equal(rustNativeCompileBlocked.readiness.readiness, 'blocked');
assert.equal(rustNativeCompileBlocked.metadata.roundtripEvidence.status, 'blocked');
assert.equal(rustNativeCompileBlocked.metadata.roundtripEvidence.output.mode, 'target-stubs');
assert.equal(rustNativeCompileBlocked.metadata.roundtripEvidence.output.targetCoverageLossClass, 'missingAdapter');
assert.equal(roundtripEvidenceRecord(rustNativeCompileBlocked).status, 'failed');
const rustNativeCompileEmitted = compileNativeSource(scannedJsImport, { target: 'rust', emitOnBlocked: true });
assert.equal(rustNativeCompileEmitted.ok, true);
assert.equal(rustNativeCompileEmitted.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(rustNativeCompileEmitted.sourceMap.targetPath, 'src/scanned.rs');
assert.equal(rustNativeCompileEmitted.sourceMap.mappings.some((mapping) => mapping.semanticSymbolId?.includes('addtodo') && mapping.precision === 'declaration'), true);
assert.equal(rustNativeCompileEmitted.sourceMap.mappings.some((mapping) => mapping.generatedSpan?.targetPath === 'src/scanned.rs'), true);
const handledProjectionLossKinds = [
  'macroExpansion',
  'macroHygiene',
  'preprocessor',
  'conditionalCompilation',
  'metaprogramming',
  'reflection',
  'dynamicRuntime',
  'dynamicDispatch',
  'generatedCode',
  'overloadResolution',
  'typeInference',
  'unsupportedSyntax',
  'unsupportedSemantic'
];
const jsToRustTargetAdapter = {
  id: 'fixture-js-to-rust-target-adapter',
  sourceLanguage: 'javascript',
  target: 'rust',
  version: '1.0.0',
  capabilities: ['declaration-stubs'],
  coverage: {
    readiness: 'ready',
    handledLossKinds: handledProjectionLossKinds,
    notes: ['Fixture adapter emits deterministic Rust declaration stubs for smoke tests.']
  },
  project(input) {
    assert.equal(input.sourceLanguage, 'javascript');
    assert.equal(input.target, 'rust');
    assert.equal(input.targetCoverage.lossClass, 'targetAdapterProjection');
    return {
      output: 'pub fn add_todo_from_adapter() {}\n',
      readiness: 'ready',
      evidence: [{
        id: 'evidence_fixture_js_to_rust_projected',
        kind: 'projection',
        status: 'passed',
        summary: 'Fixture JS-to-Rust target projection adapter emitted deterministic output.'
      }],
      metadata: { fixture: true }
    };
  }
};
const targetAdapterProjection = runNativeTargetProjectionAdapter(jsToRustTargetAdapter, {
  importResult: scannedJsImport,
  sourceProjection: stubNativeProjection,
  sourceLanguage: 'javascript',
  target: 'rust',
  targetCoverage: {
    target: 'rust',
    lossClass: 'targetAdapterProjection',
    supported: true,
    readiness: 'ready',
    lossKinds: [],
    categories: [],
    reason: 'fixture',
    notes: []
  },
  options: {},
  metadata: {}
});
assert.equal(targetAdapterProjection.kind, 'frontier.lang.nativeTargetProjection');
assert.equal(targetAdapterProjection.outputMode, 'target-adapter');
assert.match(targetAdapterProjection.output, /add_todo_from_adapter/);
assert.equal(targetAdapterProjection.evidence.some((entry) => entry.id === 'evidence_fixture_js_to_rust_projected'), true);
const rustNativeCompileWithAdapter = compileNativeSource(scannedJsImport, {
  target: 'rust',
  targetAdapters: [jsToRustTargetAdapter]
});
assert.equal(rustNativeCompileWithAdapter.ok, true);
assert.equal(rustNativeCompileWithAdapter.outputMode, 'target-adapter');
assert.equal(rustNativeCompileWithAdapter.output, 'pub fn add_todo_from_adapter() {}\n');
assert.equal(rustNativeCompileWithAdapter.targetProjection.adapter.id, 'fixture-js-to-rust-target-adapter');
assert.equal(rustNativeCompileWithAdapter.targetCoverage.lossClass, 'targetAdapterProjection');
assert.equal(rustNativeCompileWithAdapter.targetCoverage.adapterKind, 'targetProjection');
assert.equal(rustNativeCompileWithAdapter.projectionMatrix.summary.targetAdapterProjection >= 1, true);
assert.equal(rustNativeCompileWithAdapter.losses.some((loss) => loss.id.includes('missing_projection_adapter')), false);
assert.equal(rustNativeCompileWithAdapter.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(rustNativeCompileWithAdapter.sourceMap.mappings.some((mapping) => mapping.metadata?.sourceMapOrigin === 'target-adapter-fallback'), true);
assert.equal(rustNativeCompileWithAdapter.sourceMap.targetHash, rustNativeCompileWithAdapter.outputHash);
assert.equal(rustNativeCompileWithAdapter.metadata.roundtripEvidence.status, 'target-adapter');
assert.equal(rustNativeCompileWithAdapter.metadata.roundtripEvidence.output.mode, 'target-adapter');
assert.equal(rustNativeCompileWithAdapter.metadata.roundtripEvidence.output.targetProjectionAdapterId, 'fixture-js-to-rust-target-adapter');
assert.equal(rustNativeCompileWithAdapter.metadata.roundtripEvidence.output.sourceMaps.byOrigin['target-adapter-fallback'] >= 1, true);
const adapterProjectionMatrix = createProjectionTargetLossMatrix({
  imports: [scannedJsImport],
  targets: ['rust'],
  targetAdapters: [jsToRustTargetAdapter]
});
const jsToRustCoverage = adapterProjectionMatrix.languages.find((entry) => entry.language === 'javascript').targets.find((entry) => entry.target === 'rust');
assert.equal(jsToRustCoverage.lossClass, 'targetAdapterProjection');
assert.equal(jsToRustCoverage.supported, true);
assert.equal(jsToRustCoverage.adapter, 'fixture-js-to-rust-target-adapter');
const throwingTargetAdapter = {
  ...jsToRustTargetAdapter,
  id: 'fixture-js-to-rust-throwing-target-adapter',
  project() {
    throw new Error('fixture projection failed');
  }
};
const rustNativeCompileThrowingAdapter = compileNativeSource(scannedJsImport, {
  target: 'rust',
  targetAdapters: [throwingTargetAdapter]
});
assert.equal(rustNativeCompileThrowingAdapter.ok, false);
assert.equal(rustNativeCompileThrowingAdapter.outputMode, 'target-adapter');
assert.equal(rustNativeCompileThrowingAdapter.readiness.readiness, 'blocked');
assert.equal(rustNativeCompileThrowingAdapter.targetProjection.diagnostics.some((diagnostic) => diagnostic.code === 'targetAdapter.project.threw'), true);
assert.equal(rustNativeCompileThrowingAdapter.losses.some((loss) => loss.kind === 'targetProjectionLoss' && loss.severity === 'error'), true);
const staleNativeProjection = projectNativeImportToSource(preservedNativeImport, {
  sourceText: 'export function preservedNative() { return false; }\n'
});
assert.equal(staleNativeProjection.mode, 'native-source-stubs');
assert.equal(staleNativeProjection.losses.some((loss) => loss.metadata?.reason === 'source-hash-mismatch'), true);
assert.equal(staleNativeProjection.lossSummary.categories.includes('sourcePreservation'), true);
const staleHashOverrideProjection = projectNativeImportToSource(preservedNativeImport, {
  sourceText: 'export function preservedNative() { return false; }\n',
  sourceHash: preservedNativeImport.nativeSource.sourceHash
});
assert.equal(staleHashOverrideProjection.mode, 'native-source-stubs');
assert.equal(staleHashOverrideProjection.losses.some((loss) => loss.metadata?.declaredSourceHash === preservedNativeImport.nativeSource.sourceHash), true);

function roundtripEvidenceRecord(result) {
  return result.evidence.filter((entry) => entry.metadata?.schema === 'frontier.lang.nativeRoundtripEvidence').at(-1);
}
