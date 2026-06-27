import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { runtimeEvidence } from './html-css-merge-test-helpers.mjs';

const htmlAngularDirectiveBase = '<input data-frontier-key="name" [(ngModel)]="name">\n';
const htmlAngularDirectiveWorker = '<input data-frontier-key="name" [(ngModel)]="draftName">\n';
const htmlAngularDirectiveBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_angular_framework_directive_runtime_block',
  files: [{ sourcePath: 'src/angular.html', baseSourceText: htmlAngularDirectiveBase, workerSourceText: htmlAngularDirectiveWorker, headSourceText: htmlAngularDirectiveBase }]
});
assert.equal(htmlAngularDirectiveBlockedProject.status, 'blocked');
assert.equal(htmlAngularDirectiveBlockedProject.summary.htmlFrameworkBoundaryEvidenceFiles, 1);
assert.equal(htmlAngularDirectiveBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAngularDirectiveBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'framework-directive-boundary'), true);
const htmlAngularDirectiveBlockedConflict = htmlAngularDirectiveBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'framework-directive-boundary');
assert.equal(htmlAngularDirectiveBlockedConflict.details.boundary, 'html-framework-directive');
assert.deepEqual(htmlAngularDirectiveBlockedConflict.details.boundaryAttributes, ['[(ngmodel)]']);

const htmlAngularDirectiveWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_angular_framework_directive_runtime_wrong_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/angular.html': [{
      id: 'html_angular_framework_directive_wrong_output',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/angular.html',
      reasonCode: 'framework-directive-boundary',
      side: 'worker',
      boundary: 'html-framework-directive',
      boundaryAttributes: ['[(ngmodel)]'],
      sourceTexts: { base: htmlAngularDirectiveBase, worker: htmlAngularDirectiveWorker, head: htmlAngularDirectiveBase, output: htmlAngularDirectiveBase },
      ...runtimeEvidence('framework-directive-boundary', 'html-framework-directive', 'angular-directive-wrong-output')
    }]
  },
  files: [{ sourcePath: 'src/angular.html', baseSourceText: htmlAngularDirectiveBase, workerSourceText: htmlAngularDirectiveWorker, headSourceText: htmlAngularDirectiveBase }]
});
assert.equal(htmlAngularDirectiveWrongProofProject.status, 'blocked');
assert.equal(htmlAngularDirectiveWrongProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAngularDirectiveWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'framework-directive-boundary'), true);

const htmlAngularDirectiveProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_angular_framework_directive_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/angular.html': [{
      id: 'html_angular_framework_directive_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/angular.html',
      reasonCode: 'framework-directive-boundary',
      side: 'worker',
      boundary: 'html-framework-directive',
      boundaryAttributes: ['[(ngmodel)]'],
      sourceTexts: { base: htmlAngularDirectiveBase, worker: htmlAngularDirectiveWorker, head: htmlAngularDirectiveBase, output: htmlAngularDirectiveWorker },
      ...runtimeEvidence('framework-directive-boundary', 'html-framework-directive', 'angular-directive')
    }]
  },
  files: [{ sourcePath: 'src/angular.html', baseSourceText: htmlAngularDirectiveBase, workerSourceText: htmlAngularDirectiveWorker, headSourceText: htmlAngularDirectiveBase }]
});
assert.equal(htmlAngularDirectiveProvenProject.status, 'merged');
assert.equal(htmlAngularDirectiveProvenProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlAngularDirectiveProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlAngularDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-framework-directive');
assert.deepEqual(htmlAngularDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes, ['[(ngmodel)]']);
assert.equal(htmlAngularDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeEvidenceBound, true);
assert.equal(htmlAngularDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeSignals.includes('html-framework-directive-runtime'), true);
assert.match(htmlAngularDirectiveProvenProject.outputFiles[0].sourceText, /draftName/);
