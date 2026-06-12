import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  sourceText: 'export function add(count: number): number { return count + 1; }\n'
});
const sourceSymbol = sourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const sourceMapping = sourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === sourceSymbol.id);

const record = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_to_rust_transform_identity',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: { language: 'rust', sourcePath: 'src/counter.rs', sourceText: 'pub fn add(count: i32) -> i32 { count + 1 }\n' },
  editedTarget: { language: 'rust', sourcePath: 'src/counter.rs', sourceText: 'pub fn add(count: i32, step: i32) -> i32 { count + step }\n' },
  sourceMaps: [{
    kind: 'frontier.lang.sourceMap',
    version: 1,
    id: 'source_map_counter_ts_to_rust',
    sourcePath: 'src/counter.ts',
    sourceHash: sourceImport.nativeSource.sourceHash,
    target: 'rust',
    targetPath: 'src/counter.rs',
    mappings: [{
      id: 'map_ts_add_to_rust_add',
      semanticSymbolId: sourceSymbol.id,
      nativeAstNodeId: sourceSymbol.nativeAstNodeId,
      sourceSpan: sourceMapping.sourceSpan,
      generatedSpan: { path: 'src/counter.rs', target: 'rust', targetPath: 'src/counter.rs', startLine: 1, startColumn: 1, endLine: 1, endColumn: 58, generatedName: 'add' },
      target: 'rust',
      generatedName: 'add',
      precision: 'declaration',
      preservation: 'declaration'
    }]
  }]
});

assert.equal(record.targetPortability.status, 'portable');
assert.equal(record.sourceEditScript.admission.status, 'needs-port');
assert.equal(record.sourcePatchBundle.admission.status, 'needs-review');
assert.equal(record.sourcePatchBundle.admission.autoApplyCandidate, false);
assert.equal(record.sourcePatchBundle.admission.transformAdmission.status, 'needs-review');
assert.equal(record.sourcePatchBundle.admission.transformAdmission.crossLanguage, true);
assert.equal(record.sourcePatchBundle.admission.transformAdmission.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.deepEqual(record.sourcePatchBundle.index.transformSourceLanguages, ['typescript']);
assert.deepEqual(record.sourcePatchBundle.index.transformTargetLanguages, ['rust']);
assert.deepEqual(record.sourcePatchBundle.index.transformSourcePaths, ['src/counter.ts']);
assert.deepEqual(record.sourcePatchBundle.index.transformTargetPaths, ['src/counter.rs']);
assert.deepEqual(record.sourcePatchBundle.index.transformCrossLanguages, ['true']);
assert.deepEqual(record.sourcePatchBundle.index.transformSourceMapIds, ['source_map_counter_ts_to_rust']);
assert.equal(record.sourcePatchBundle.index.transformSourceMapLinkIds.length, 1);
assert.deepEqual(record.sourcePatchBundle.index.transformSourceMapMappingIds, ['map_ts_add_to_rust_add']);
assert.equal(record.sourcePatchBundle.index.transformBaseHashes.length, 1);
assert.equal(record.sourcePatchBundle.index.transformTargetHashes.length, 1);
assert.equal(record.sourcePatchBundle.index.semanticTransformReadinesses.includes('needs-port'), true);
assert.equal(record.sourcePatchBundle.index.semanticTransformContentHashes.length, 1);
assert.deepEqual(record.sourcePatchBundle.index.sourceBackprojectionModes, ['review-only']);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceLanguage: 'typescript' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformTargetLanguage: 'rust' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformCrossLanguage: true }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceMapId: 'source_map_counter_ts_to_rust' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceMapLinkId: record.sourcePatchBundle.index.transformSourceMapLinkIds[0] }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceMapMappingId: 'map_ts_add_to_rust_add' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformBaseHash: record.sourcePatchBundle.index.transformBaseHashes[0] }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformTargetHash: record.sourcePatchBundle.index.transformTargetHashes[0] }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticTransformReadiness: 'needs-port' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { sourceBackprojectionMode: 'review-only' }).length, 1);

