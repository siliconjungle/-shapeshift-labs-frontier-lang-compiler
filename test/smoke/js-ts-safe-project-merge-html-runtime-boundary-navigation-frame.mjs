import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { runtimeEvidence } from './html-css-merge-test-helpers.mjs';

const htmlAnchorBase = '<a data-frontier-key="docs" href="/docs" target="_self">Docs</a>\n';
const htmlAnchorWorker = '<a data-frontier-key="docs" href="/docs/v2" target="_self">Docs</a>\n';
const htmlAnchorHead = '<a class="primary" data-frontier-key="docs" href="/docs" target="_self">Docs</a>\n';
const htmlAnchorOutput = '<a class="primary" data-frontier-key="docs" href="/docs/v2" target="_self">Docs</a>\n';
const htmlAnchorBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_anchor_navigation_runtime_block',
  files: [{ sourcePath: 'src/nav.html', baseSourceText: htmlAnchorBase, workerSourceText: htmlAnchorWorker, headSourceText: htmlAnchorHead }]
});
assert.equal(htmlAnchorBlockedProject.status, 'blocked');
assert.equal(htmlAnchorBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlAnchorBlockedProject.summary.htmlProofGapBlockedFiles, 1);
const htmlAnchorBlockedConflict = htmlAnchorBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'navigation-runtime-boundary');
assert.ok(htmlAnchorBlockedConflict);
assert.equal(htmlAnchorBlockedConflict.details.boundary, 'html-anchor-navigation-runtime-attribute');
assert.deepEqual(htmlAnchorBlockedConflict.details.boundaryAttributes, ['href']);
assert.match(htmlAnchorBlockedConflict.details.proofGap.nextProof, /htmlRuntimeBoundaryProofsByPath/);
assert.equal(htmlAnchorBlockedProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlAnchorSourceOnlyProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_anchor_navigation_runtime_source_only_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/nav.html': [{
      id: 'html_anchor_navigation_source_only',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/nav.html',
      reasonCode: 'navigation-runtime-boundary',
      side: 'worker',
      boundary: 'html-anchor-navigation-runtime-attribute',
      boundaryAttributes: ['href'],
      sourceTexts: { base: htmlAnchorBase, worker: htmlAnchorWorker, head: htmlAnchorHead, output: htmlAnchorOutput }
    }]
  },
  files: [{ sourcePath: 'src/nav.html', baseSourceText: htmlAnchorBase, workerSourceText: htmlAnchorWorker, headSourceText: htmlAnchorHead }]
});
assert.equal(htmlAnchorSourceOnlyProofProject.status, 'blocked');
assert.equal(htmlAnchorSourceOnlyProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAnchorSourceOnlyProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlAnchorSourceOnlyProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlAnchorProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_anchor_navigation_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/nav.html': [{
      id: 'html_anchor_navigation_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/nav.html',
      reasonCode: 'navigation-runtime-boundary',
      side: 'worker',
      boundary: 'html-anchor-navigation-runtime-attribute',
      boundaryAttributes: ['href'],
      sourceTexts: { base: htmlAnchorBase, worker: htmlAnchorWorker, head: htmlAnchorHead, output: htmlAnchorOutput },
      ...runtimeEvidence('navigation-runtime-boundary', 'html-anchor-navigation-runtime-attribute', 'anchor-navigation')
    }]
  },
  files: [{ sourcePath: 'src/nav.html', baseSourceText: htmlAnchorBase, workerSourceText: htmlAnchorWorker, headSourceText: htmlAnchorHead }]
});
assert.equal(htmlAnchorProvenProject.status, 'merged');
assert.equal(htmlAnchorProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlAnchorProvenProject.files[0].result.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlAnchorProvenProject.files[0].admission.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlAnchorProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-anchor-navigation-runtime-attribute');
assert.deepEqual(htmlAnchorProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes, ['href']);
assert.equal(htmlAnchorProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeSignals.includes('html-navigation-runtime'), true);
assert.match(htmlAnchorProvenProject.outputFiles[0].sourceText, /href="\/docs\/v2"/);

const htmlAreaBase = '<map name="nav"><area data-frontier-key="docs-area" href="/docs" alt="Docs"></map>\n';
const htmlAreaWorker = '<map name="nav"><area data-frontier-key="docs-area" href="/docs/v2" alt="Docs"></map>\n';
const htmlAreaHead = '<map class="site-map" name="nav"><area data-frontier-key="docs-area" href="/docs" alt="Docs"></map>\n';
const htmlAreaOutput = '<map class="site-map" name="nav"><area alt="Docs" data-frontier-key="docs-area" href="/docs/v2" /></map>\n';
const htmlAreaBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_area_navigation_runtime_block',
  files: [{ sourcePath: 'src/map.html', baseSourceText: htmlAreaBase, workerSourceText: htmlAreaWorker, headSourceText: htmlAreaHead }]
});
assert.equal(htmlAreaBlockedProject.status, 'blocked');
assert.equal(htmlAreaBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlAreaBlockedProject.summary.htmlProofGapBlockedFiles, 1);
const htmlAreaBlockedConflict = htmlAreaBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'navigation-runtime-boundary');
assert.ok(htmlAreaBlockedConflict);
assert.equal(htmlAreaBlockedConflict.details.boundary, 'html-area-navigation-runtime-attribute');
assert.deepEqual(htmlAreaBlockedConflict.details.boundaryAttributes, ['href']);
assert.equal(htmlAreaBlockedProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlAreaWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_area_navigation_runtime_wrong_boundary_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/map.html': [{
      id: 'html_area_navigation_wrong_boundary',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/map.html',
      reasonCode: 'navigation-runtime-boundary',
      side: 'worker',
      boundary: 'html-anchor-navigation-runtime-attribute',
      boundaryAttributes: ['href'],
      sourceTexts: { base: htmlAreaBase, worker: htmlAreaWorker, head: htmlAreaHead, output: htmlAreaOutput },
      ...runtimeEvidence('navigation-runtime-boundary', 'html-anchor-navigation-runtime-attribute', 'area-navigation-wrong-boundary')
    }]
  },
  files: [{ sourcePath: 'src/map.html', baseSourceText: htmlAreaBase, workerSourceText: htmlAreaWorker, headSourceText: htmlAreaHead }]
});
assert.equal(htmlAreaWrongProofProject.status, 'blocked');
assert.equal(htmlAreaWrongProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlAreaWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'navigation-runtime-boundary'), true);

const htmlAreaProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_area_navigation_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/map.html': [{
      id: 'html_area_navigation_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/map.html',
      reasonCode: 'navigation-runtime-boundary',
      side: 'worker',
      boundary: 'html-area-navigation-runtime-attribute',
      boundaryAttributes: ['href'],
      sourceTexts: { base: htmlAreaBase, worker: htmlAreaWorker, head: htmlAreaHead, output: htmlAreaOutput },
      ...runtimeEvidence('navigation-runtime-boundary', 'html-area-navigation-runtime-attribute', 'area-navigation')
    }]
  },
  files: [{ sourcePath: 'src/map.html', baseSourceText: htmlAreaBase, workerSourceText: htmlAreaWorker, headSourceText: htmlAreaHead }]
});
assert.equal(htmlAreaProvenProject.status, 'merged');
assert.equal(htmlAreaProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlAreaProvenProject.files[0].result.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlAreaProvenProject.files[0].admission.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlAreaProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-area-navigation-runtime-attribute');
assert.deepEqual(htmlAreaProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes, ['href']);
assert.equal(htmlAreaProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeSignals.includes('html-navigation-runtime'), true);
assert.match(htmlAreaProvenProject.outputFiles[0].sourceText, /href="\/docs\/v2"/);

const htmlIframeBase = '<iframe data-frontier-key="preview" src="/a.html" title="Preview"></iframe>\n';
const htmlIframeWorker = '<iframe data-frontier-key="preview" src="/b.html" title="Preview"></iframe>\n';
const htmlIframeHead = '<iframe class="embed" data-frontier-key="preview" src="/a.html" title="Preview"></iframe>\n';
const htmlIframeOutput = '<iframe class="embed" data-frontier-key="preview" src="/b.html" title="Preview"></iframe>\n';
const htmlIframeBlockedProject = safeMergeJsTsProject({ id: 'js_ts_safe_project_merge_html_iframe_runtime_block', files: [{ sourcePath: 'src/frame.html', baseSourceText: htmlIframeBase, workerSourceText: htmlIframeWorker, headSourceText: htmlIframeHead }] });
assert.equal(htmlIframeBlockedProject.status, 'blocked');
assert.equal(htmlIframeBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlIframeBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'iframe-runtime-boundary'), true);
assert.match(htmlIframeBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'iframe-runtime-boundary').details.proofGap.nextProof, /htmlRuntimeBoundaryProofsByPath/);
const htmlIframeProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_iframe_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: { 'src/frame.html': [{ id: 'html_iframe_runtime_source_bound', kind: 'html-source-bound-runtime-boundary-proof', status: 'passed', sourcePath: 'src/frame.html', reasonCode: 'iframe-runtime-boundary', side: 'worker', boundary: 'html-iframe-runtime-attribute', boundaryAttributes: ['src'], sourceTexts: { base: htmlIframeBase, worker: htmlIframeWorker, head: htmlIframeHead, output: htmlIframeOutput }, ...runtimeEvidence('iframe-runtime-boundary', 'html-iframe-runtime-attribute', 'iframe') }] },
  files: [{ sourcePath: 'src/frame.html', baseSourceText: htmlIframeBase, workerSourceText: htmlIframeWorker, headSourceText: htmlIframeHead }]
});
assert.equal(htmlIframeProvenProject.status, 'merged');
assert.equal(htmlIframeProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlIframeProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-iframe-runtime-attribute');
assert.match(htmlIframeProvenProject.outputFiles[0].sourceText, /src="\/b.html"/);

const htmlSrcdocBase = '<iframe data-frontier-key="preview" srcdoc="&lt;p&gt;A&lt;/p&gt;"></iframe>\n';
const htmlSrcdocWorker = '<iframe data-frontier-key="preview" srcdoc="&lt;p&gt;B&lt;/p&gt;"></iframe>\n';
const htmlSrcdocHead = '<iframe aria-label="Preview" data-frontier-key="preview" srcdoc="&lt;p&gt;A&lt;/p&gt;"></iframe>\n';
const htmlSrcdocOutput = '<iframe aria-label="Preview" data-frontier-key="preview" srcdoc="&lt;p&gt;B&lt;/p&gt;"></iframe>\n';
const htmlSrcdocBlockedProject = safeMergeJsTsProject({ id: 'js_ts_safe_project_merge_html_iframe_srcdoc_runtime_block', files: [{ sourcePath: 'src/srcdoc.html', baseSourceText: htmlSrcdocBase, workerSourceText: htmlSrcdocWorker, headSourceText: htmlSrcdocHead }] });
assert.equal(htmlSrcdocBlockedProject.status, 'blocked');
assert.equal(htmlSrcdocBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'iframe-srcdoc-runtime-boundary'), true);
const htmlSrcdocProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_iframe_srcdoc_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: { 'src/srcdoc.html': [{ id: 'html_iframe_srcdoc_source_bound', kind: 'html-source-bound-runtime-boundary-proof', status: 'passed', sourcePath: 'src/srcdoc.html', reasonCode: 'iframe-srcdoc-runtime-boundary', side: 'worker', boundary: 'html-iframe-srcdoc-attribute', boundaryAttributes: ['srcdoc'], sourceTexts: { base: htmlSrcdocBase, worker: htmlSrcdocWorker, head: htmlSrcdocHead, output: htmlSrcdocOutput }, ...runtimeEvidence('iframe-srcdoc-runtime-boundary', 'html-iframe-srcdoc-attribute', 'iframe-srcdoc') }] },
  files: [{ sourcePath: 'src/srcdoc.html', baseSourceText: htmlSrcdocBase, workerSourceText: htmlSrcdocWorker, headSourceText: htmlSrcdocHead }]
});
assert.equal(htmlSrcdocProvenProject.status, 'merged');
assert.equal(htmlSrcdocProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlSrcdocProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-iframe-srcdoc-attribute');
assert.match(htmlSrcdocProvenProject.outputFiles[0].sourceText, /srcdoc="&lt;p&gt;B&lt;\/p&gt;"/);
