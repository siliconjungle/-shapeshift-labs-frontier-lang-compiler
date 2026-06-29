import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, runtimeProofCapsule } from './html-css-merge-test-helpers.mjs';

const htmlAngularDirectiveBase = '<input data-frontier-key="name" [(ngModel)]="name">\n';
const htmlAngularDirectiveWorker = '<input data-frontier-key="name" [(ngModel)]="draftName">\n';

const htmlAngularDirectiveClaimingProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_angular_framework_directive_runtime_claiming_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/angular.html': [{
      id: 'html_angular_framework_directive_claiming',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/angular.html',
      reasonCode: 'framework-directive-boundary',
      side: 'worker',
      boundary: 'html-framework-directive',
      boundaryAttributes: ['[(ngmodel)]'],
      sourceTexts: {
        base: htmlAngularDirectiveBase,
        worker: htmlAngularDirectiveWorker,
        head: htmlAngularDirectiveBase,
        output: htmlAngularDirectiveWorker
      },
      runtimeCommand: 'node test/html-runtime/angular-framework-directive-claiming.mjs',
      runtimeProbeId: 'html:framework-directive-boundary:html-framework-directive',
      runtimeEvidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:angular-framework-directive-claiming',
      runtimeSignals: ['html-framework-directive-runtime'],
      runtimeProofCapsule: runtimeProofCapsule({
        command: 'node test/html-runtime/angular-framework-directive-claiming.mjs',
        probeId: 'html:framework-directive-boundary:html-framework-directive',
        evidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:angular-framework-directive-claiming',
        signals: ['html-framework-directive-runtime'],
        label: 'angular-framework-directive-claiming'
      }),
      browserRuntimeEquivalenceClaim: true
    }]
  },
  files: [{
    sourcePath: 'src/angular.html',
    baseSourceText: htmlAngularDirectiveBase,
    workerSourceText: htmlAngularDirectiveWorker,
    headSourceText: htmlAngularDirectiveBase
  }]
});

assert.equal(htmlAngularDirectiveClaimingProofProject.status, 'blocked');
assert.equal(htmlAngularDirectiveClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAngularDirectiveClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlAngularDirectiveClaimingProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlAngularDirectiveClaimingProofProject.conflicts.some((conflict) => conflict.code === 'html-runtime-proof-broad-claim'), true);
const htmlAngularDirectiveClaimingConflict = htmlAngularDirectiveClaimingProofProject.conflicts.find((conflict) => conflict.code === 'html-runtime-proof-broad-claim');
assert.equal(htmlAngularDirectiveClaimingConflict.details.proofGapCode, 'framework-directive-boundary');
assert.deepEqual(htmlAngularDirectiveClaimingConflict.details.boundaryAttributes, ['[(ngmodel)]']);

const htmlAngularDirectiveWrongOutputProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_angular_framework_directive_runtime_wrong_output_proof',
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
      sourceTexts: {
        base: htmlAngularDirectiveBase,
        worker: htmlAngularDirectiveWorker,
        head: htmlAngularDirectiveBase,
        output: htmlAngularDirectiveBase
      },
      runtimeCommand: 'node test/html-runtime/angular-framework-directive-wrong-output.mjs',
      runtimeProbeId: 'html:framework-directive-boundary:html-framework-directive',
      runtimeEvidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:angular-framework-directive-wrong-output',
      runtimeSignals: ['html-framework-directive-runtime']
    }]
  },
  files: [{
    sourcePath: 'src/angular.html',
    baseSourceText: htmlAngularDirectiveBase,
    workerSourceText: htmlAngularDirectiveWorker,
    headSourceText: htmlAngularDirectiveBase
  }]
});

