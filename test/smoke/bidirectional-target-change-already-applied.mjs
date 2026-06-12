import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords
} from './compiler-api.mjs';

const baseTargetText = 'export function add(count: number): number { return count + 1; }\n';
const editedText = 'export function add(count: number): number { return count + 2; }\n';
const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  sourceText: editedText
});
const sourceSymbol = sourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const sourceMapping = sourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === sourceSymbol.id);
const sourceMap = {
  kind: 'frontier.lang.sourceMap',
  version: 1,
  id: 'source_map_counter_ts_to_dist_ts_already_applied',
  sourcePath: 'src/counter.ts',
  sourceHash: sourceImport.nativeSource.sourceHash,
  target: 'typescript',
  targetPath: 'dist/counter.ts',
  mappings: [{
    id: 'map_ts_add_to_dist_ts_add_already_applied',
    semanticSymbolId: sourceSymbol.id,
    nativeAstNodeId: sourceSymbol.nativeAstNodeId,
    sourceSpan: sourceMapping.sourceSpan,
    generatedSpan: {
      path: 'dist/counter.ts',
      target: 'typescript',
      targetPath: 'dist/counter.ts',
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: baseTargetText.length,
      generatedName: 'add'
    },
    target: 'typescript',
    generatedName: 'add',
    precision: 'exact',
    preservation: 'exact'
  }]
};

const record = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_already_applied_source',
  source: sourceImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/counter.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/counter.ts', sourceText: baseTargetText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/counter.ts', sourceText: editedText },
  sourceMaps: [sourceMap]
});

assert.equal(record.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(record.sourceEditScript.operations[0].status, 'already-applied');
assert.equal(record.sourceEditScript.operations[0].metadata.sourceBackprojection.alreadyApplied, true);
assert.equal(record.sourceEditProjection.status, 'projected');
assert.equal(record.sourceEditProjection.sourceText, editedText);
assert.equal(record.sourceEditReplay.status, 'already-applied');
assert.equal(record.sourceEditReplay.admission.reviewRequired, false);
assert.equal(record.sourcePatchBundle.admission.status, 'admitted');
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.status, 'already-applied');
assert.equal(record.sourcePatchBundle.admission.autoApplyCandidate, false);
assert.equal(record.roundtripEvidence.admission.status, 'ready');
assert.equal(record.roundtripEvidence.admission.action, 'skip-source-backprojection');
assert.equal(record.evidence[0].metadata.semanticMergeAdmission.action, 'skip-source-backprojection');
assert.equal(record.historyRecord.admission.status, 'ready');
assert.equal(record.metadata.reviewRequired, false);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticEditAdmissionStatus: 'already-applied' }).length, 1);

const lfEditedText = 'export function add(count: number): number {\n  return count + 2;\n}\n';
const crlfBaseTargetText = 'export function add(count: number): number {\r\n  return count + 1;\r\n}\r\n';
const crlfEditedTargetText = 'export function add(count: number): number {\r\n  return count + 2;\r\n}\r\n';
const lfSourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter-lf.ts',
  sourceText: lfEditedText
});
const lfSourceSymbol = lfSourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const lfSourceMapping = lfSourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === lfSourceSymbol.id);
const lineEndingStableRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_already_applied_line_endings',
  source: lfSourceImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/counter-crlf.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/counter-crlf.ts', sourceText: crlfBaseTargetText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/counter-crlf.ts', sourceText: crlfEditedTargetText },
  sourceMaps: [{
    ...sourceMap,
    id: 'source_map_counter_lf_to_dist_crlf_already_applied',
    sourcePath: 'src/counter-lf.ts',
    sourceHash: lfSourceImport.nativeSource.sourceHash,
    targetPath: 'dist/counter-crlf.ts',
    mappings: [{
      ...sourceMap.mappings[0],
      id: 'map_ts_lf_add_to_dist_crlf_add_already_applied',
      semanticSymbolId: lfSourceSymbol.id,
      nativeAstNodeId: lfSourceSymbol.nativeAstNodeId,
      sourceSpan: lfSourceMapping.sourceSpan,
      generatedSpan: {
        path: 'dist/counter-crlf.ts',
        target: 'typescript',
        targetPath: 'dist/counter-crlf.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
        generatedName: 'add'
      }
    }]
  }]
});
assert.equal(lineEndingStableRecord.sourceEditScript.operations[0].status, 'already-applied');
assert.equal(lineEndingStableRecord.sourceEditScript.operations[0].metadata.sourceBackprojection.lineEndingStable, true);
assert.equal(lineEndingStableRecord.sourceEditReplay.status, 'already-applied');
assert.equal(lineEndingStableRecord.roundtripEvidence.admission.action, 'skip-source-backprojection');

