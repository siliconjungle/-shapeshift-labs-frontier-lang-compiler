import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  createSemanticImportSidecar,
  createSemanticLineageEvent,
  importNativeSource
} from './compiler-api.mjs';

const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  sourceText: 'export function add(count: number): number { return count + 1; }\n'
});
const sourceSidecar = createSemanticImportSidecar(sourceImport);
const sourceKey = sourceSidecar.ownershipRegions.find((region) => region.symbolName === 'add')?.key;
const movedKey = 'source#src/counter-core.ts#body#addCounter';
const lineage = [createSemanticLineageEvent({
  id: 'lineage_counter_add_move',
  eventKind: 'moved',
  from: { key: sourceKey, sourcePath: 'src/counter.ts', symbolName: 'add' },
  to: { key: movedKey, sourcePath: 'src/counter-core.ts', symbolName: 'addCounter' },
  confidence: 0.9,
  evidenceIds: ['evidence_counter_move']
})];

const record = createBidirectionalTargetChangeRecord({
  id: 'counter_rust_target_change',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32) -> i32 { count + 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32, step: i32) -> i32 { count + step }\n'
  },
  sourceAnchorMappings: [{ targetSymbolName: 'add', sourceSymbolName: 'add' }],
  lineage
});

assert.equal(record.kind, 'frontier.lang.bidirectionalTargetChangeRecord');
assert.equal(record.targetLanguage, 'rust');
assert.equal(record.sourceLanguage, 'typescript');
assert.equal(record.readiness, 'needs-review');
assert.equal(record.metadata.autoMergeClaim, false);
assert.equal(record.metadata.semanticEquivalenceClaim, false);
assert.equal(record.summary.targetChangedRegions > 0, true);
assert.equal(record.summary.sourceAnchorMatches, 1);
assert.equal(record.summary.unmatchedTargetRegions, 0);
assert.equal(record.sourceAnchorMatches[0].status, 'matched');
assert.equal(record.sourceAnchorMatches[0].sourceAnchors[0].key, movedKey);
assert.equal(record.sourceAnchorMatches[0].lineageResolutions[0].status, 'resolved');
assert.equal(record.sourcePatchBundle.kind, 'frontier.lang.semanticPatchBundleRecord');
assert.equal(record.sourcePatchBundle.admission.autoMergeClaim, false);
assert.equal(record.sourcePatchBundle.admission.reviewRequired, true);
assert.equal(record.sourcePatchBundle.index.conflictKeys.includes(movedKey), true);
assert.equal(record.historyRecord.kind, 'frontier.lang.semanticHistoryRecord');
assert.equal(record.historyRecord.index.ownershipKeys.includes(movedKey), true);
assert.equal(record.historyRecord.index.evidenceIds.includes(record.evidence[0].id), true);
assert.equal(record.evidence[0].metadata.autoMergeClaim, false);
assert.equal(record.evidence[0].metadata.semanticEquivalenceClaim, false);

const unmatched = createBidirectionalTargetChangeRecord({
  id: 'counter_unmatched_rust_target_change',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn subtract(count: i32) -> i32 { count - 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn subtract(count: i32, step: i32) -> i32 { count - step }\n'
  }
});

assert.equal(unmatched.readiness, 'blocked');
assert.equal(unmatched.summary.sourceAnchorMatches, 0);
assert.equal(unmatched.summary.unmatchedTargetRegions > 0, true);
assert.equal(unmatched.sourceAnchorMatches[0].reasonCodes.includes('source-anchor-not-found'), true);
