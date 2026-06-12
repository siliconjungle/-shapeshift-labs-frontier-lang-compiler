import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords
} from './compiler-api.mjs';

const addedLfText = 'export function addedLf(): number {\n  return 2;\n}\n';
const addedCrlfText = 'export function addedLf(): number {\r\n  return 2;\r\n}\r\n';
const sourceText = `export function keep() { return 1; }\n${addedLfText}`;
const baseTargetText = 'export function keep() { return 1; }\r\n';
const editedTargetText = `${baseTargetText}${addedCrlfText}`;
const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/add-lf.ts',
  sourceText
});
const addedSymbol = sourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'addedLf');
const addedMapping = sourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === addedSymbol.id);

const record = createBidirectionalTargetChangeRecord({
  id: 'counter_ts_target_change_add_line_endings',
  source: sourceImport,
  targetLanguage: 'typescript',
  targetPath: 'dist/add-crlf.ts',
  baseTarget: { language: 'typescript', sourcePath: 'dist/add-crlf.ts', sourceText: baseTargetText },
  editedTarget: { language: 'typescript', sourcePath: 'dist/add-crlf.ts', sourceText: editedTargetText },
  sourceMaps: [{
    kind: 'frontier.lang.sourceMap',
    version: 1,
    id: 'source_map_add_line_endings',
    sourcePath: 'src/add-lf.ts',
    sourceHash: sourceImport.nativeSource.sourceHash,
    target: 'typescript',
    targetPath: 'dist/add-crlf.ts',
    mappings: [{
      id: 'map_add_added_lf',
      semanticSymbolId: addedSymbol.id,
      nativeAstNodeId: addedSymbol.nativeAstNodeId,
      sourceSpan: addedMapping.sourceSpan,
      generatedSpan: {
        path: 'dist/add-crlf.ts',
        target: 'typescript',
        targetPath: 'dist/add-crlf.ts',
        startLine: 2,
        startColumn: 1,
        endLine: 4,
        endColumn: 2,
        generatedName: 'addedLf'
      },
      target: 'typescript',
      generatedName: 'addedLf',
      precision: 'exact',
      preservation: 'exact'
    }]
  }]
});

assert.equal(record.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(record.sourceEditScript.summary.byStatus['already-applied'], 1);
assert.equal(record.sourceEditScript.summary.byStatus.covered, 2);
assert.equal(record.sourceEditScript.operations[0].status, 'already-applied');
assert.equal(record.sourceEditScript.operations[0].metadata.sourceBackprojection.lineEndingStable, true);
assert.equal(record.sourceEditProjection.status, 'projected');
assert.equal(record.sourceEditProjection.projectedHash, sourceImport.nativeSource.sourceHash);
assert.equal(record.sourceEditProjection.metadata.alreadyAppliedEditCount, 1);
assert.equal(record.sourceEditReplay.status, 'already-applied');
assert.equal(record.sourceEditReplay.admission.reviewRequired, false);
assert.equal(record.sourceEditReplay.outputSourceText, sourceText);
assert.equal(record.sourcePatchBundle.admission.status, 'admitted');
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.status, 'already-applied');
assert.equal(record.sourcePatchBundle.admission.evidenceAdmission.status, 'ready');
assert.equal(record.roundtripEvidence.admission.status, 'ready');
assert.equal(record.roundtripEvidence.admission.action, 'skip-source-backprojection');
assert.equal(record.metadata.reviewRequired, false);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticEditAdmissionStatus: 'already-applied' }).length, 1);