const lfBaseText = 'export function add(count: number): number {\n  return count + 1;\n}\n';
const lfApplySourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter-lf-apply.ts',
  sourceText: lfBaseText
});
const lfApplySymbol = lfApplySourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const lfApplyMapping = lfApplySourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === lfApplySymbol.id);
const lineEndingStableApplyRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_apply_line_endings',
  source: lfApplySourceImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/counter-crlf-apply.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/counter-crlf-apply.ts', sourceText: crlfBaseTargetText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/counter-crlf-apply.ts', sourceText: crlfEditedTargetText },
  sourceMaps: [{
    ...sourceMap,
    id: 'source_map_counter_lf_to_dist_crlf_apply',
    sourcePath: 'src/counter-lf-apply.ts',
    sourceHash: lfApplySourceImport.nativeSource.sourceHash,
    targetPath: 'dist/counter-crlf-apply.ts',
    mappings: [{
      ...sourceMap.mappings[0],
      id: 'map_ts_lf_add_to_dist_crlf_add_apply',
      semanticSymbolId: lfApplySymbol.id,
      nativeAstNodeId: lfApplySymbol.nativeAstNodeId,
      sourceSpan: lfApplyMapping.sourceSpan,
      generatedSpan: {
        path: 'dist/counter-crlf-apply.ts',
        target: 'typescript',
        targetPath: 'dist/counter-crlf-apply.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
        generatedName: 'add'
      }
    }]
  }]
});
assert.equal(lineEndingStableApplyRecord.sourceEditScript.operations[0].status, 'portable');
assert.equal(lineEndingStableApplyRecord.sourceEditScript.operations[0].metadata.sourceBackprojection.lineEndingStable, true);
assert.equal(lineEndingStableApplyRecord.sourceEditProjection.sourceText, lfEditedText);
assert.equal(lineEndingStableApplyRecord.sourceEditProjection.edits[0].replacementText.includes('\r'), false);
assert.equal(lineEndingStableApplyRecord.sourceEditReplay.status, 'accepted-clean');
assert.equal(lineEndingStableApplyRecord.sourceEditReplay.outputSourceText, lfEditedText);
assert.equal(lineEndingStableApplyRecord.sourcePatchBundle.admission.status, 'admitted');
assert.equal(lineEndingStableApplyRecord.roundtripEvidence.admission.action, 'admit-source-backprojection');

