import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords
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
assert.equal(record.sourcePatchBundle.index.semanticTransformReadinesses.includes('needs-port'), true);
assert.equal(record.sourcePatchBundle.index.semanticTransformContentHashes.length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceLanguage: 'typescript' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformTargetLanguage: 'rust' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformCrossLanguage: true }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceMapId: 'source_map_counter_ts_to_rust' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceMapLinkId: record.sourcePatchBundle.index.transformSourceMapLinkIds[0] }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceMapMappingId: 'map_ts_add_to_rust_add' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticTransformReadiness: 'needs-port' }).length, 1);