const exactTsSource = 'export function add(count: number): number { return count + 1; }\n';
const exactRustBase = 'pub fn add(count: i32) -> i32 { count + 1 }\n';
const exactRustEdited = 'pub fn add(count: i32) -> i32 { count + 2 }\n';
const exactSourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/exact-counter.ts',
  sourceText: exactTsSource
});
const exactSourceSymbol = exactSourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const sourceExpressionStart = exactTsSource.indexOf('count + 1');
const targetExpressionStart = exactRustBase.indexOf('count + 1');

function createExactReplacementRecord(input = {}) {
  return createBidirectionalTargetChangeRecord({
    id: input.id ?? 'counter_ts_to_rust_explicit_source_replacement',
    source: exactSourceImport,
    targetLanguage: 'rust',
    targetPath: 'src/exact-counter.rs',
    baseTarget: { language: 'rust', sourcePath: 'src/exact-counter.rs', sourceText: exactRustBase },
    editedTarget: { language: 'rust', sourcePath: 'src/exact-counter.rs', sourceText: exactRustEdited },
    sourceMaps: [{
      kind: 'frontier.lang.sourceMap',
      version: 1,
      id: 'source_map_exact_counter_ts_to_rust',
      sourcePath: 'src/exact-counter.ts',
      sourceHash: input.sourceHash ?? exactSourceImport.nativeSource.sourceHash,
      target: 'rust',
      targetPath: 'src/exact-counter.rs',
      mappings: [{
        id: 'map_ts_add_expr_to_rust_add_expr',
        semanticSymbolId: exactSourceSymbol.id,
        sourceSpan: { path: 'src/exact-counter.ts', start: sourceExpressionStart, end: sourceExpressionStart + 'count + 1'.length },
        generatedSpan: { path: 'src/exact-counter.rs', targetPath: 'src/exact-counter.rs', start: targetExpressionStart, end: targetExpressionStart + 'count + 1'.length, generatedName: 'add' },
        target: 'rust',
        generatedName: 'add',
        precision: 'exact',
        preservation: 'expression',
        sourceReplacementText: input.sourceReplacementText ?? 'count + 2',
        sourceReplacementTextHash: input.sourceReplacementTextHash
      }]
    }]
  });
}

const exactRecord = createExactReplacementRecord();