assert.equal(htmlAngularDirectiveWrongOutputProofProject.status, 'blocked');
assert.equal(htmlAngularDirectiveWrongOutputProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAngularDirectiveWrongOutputProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlAngularDirectiveWrongOutputProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlAngularDirectiveWrongOutputProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'framework-directive-boundary'), true);

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
      sourceTexts: {
        base: htmlAngularDirectiveBase,
        worker: htmlAngularDirectiveWorker,
        head: htmlAngularDirectiveBase,
        output: htmlAngularDirectiveWorker
      },
      runtimeCommand: 'node test/html-runtime/angular-framework-directive.mjs',
      runtimeProbeId: 'html:framework-directive-boundary:html-framework-directive',
      runtimeEvidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:angular-framework-directive',
      runtimeSignals: ['html-framework-directive-runtime'],
      runtimeProofCapsule: runtimeProofCapsule({
        command: 'node test/html-runtime/angular-framework-directive.mjs',
        probeId: 'html:framework-directive-boundary:html-framework-directive',
        evidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:angular-framework-directive',
        signals: ['html-framework-directive-runtime'],
        label: 'angular-framework-directive'
      })
    }]
  },
  files: [{
    sourcePath: 'src/angular.html',
    baseSourceText: htmlAngularDirectiveBase,
    workerSourceText: htmlAngularDirectiveWorker,
    headSourceText: htmlAngularDirectiveBase
  }]
});

assert.equal(htmlAngularDirectiveProvenProject.status, 'merged');
assert.equal(htmlAngularDirectiveProvenProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlAngularDirectiveProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlAngularDirectiveProvenProject.files[0].admission.browserRuntimeEquivalenceClaim, true);
assert.deepEqual(htmlAngularDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes, ['[(ngmodel)]']);
assert.equal(htmlAngularDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeEvidenceBound, true);
assert.match(htmlAngularDirectiveProvenProject.outputFiles[0].sourceText, /draftName/);

const htmlAnchorBase = '<a data-frontier-key="docs" href="/docs">Docs</a>\n';
const htmlAnchorWorker = '<a data-frontier-key="docs" href="/docs/v2">Docs</a>\n';

const htmlAnchorClaimingProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_anchor_navigation_runtime_claiming_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/nav.html': [{
      id: 'html_anchor_navigation_claiming',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/nav.html',
      reasonCode: 'navigation-runtime-boundary',
      side: 'worker',
      boundary: 'html-anchor-navigation-runtime-attribute',
      boundaryAttributes: ['href'],
      sourceTexts: {
        base: htmlAnchorBase,
        worker: htmlAnchorWorker,
        head: htmlAnchorBase,
        output: htmlAnchorWorker
      },
      runtimeCommand: 'node test/html-runtime/anchor-navigation-claiming.mjs',
      runtimeProbeId: 'html:navigation-runtime-boundary:html-anchor-navigation-runtime-attribute',
      runtimeEvidenceHash: 'html-runtime-evidence:navigation-runtime-boundary:html-anchor-navigation-runtime-attribute:anchor-navigation-claiming',
      runtimeSignals: ['html-navigation-runtime'],
      runtimeProofCapsule: runtimeProofCapsule({
        command: 'node test/html-runtime/anchor-navigation-claiming.mjs',
        probeId: 'html:navigation-runtime-boundary:html-anchor-navigation-runtime-attribute',
        evidenceHash: 'html-runtime-evidence:navigation-runtime-boundary:html-anchor-navigation-runtime-attribute:anchor-navigation-claiming',
        signals: ['html-navigation-runtime'],
        label: 'anchor-navigation-claiming'
      }),
      browserRuntimeEquivalenceClaim: true
    }]
  },
  files: [{
    sourcePath: 'src/nav.html',
    baseSourceText: htmlAnchorBase,
    workerSourceText: htmlAnchorWorker,
    headSourceText: htmlAnchorBase
  }]
});

assert.equal(htmlAnchorClaimingProofProject.status, 'blocked');
assert.equal(htmlAnchorClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAnchorClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlAnchorClaimingProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlAnchorClaimingProofProject.files[0].result.admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlAnchorClaimingProofProject.conflicts.some((conflict) => conflict.code === 'html-runtime-proof-broad-claim'), true);
const htmlAnchorClaimingConflict = htmlAnchorClaimingProofProject.conflicts.find((conflict) => conflict.code === 'html-runtime-proof-broad-claim');
assert.equal(htmlAnchorClaimingConflict.details.proofGapCode, 'navigation-runtime-boundary');
assert.equal(htmlAnchorClaimingConflict.details.boundary, 'html-anchor-navigation-runtime-attribute');
assert.deepEqual(htmlAnchorClaimingConflict.details.boundaryAttributes, ['href']);
assert.equal(matrixSurface(htmlAnchorClaimingProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');
