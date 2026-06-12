import { assert } from './helpers.mjs';
import { createBidirectionalTargetChangeRecord, importNativeSource } from './compiler-api.mjs';

const baseText = 'export function portable(value) { return value * 2; }\n';
const targetEditedText = 'export function portable(value) { return value * 3; }\n';
const currentSourceText = 'export function portable(value) { return value * 4; }\n';
const sourceImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/conflict.js',
  sourceText: currentSourceText
});

const record = createBidirectionalTargetChangeRecord({
  id: 'same_language_target_change_conflict',
  source: sourceImport,
  targetLanguage: 'javascript',
  targetPath: 'src/conflict.js',
  baseTarget: { language: 'javascript', sourcePath: 'src/conflict.js', sourceText: baseText },
  editedTarget: { language: 'javascript', sourcePath: 'src/conflict.js', sourceText: targetEditedText }
});

assert.equal(record.sourceProjectionHint.sourceBackprojectionMode, 'same-language-target-source-edit');
assert.equal(record.sourceProjectionHint.status, 'conflict');
assert.equal(record.sourceProjectionHint.reviewRequired, true);
assert.equal(record.sourceEditScript.admission.status, 'conflict');
assert.equal(record.sourceEditScript.admission.autoApplyCandidate, false);
assert.equal(record.sourceEditScript.operations[0].status, 'conflict');
assert.equal(record.sourceEditScript.operations[0].reasonCodes.includes('head-anchor-changed-since-base'), true);
assert.equal(record.sourceEditProjection.status, 'blocked');
assert.equal(record.sourceEditProjection.admission.reasonCodes.some((reason) => reason.startsWith('operation-not-portable:')), true);
assert.equal(record.sourceEditReplay, undefined);
assert.equal(record.roundtripEvidence.admission.status, 'needs-review');
assert.equal(record.roundtripEvidence.admission.reviewRequired, true);
assert.equal(record.sourcePatchBundle.admission.status, 'blocked');
assert.equal(record.sourcePatchBundle.admission.readiness, 'blocked');
assert.equal(record.sourcePatchBundle.admission.autoApplyCandidate, false);
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.status, 'blocked');
assert.equal(record.metadata.reviewRequired, true);