assert.equal(exactRecord.targetPortability.status, 'portable');
assert.equal(exactRecord.sourceProjectionHint.sourceBackprojectionMode, 'cross-language-explicit-source-replacement');
assert.equal(exactRecord.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(exactRecord.sourceEditProjection.status, 'projected');
assert.equal(exactRecord.sourceEditReplay.status, 'accepted-clean');
assert.equal(exactRecord.sourceEditReplay.outputSourceText, exactTsSource.replace('count + 1', 'count + 2'));
assert.equal(exactRecord.sourcePatchBundle.admission.status, 'admitted');
assert.equal(exactRecord.sourcePatchBundle.admission.autoApplyCandidate, true);
assert.equal(exactRecord.sourcePatchBundle.admission.reviewRequired, false);
assert.equal(exactRecord.sourcePatchBundle.admission.semanticEditAdmission.summary.acceptedClean, 1);
assert.equal(exactRecord.sourcePatchBundle.admission.transformAdmission.crossLanguage, true);
assert.equal(exactRecord.sourcePatchBundle.admission.transformAdmission.status, 'ready');
assert.deepEqual(exactRecord.sourcePatchBundle.index.transformSourceLanguages, ['typescript']);
assert.deepEqual(exactRecord.sourcePatchBundle.index.transformTargetLanguages, ['rust']);
assert.deepEqual(exactRecord.sourcePatchBundle.index.transformCrossLanguages, ['true']);
assert.deepEqual(exactRecord.sourcePatchBundle.index.transformSourceMapIds, ['source_map_exact_counter_ts_to_rust']);
assert.deepEqual(exactRecord.sourcePatchBundle.index.transformSourceMapMappingIds, ['map_ts_add_expr_to_rust_add_expr']);
assert.deepEqual(exactRecord.sourcePatchBundle.index.sourceBackprojectionModes, ['cross-language-explicit-source-replacement']);
assert.equal(querySemanticPatchBundleRecords([exactRecord.sourcePatchBundle], { admissionStatus: 'admitted' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([exactRecord.sourcePatchBundle], { transformTargetLanguage: 'rust' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([exactRecord.sourcePatchBundle], { semanticTransformReadiness: 'auto-merge-candidate' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([exactRecord.sourcePatchBundle], { sourceBackprojectionMode: 'cross-language-explicit-source-replacement' }).length, 1);

const movedSourceReplay = replaySemanticEditProjection({
  id: 'counter_ts_to_rust_moved_source_replay',
  projection: exactRecord.sourceEditProjection,
  currentSourceText: `const untouched = 0;\n${exactTsSource}`
});
assert.equal(movedSourceReplay.status, 'accepted-clean');
assert.equal(movedSourceReplay.outputSourceText, `const untouched = 0;\n${exactTsSource.replace('count + 1', 'count + 2')}`);
assert.equal(movedSourceReplay.edits[0].reasonCodes.includes('current-symbol-explicit-source-replacement-deleted-text'), true);

const shiftedSignatureSource = 'export function add(count: number, step = 1): number { return count + 1; }\n';
const shiftedSignatureReplay = replaySemanticEditProjection({
  id: 'counter_ts_to_rust_shifted_signature_replay',
  projection: exactRecord.sourceEditProjection,
  currentSourceText: shiftedSignatureSource
});
assert.equal(shiftedSignatureReplay.status, 'accepted-clean');
assert.equal(shiftedSignatureReplay.outputSourceText, shiftedSignatureSource.replace('count + 1', 'count + 2'));
assert.equal(shiftedSignatureReplay.edits[0].reasonCodes.includes('current-symbol-explicit-source-replacement-deleted-text'), true);

const replacementElsewhereSource = 'export function add(count: number): number { const marker = "count + 2"; return count + 3; }\n';
const replacementElsewhereReplay = replaySemanticEditProjection({
  id: 'counter_ts_to_rust_replacement_elsewhere_replay',
  projection: exactRecord.sourceEditProjection,
  currentSourceText: replacementElsewhereSource
});
assert.equal(replacementElsewhereReplay.status, 'conflict');
assert.equal(replacementElsewhereReplay.outputSourceText, undefined);

const badReplacementHashRecord = createExactReplacementRecord({
  id: 'counter_ts_to_rust_bad_source_replacement_hash',
  sourceReplacementTextHash: 'fnv1a32:not_the_hash'
});
assert.equal(badReplacementHashRecord.targetPortability.status, 'portable');
assert.equal(badReplacementHashRecord.sourceProjectionHint.sourceBackprojectionMode, 'review-only');
assert.equal(badReplacementHashRecord.sourceEditScript.admission.status, 'needs-port');
assert.equal(badReplacementHashRecord.sourceEditProjection, undefined);
assert.equal(badReplacementHashRecord.sourcePatchBundle.admission.status, 'needs-review');
assert.equal(badReplacementHashRecord.sourcePatchBundle.admission.autoApplyCandidate, false);
assert.equal(querySemanticPatchBundleRecords([badReplacementHashRecord.sourcePatchBundle], { admissionStatus: 'admitted' }).length, 0);
assert.equal(querySemanticPatchBundleRecords([badReplacementHashRecord.sourcePatchBundle], { sourceBackprojectionMode: 'review-only' }).length, 1);

const staleSourceMapRecord = createExactReplacementRecord({
  id: 'counter_ts_to_rust_stale_source_map',
  sourceHash: 'fnv1a32:stale'
});
assert.equal(staleSourceMapRecord.targetPortability.status, 'stale');
assert.equal(staleSourceMapRecord.sourceEditScript, undefined);
assert.equal(staleSourceMapRecord.sourceProjectionHint, undefined);
assert.equal(staleSourceMapRecord.sourcePatchBundle.admission.status, 'needs-review');
assert.equal(staleSourceMapRecord.sourcePatchBundle.admission.autoApplyCandidate, false);
assert.deepEqual(staleSourceMapRecord.sourcePatchBundle.index.sourceBackprojectionModes, []);
assert.equal(querySemanticPatchBundleRecords([staleSourceMapRecord.sourcePatchBundle], { targetPortabilityStatus: 'stale' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([staleSourceMapRecord.sourcePatchBundle], { admissionStatus: 'admitted' }).length, 0);
