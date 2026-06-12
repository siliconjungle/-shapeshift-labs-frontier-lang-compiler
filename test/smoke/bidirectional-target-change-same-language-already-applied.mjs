import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords
} from './compiler-api.mjs';

const baseText = 'export function portable(value) { return value * 2; }\n';
const editedText = 'export function portable(value) { return value * 3; }\n';
const sourceImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/already.js',
  sourceText: editedText
});

const record = createBidirectionalTargetChangeRecord({
  id: 'same_language_target_change_already_applied',
  source: sourceImport,
  targetLanguage: 'javascript',
  targetPath: 'src/already.js',
  baseTarget: { language: 'javascript', sourcePath: 'src/already.js', sourceText: baseText },
  editedTarget: { language: 'javascript', sourcePath: 'src/already.js', sourceText: editedText }
});

assert.equal(record.sourceProjectionHint.sourceBackprojectionMode, 'same-language-target-source-edit');
assert.equal(record.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(record.sourceEditScript.summary.byStatus['already-applied'], 1);
assert.equal(record.sourceEditScript.operations[0].reasonCodes.includes('head-anchor-matches-worker'), true);
assert.equal(record.sourceEditProjection.status, 'projected');
assert.equal(record.sourceEditProjection.sourceText, editedText);
assert.equal(record.sourceEditProjection.edits[0].status, 'already-applied');
assert.equal(record.sourceEditReplay.status, 'already-applied');
assert.equal(record.sourceEditReplay.admission.action, 'skip');
assert.equal(record.sourceEditReplay.outputSourceText, editedText);
assert.equal(record.roundtripEvidence.admission.status, 'ready');
assert.equal(record.roundtripEvidence.admission.action, 'skip-source-backprojection');
assert.equal(record.sourcePatchBundle.admission.status, 'admitted');
assert.equal(record.sourcePatchBundle.admission.autoApplyCandidate, false);
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.status, 'already-applied');
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.action, 'skip');
assert.equal(record.metadata.reviewRequired, false);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticEditAdmissionStatus: 'already-applied' }).length, 1);
