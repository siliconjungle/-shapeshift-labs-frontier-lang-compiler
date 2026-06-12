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
