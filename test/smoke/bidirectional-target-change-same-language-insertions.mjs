import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource,
  querySemanticPatchBundleRecords
} from './compiler-api.mjs';

const baseText = 'export function existing() { return 1; }\n';
const editedText = [
  "import { helper } from './helper.js';\n",
  'export function existing() { return 1; }\n',
  'export function added() { return helper(); }\n'
].join('');
const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceText: baseText
});

const record = createBidirectionalTargetChangeRecord({
  id: 'same_language_target_change_insertions',
  source: sourceImport,
  targetLanguage: 'typescript',
  targetPath: 'src/runtime.ts',
  baseTarget: { language: 'typescript', sourcePath: 'src/runtime.ts', sourceText: baseText },
  editedTarget: { language: 'typescript', sourcePath: 'src/runtime.ts', sourceText: editedText }
});

assert.equal(record.targetPortability.sourceMapBackedRegions, 0);
assert.equal(record.sourceProjectionHint.sourceBackprojectionMode, 'same-language-target-source-edit');
assert.equal(record.sourceProjectionHint.status, 'auto-merge-candidate');
assert.equal(record.sourceProjectionHint.reviewRequired, false);
assert.equal(record.sourceEditScript.admission.status, 'auto-merge-candidate');
assert.equal(record.sourceEditScript.summary.byKind.addBody, 1);
assert.equal(record.sourceEditScript.summary.byKind.addImport, 2);
assert.equal(record.sourceEditProjection.status, 'projected');
assert.equal(record.sourceEditProjection.sourceText, editedText);
assert.equal(record.sourceEditProjection.edits.filter((edit) => edit.editKind === 'insert').length, 2);
assert.equal(record.sourceEditProjection.edits.some((edit) => edit.insertionMode === 'before'), true);
assert.equal(record.sourceEditProjection.edits.some((edit) => edit.insertionMode === 'after'), true);
assert.equal(record.sourceEditReplay.status, 'accepted-clean');
assert.equal(record.sourceEditReplay.outputSourceText, editedText);
assert.equal(record.roundtripEvidence.admission.status, 'ready');
assert.equal(record.roundtripEvidence.admission.action, 'admit-source-backprojection');
assert.equal(record.roundtripEvidence.admission.reasonCodes.includes('verified-same-language-target-source-edit'), true);
assert.equal(record.sourcePatchBundle.admission.status, 'admitted');
assert.equal(record.sourcePatchBundle.admission.autoApplyCandidate, true);
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.status, 'ready');
assert.equal(record.sourcePatchBundle.admission.semanticEditAdmission.action, 'admit');
assert.equal(record.metadata.reviewRequired, false);
assert.equal(querySemanticPatchBundleRecords([record.sourcePatchBundle], { semanticEditAdmissionStatus: 'ready' }).length, 1);
