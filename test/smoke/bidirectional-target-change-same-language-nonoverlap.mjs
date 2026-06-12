import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords
} from './compiler-api.mjs';

const baseText = [
  'export function untouched(value) { return value + 1; }\n',
  'export function portable(value) { return value * 2; }\n'
].join('');
const targetEditedText = [
  'export function untouched(value) { return value + 1; }\n',
  'export function portable(value) { return value * 3; }\n'
].join('');
const currentSourceText = [
  'export function untouched(value) { return value + 10; }\n',
  'export function portable(value) { return value * 2; }\n'
].join('');
const expectedMergedText = [
  'export function untouched(value) { return value + 10; }\n',
  'export function portable(value) { return value * 3; }\n'
].join('');

const sourceImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/non-overlap.js',
  sourceText: currentSourceText
});

const record = createBidirectionalTargetChangeRecord({
  id: 'same_language_target_change_nonoverlap',
  source: sourceImport,
  targetLanguage: 'javascript',
  targetPath: 'src/non-overlap.js',
  baseTarget: { language: 'javascript', sourcePath: 'src/non-overlap.js', sourceText: baseText },
  editedTarget: { language: 'javascript', sourcePath: 'src/non-overlap.js', sourceText: targetEditedText }
});

assert.equal(record.targetPortability.status, 'needs-port');
assert.equal(record.sourceProjectionHint.sourceBackprojectionMode, 'same-language-target-source-edit');
assert.equal(record.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(record.sourceEditScript.operations[0].reasonCodes.includes('head-anchor-matches-base'), true);
assert.equal(record.sourceEditProjection.status, 'projected');
assert.equal(record.sourceEditProjection.sourceText, expectedMergedText);
assert.equal(record.sourceEditProjection.edits[0].kind, 'replaceControlFlow');
assert.equal(record.sourceEditReplay.status, 'accepted-clean');
assert.equal(record.sourceEditReplay.outputSourceText, expectedMergedText);
assert.equal(record.sourceEditReplay.summary.reasonCodes.includes('head-offset-matches-deleted'), true);
assert.equal(record.roundtripEvidence.admission.status, 'ready');
assert.equal(record.roundtripEvidence.admission.reasonCodes.includes('verified-same-language-target-source-edit'), true);
assert.equal(record.sourcePatchBundle.admission.status, 'admitted');
assert.equal(record.sourcePatchBundle.admission.autoApplyCandidate, true);
assert.equal(record.sourcePatchBundle.admission.transformAdmission.status, 'ready');
assert.equal(record.sourcePatchBundle.admission.transformAdmission.action, 'admit');
assert.deepEqual(record.sourcePatchBundle.index.transformSourceLanguages, ['javascript']);
assert.deepEqual(record.sourcePatchBundle.index.transformTargetLanguages, ['javascript']);
assert.deepEqual(record.sourcePatchBundle.index.transformCrossLanguages, ['false']);
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.status, 'ready');
assert.equal(record.metadata.reviewRequired, false);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticEditAdmissionStatus: 'ready' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformSourceLanguage: 'javascript' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformTargetLanguage: 'javascript' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { transformCrossLanguage: false }).length, 1);
