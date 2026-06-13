import { assert } from './helpers.mjs';
import {
  compareSemanticPatchBundleRecords,
  createSemanticEditBundleAdmission,
  createSemanticEditScript,
  createSemanticPatchBundleRecord,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleOverlaps,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'export class Store {\n  static save(title: string) {\n    return title.trim();\n  }\n\n  save(title: string) {\n    return title.trim();\n  }\n}\n';
const staticWorkerSource = baseSource.replace(
  'return title.trim();\n  }\n\n  save',
  'return title.trim().toUpperCase();\n  }\n\n  save'
);
const memberWorkerSource = baseSource.replace(
  '  save(title: string) {\n    return title.trim();\n  }',
  '  save(title: string) {\n    return title.trim().toLowerCase();\n  }'
);
const passedAutoMergeProof = {
  id: 'evidence_semantic_edit_bundle_class_member_tests',
  kind: 'test',
  status: 'passed',
  scope: 'semantic-edit:auto-merge',
  summary: 'Static/member class edit bundle replay gate passed.'
};

const staticFlow = semanticEditFlow({
  id: 'bundle_static_method_independent',
  worker: staticWorkerSource,
  head: memberWorkerSource
});
const memberFlow = semanticEditFlow({
  id: 'bundle_member_method_independent',
  worker: memberWorkerSource,
  head: staticWorkerSource
});

assert.equal(staticFlow.script.operations[0].anchor.symbolName, 'Store.static.save:controlFlow:exit#1');
assert.equal(memberFlow.script.operations[0].anchor.symbolName, 'Store.save:controlFlow:exit#1');
assert.notEqual(staticFlow.script.operations[0].anchor.conflictKey, memberFlow.script.operations[0].anchor.conflictKey);

const admission = createSemanticEditBundleAdmission({
  semanticEditScripts: [staticFlow.script, memberFlow.script],
  semanticEditProjections: [staticFlow.projection, memberFlow.projection],
  semanticEditReplays: [staticFlow.replay, memberFlow.replay],
  evidence: [passedAutoMergeProof]
});
assert.equal(admission.status, 'ready');
assert.equal(admission.autoApplyCandidate, true);
assert.equal(admission.summary.files, 1);
assert.equal(admission.summary.acceptedClean, 2);
assert.equal(admission.summary.conflicts, 0);
assert.equal(admission.summary.conflictEvidence, 0);

const staticBundle = createClassMemberBundle('static', staticWorkerSource, staticFlow);
const memberBundle = createClassMemberBundle('member', memberWorkerSource, memberFlow);
assert.equal(staticBundle.admission.semanticEditAdmission.status, 'ready');
assert.equal(memberBundle.admission.semanticEditAdmission.status, 'ready');

const overlap = compareSemanticPatchBundleRecords(staticBundle, memberBundle);
assert.equal(overlap.admission.status, 'independent');
assert.equal(overlap.admission.reviewRequired, false);
assert.deepEqual(overlap.overlapKinds, []);
assert.deepEqual(overlap.shared.sourcePaths, []);
assert.deepEqual(overlap.shared.regionKeys, []);
assert.deepEqual(overlap.shared.conflictKeys, []);
assert.equal(querySemanticPatchBundleOverlaps([staticBundle, memberBundle]).length, 0);
assert.equal(
  querySemanticPatchBundleOverlaps([staticBundle, memberBundle], { includeIndependent: true })[0].admission.status,
  'independent'
);

function semanticEditFlow(input) {
  const script = createSemanticEditScript({
    id: `${input.id}_script`,
    language: 'typescript',
    sourcePath: 'src/store.ts',
    baseSourceText: baseSource,
    workerSourceText: input.worker,
    headSourceText: input.head,
    generatedAt: 230
  });
  const projection = projectSemanticEditScriptToSource({
    id: `${input.id}_projection`,
    script,
    workerSourceText: input.worker,
    headSourceText: input.head
  });
  const replay = replaySemanticEditProjection({
    id: `${input.id}_replay`,
    projection,
    currentSourceText: input.head
  });
  return { script, projection, replay };
}

function createClassMemberBundle(kind, workerSource, flow) {
  const changeSet = diffNativeSources({
    id: `semantic_edit_${kind}_class_method_change`,
    language: 'typescript',
    sourcePath: 'src/store.ts',
    beforeSourceText: baseSource,
    afterSourceText: workerSource
  });
  return createSemanticPatchBundleRecord(changeSet, {
    id: `semantic_edit_bundle_${kind}_class_method`,
    semanticEditScripts: [flow.script],
    semanticEditProjections: [flow.projection],
    semanticEditReplays: [flow.replay],
    evidence: [passedAutoMergeProof]
  });
}