const deletionSourceText = 'export function keep() { return 1; }\nexport function removeMe() { return 2; }\n';
const deletionExpectedText = 'export function keep() { return 1; }\n';
const deletionSourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/delete.ts',
  sourceText: deletionSourceText
});
const deletionSymbol = deletionSourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'removeMe');
const deletionMapping = deletionSourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === deletionSymbol.id);
const deletionRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_delete_exact_source_map',
  source: deletionSourceImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/delete.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/delete.ts', sourceText: deletionSourceText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/delete.ts', sourceText: deletionExpectedText },
  sourceMaps: [{
    ...sourceMap,
    id: 'source_map_delete_exact',
    sourcePath: 'src/delete.ts',
    sourceHash: deletionSourceImport.nativeSource.sourceHash,
    targetPath: 'dist/delete.ts',
    mappings: [{
      ...sourceMap.mappings[0],
      id: 'map_delete_remove_me',
      semanticSymbolId: deletionSymbol.id,
      nativeAstNodeId: deletionSymbol.nativeAstNodeId,
      sourceSpan: deletionMapping.sourceSpan,
      generatedSpan: { ...deletionMapping.sourceSpan, path: 'dist/delete.ts', target: 'typescript', targetPath: 'dist/delete.ts', generatedName: 'removeMe' },
      generatedName: 'removeMe'
    }]
  }]
});
assert.equal(deletionRecord.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(deletionRecord.sourceEditScript.summary.byKind.removeBody, 1);
assert.equal(deletionRecord.sourceEditProjection.status, 'projected');
assert.equal(deletionRecord.sourceEditProjection.sourceText, deletionExpectedText);
assert.equal(deletionRecord.sourceEditProjection.edits.length, 1);
assert.equal(deletionRecord.sourceEditReplay.status, 'accepted-clean');
assert.equal(deletionRecord.sourcePatchBundle.admission.status, 'admitted');
assert.equal(deletionRecord.roundtripEvidence.admission.status, 'ready');

const additionSourceText = 'export function keep() { return 1; }\nexport function added() { return 2; }\n';
const additionBaseTargetText = 'export function keep() { return 1; }\n';
const additionSourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/add.ts',
  sourceText: additionSourceText
});
const additionSymbol = additionSourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'added');
const additionMapping = additionSourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === additionSymbol.id);
const additionRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_add_exact_source_map_already_applied',
  source: additionSourceImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/add.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/add.ts', sourceText: additionBaseTargetText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/add.ts', sourceText: additionSourceText },
  sourceMaps: [{
    ...sourceMap,
    id: 'source_map_add_exact',
    sourcePath: 'src/add.ts',
    sourceHash: additionSourceImport.nativeSource.sourceHash,
    targetPath: 'dist/add.ts',
    mappings: [{
      ...sourceMap.mappings[0],
      id: 'map_add_added',
      semanticSymbolId: additionSymbol.id,
      nativeAstNodeId: additionSymbol.nativeAstNodeId,
      sourceSpan: additionMapping.sourceSpan,
      generatedSpan: { ...additionMapping.sourceSpan, path: 'dist/add.ts', target: 'typescript', targetPath: 'dist/add.ts', generatedName: 'added' },
      generatedName: 'added'
    }]
  }]
});
assert.equal(additionRecord.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(additionRecord.sourceEditScript.summary.byStatus['already-applied'], 2);
assert.equal(additionRecord.sourceEditScript.summary.byStatus.covered, 1);
assert.equal(additionRecord.sourceEditReplay.status, 'already-applied');
assert.equal(additionRecord.sourcePatchBundle.admission.status, 'admitted');
assert.equal(additionRecord.sourcePatchBundle.admission.semanticEditAdmission.status, 'already-applied');
assert.equal(additionRecord.roundtripEvidence.admission.action, 'skip-source-backprojection');
assert.equal(additionRecord.metadata.reviewRequired, false);

const deletionLfSourceText = 'export function keep() { return 1; }\nexport function removeLf() { return 2; }\n';
const deletionCrlfTargetText = 'export function keep() { return 1; }\r\nexport function removeLf() { return 2; }\r\n';
const deletionLfExpectedText = 'export function keep() { return 1; }\n';
const deletionCrlfExpectedText = 'export function keep() { return 1; }\r\n';
const deletionLfImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/delete-lf.ts',
  sourceText: deletionLfSourceText
});
const deletionLfSymbol = deletionLfImport.semanticIndex.symbols.find((symbol) => symbol.name === 'removeLf');
const deletionLfMapping = deletionLfImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === deletionLfSymbol.id);
const deletionLineEndingRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_delete_line_endings',
  source: deletionLfImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/delete-crlf.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/delete-crlf.ts', sourceText: deletionCrlfTargetText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/delete-crlf.ts', sourceText: deletionCrlfExpectedText },
  sourceMaps: [{
    ...sourceMap,
    id: 'source_map_delete_line_endings',
    sourcePath: 'src/delete-lf.ts',
    sourceHash: deletionLfImport.nativeSource.sourceHash,
    targetPath: 'dist/delete-crlf.ts',
    mappings: [{
      ...sourceMap.mappings[0],
      id: 'map_delete_remove_lf',
      semanticSymbolId: deletionLfSymbol.id,
      nativeAstNodeId: deletionLfSymbol.nativeAstNodeId,
      sourceSpan: deletionLfMapping.sourceSpan,
      generatedSpan: { path: 'dist/delete-crlf.ts', target: 'typescript', targetPath: 'dist/delete-crlf.ts', startLine: 2, startColumn: 1, endLine: 2, endColumn: 41, generatedName: 'removeLf' },
      generatedName: 'removeLf'
    }]
  }]
});
assert.equal(deletionLineEndingRecord.sourceEditProjection.sourceText, deletionLfExpectedText);
assert.equal(deletionLineEndingRecord.sourceEditReplay.status, 'accepted-clean');
assert.equal(deletionLineEndingRecord.sourcePatchBundle.admission.status, 'admitted');
assert.equal(deletionLineEndingRecord.roundtripEvidence.admission.action, 'admit-source-backprojection');
