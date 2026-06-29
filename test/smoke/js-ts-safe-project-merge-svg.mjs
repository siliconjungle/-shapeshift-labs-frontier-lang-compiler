import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { assertNoSvgEvidenceRuntimeClaims, sourceBoundSvgRuntimeProof, svgBase, svgHead, svgOutput, svgRuntimeProof, svgWorker } from './svg-merge-test-helpers.mjs';
const svgProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg',
  files: [{ sourcePath: 'src/icon.svg', baseSourceText: svgBase, workerSourceText: svgWorker, headSourceText: svgHead }]
});
assert.equal(svgProject.status, 'merged');
assert.equal(svgProject.summary.svgFiles, 1);
assert.equal(svgProject.summary.svgMergedFiles, 1);
assert.equal(svgProject.summary.svgParserEvidenceFiles, 1);
assert.equal(svgProject.summary.svgIdentityEvidenceFiles, 1);
assert.equal(svgProject.summary.svgExplicitIdentityEvidenceFiles, 1);
assert.equal(svgProject.summary.svgDuplicateIdentityEvidenceFiles, 0);
assert.equal(svgProject.summary.svgBrowserRuntimeProofs, 0);
assert.equal(svgProject.outputFiles[0].language, 'svg');
assert.equal(svgProject.outputFiles[0].operation, 'merged-svg-source');
assert.match(svgProject.outputFiles[0].sourceText, /role="img"/);
assert.match(svgProject.outputFiles[0].sourceText, /fill="red"/);
const svgParserEvidence = svgProject.files[0].result.svgParserEvidence;
assert.equal(svgParserEvidence.kind, 'frontier.lang.svgSafeMergeParserEvidence');
assert.equal(svgParserEvidence.parseErrors, 0);
assertNoSvgEvidenceRuntimeClaims(svgParserEvidence, 'svg parser evidence');
assert.equal(matrixSurface(svgProject, 'svg-parser-source-evidence').proofStatuses['svg-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(svgProject, 'svg-reference-graph-evidence').proofStatuses['svg-reference-graph'], 'passed');
assert.equal(matrixSurface(svgProject, 'svg-identity-evidence').proofStatuses['svg-identity-evidence'], 'passed');
assert.equal(matrixSurface(svgProject, 'svg-structural-merge-admission').proofStatuses['svg-structural-merge'], 'passed');
const svgRuntimeSurface = matrixSurface(svgProject, 'svg-browser-runtime-proof');
assert.equal(svgRuntimeSurface.proofStatuses['svg-browser-runtime-proof'], 'missing');
assert.equal(svgRuntimeSurface.missingRouteIds.includes('prove-svg-browser-runtime'), true);

const svgRuntimeProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_runtime_proof',
  svgRuntimeProofsByPath: { 'src/icon.svg': [svgRuntimeProof] },
  files: [{ sourcePath: 'src/icon.svg', baseSourceText: svgBase, workerSourceText: svgWorker, headSourceText: svgHead }]
});
assert.equal(svgRuntimeProofProject.status, 'merged');
assert.equal(svgRuntimeProofProject.summary.svgBrowserRuntimeProofs, 1);
assert.equal(svgRuntimeProofProject.files[0].result.svgRuntimeProofs[0].runtimeEvidenceBound, true);
assert.equal(matrixSurface(svgRuntimeProofProject, 'svg-browser-runtime-proof').proofStatuses['svg-browser-runtime-proof'], 'passed');

const svgReferenceBase = [
  '<svg id="icon" viewBox="0 0 10 10">',
  '  <defs><linearGradient id="paint"><stop offset="100%" stop-color="red" /></linearGradient></defs>',
  '  <rect id="box" fill="url(#paint)" width="10" height="10" />',
  '</svg>',
  ''
].join('\n');
const svgReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_reference_graph',
  files: [{
    sourcePath: 'src/reference-icon.svg',
    baseSourceText: svgReferenceBase,
    workerSourceText: svgReferenceBase.replace('width="10"', 'width="12"'),
    headSourceText: svgReferenceBase.replace('stop-color="red"', 'stop-color="blue"')
  }]
});
assert.equal(svgReferenceProject.status, 'merged');
assert.equal(svgReferenceProject.summary.svgReferenceGraphEvidenceFiles, 1);
assert.equal(svgReferenceProject.summary.svgReferenceGraphEvidenceFailedFiles, 0);
assert.equal(svgReferenceProject.summary.svgReferenceGraphDefinitionRecords >= 2, true);
assert.equal(svgReferenceProject.summary.svgReferenceGraphReferenceRecords >= 1, true);
assert.equal(svgReferenceProject.summary.svgReferenceGraphMissingReferenceRecords, 0);
assert.equal(svgReferenceProject.files[0].result.svgReferenceGraphEvidence.sides.output.missingReferenceRecords, 0);
assertNoSvgEvidenceRuntimeClaims(svgReferenceProject.files[0].result.svgReferenceGraphEvidence, 'svg reference graph evidence');
assert.equal(matrixSurface(svgReferenceProject, 'svg-reference-graph-evidence').proofStatuses['svg-reference-graph'], 'passed');

const svgReferenceBoundaryBase = [
  '<svg id="icon" viewBox="0 0 20 20">',
  '  <defs>',
  '    <symbol id="glyph"><path id="glyph-path" d="M0 0h10v10z" /></symbol>',
  '    <linearGradient id="paint"><stop offset="100%" stop-color="red" /></linearGradient>',
  '    <clipPath id="clip"><rect id="clip-rect" width="10" height="10" /></clipPath>',
  '    <mask id="mask"><rect id="mask-fill" width="20" height="20" fill="white" /></mask>',
  '    <filter id="shadow"><feDropShadow dx="1" dy="1" stdDeviation="1" /></filter>',
  '    <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2"><path d="M0 0L4 2L0 4z" /></marker>',
  '  </defs>',
  '  <use id="glyph-use" href="#glyph" fill="url(#paint)" clip-path="url(#clip)" mask="url(#mask)" filter="url(#shadow)" />',
  '  <path id="line" d="M0 10h20" marker-end="url(#arrow)" style="stroke:url(#paint)" />',
  '</svg>',
  ''
].join('\n');
const svgReferenceBoundaryProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_reference_graph_defs_runtime_resources',
  files: [{
    sourcePath: 'src/reference-boundaries.svg',
    baseSourceText: svgReferenceBoundaryBase,
    workerSourceText: svgReferenceBoundaryBase.replace('d="M0 10h20"', 'd="M0 11h20"'),
    headSourceText: svgReferenceBoundaryBase.replace('<svg id="icon"', '<svg id="icon" role="img"')
  }]
});
assert.equal(svgReferenceBoundaryProject.status, 'merged');
const svgReferenceBoundaryEvidence = svgReferenceBoundaryProject.files[0].result.svgReferenceGraphEvidence.sides.output;
const svgReferenceKinds = svgReferenceBoundaryEvidence.references.map((record) => record.referenceKind);
assert.equal(svgReferenceBoundaryEvidence.referenceRecords, 7);
assert.equal(svgReferenceBoundaryEvidence.localReferenceRecords, 7);
assert.equal(svgReferenceBoundaryEvidence.externalReferenceRecords, 0);
assert.equal(svgReferenceBoundaryEvidence.missingReferenceRecords, 0);
assert.equal(svgReferenceKinds.includes('svg-use-reference'), true);
assert.equal(svgReferenceKinds.includes('svg-paint-server-reference'), true);
assert.equal(svgReferenceKinds.includes('svg-render-resource-reference'), true);
assert.equal(svgReferenceKinds.includes('svg-marker-reference'), true);
assert.equal(svgReferenceKinds.includes('svg-url-reference'), true);

const svgStyleReferenceBase = [
  '<svg id="icon" viewBox="0 0 20 20">',
  '  <defs>',
  '    <linearGradient id="paint"><stop offset="100%" stop-color="red" /></linearGradient>',
  '    <filter id="shadow"><feDropShadow dx="1" dy="1" stdDeviation="1" /></filter>',
  '  </defs>',
  '  <style>.line{stroke:url(#paint);filter:url("#shadow");marker-start:url(https://example.com/markers.svg#arrow)}</style>',
  '  <path id="line" class="line" d="M0 10h20" />',
  '</svg>',
  ''
].join('\n');
const svgStyleReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_reference_graph_style_urls',
  files: [{
    sourcePath: 'src/style-reference.svg',
    baseSourceText: svgStyleReferenceBase,
    workerSourceText: svgStyleReferenceBase.replace('d="M0 10h20"', 'd="M0 11h20"'),
    headSourceText: svgStyleReferenceBase.replace('<svg id="icon"', '<svg id="icon" role="img"')
  }]
});
assert.equal(svgStyleReferenceProject.status, 'merged');
const svgStyleReferenceEvidence = svgStyleReferenceProject.files[0].result.svgReferenceGraphEvidence.sides.output;
assert.equal(svgStyleReferenceEvidence.localReferenceRecords, 2);
assert.equal(svgStyleReferenceEvidence.externalReferenceRecords, 1);
assert.equal(svgStyleReferenceEvidence.missingReferenceRecords, 0);
assert.equal(svgStyleReferenceEvidence.references.some((record) => record.referenceKind === 'svg-style-url-reference' && record.attributeName === 'style-content'), true);
assert.equal(svgStyleReferenceEvidence.references.some((record) => record.attributeName === 'style-content' && record.external === true && record.targetId === 'https://example.com/markers.svg#arrow'), true);

const missingReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_reference_graph_missing_target_blocked',
  files: [{
    sourcePath: 'src/missing-reference-icon.svg',
    baseSourceText: svgReferenceBase,
    workerSourceText: svgReferenceBase.replace('url(#paint)', 'url(#missingPaint)'),
    headSourceText: svgReferenceBase
  }]
});
assert.equal(missingReferenceProject.status, 'blocked');
assert.equal(missingReferenceProject.summary.svgReferenceGraphEvidenceFailedFiles, 1);
assert.equal(missingReferenceProject.summary.svgReferenceGraphMissingReferenceRecords, 1);
assert.equal(missingReferenceProject.conflicts.some((conflict) => conflict.code === 'svg-reference-graph-blocked' && conflict.details.reasonCodes.includes('svg-reference-target-missing')), true);
assert.equal(matrixSurface(missingReferenceProject, 'svg-reference-graph-evidence').proofStatuses['svg-reference-graph'], 'failed');

const missingStyleReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_reference_graph_missing_style_target_blocked',
  files: [{
    sourcePath: 'src/missing-style-reference-icon.svg',
    baseSourceText: svgStyleReferenceBase.replace('stroke:url(#paint)', 'stroke:url(#missingPaint)'),
    workerSourceText: svgStyleReferenceBase.replace('stroke:url(#paint)', 'stroke:url(#missingPaint)').replace('d="M0 10h20"', 'd="M0 11h20"'),
    headSourceText: svgStyleReferenceBase.replace('stroke:url(#paint)', 'stroke:url(#missingPaint)')
  }]
});
assert.equal(missingStyleReferenceProject.status, 'blocked');
assert.equal(missingStyleReferenceProject.summary.svgReferenceGraphEvidenceFailedFiles, 1);
assert.equal(missingStyleReferenceProject.conflicts.some((conflict) => conflict.code === 'svg-reference-graph-blocked' && conflict.details.reasonCodes.includes('svg-reference-target-missing')), true);
assert.equal(missingStyleReferenceProject.files[0].result.svgReferenceGraphEvidence.sides.output.missingReferences.some((record) => record.attributeName === 'style-content' && record.targetId === 'missingPaint'), true);

const svgRuntimeSensitiveCases = [
  {
    name: 'animate',
    reasonCode: 'svg-animation-runtime-boundary',
    base: '<svg id="icon"><rect id="box" width="10" height="10" /></svg>\n',
    worker: '<svg id="icon"><rect id="box" width="10" height="10"><animate attributeName="x" from="0" to="10" dur="1s" /></rect></svg>\n'
  },
  {
    name: 'set',
    reasonCode: 'svg-animation-runtime-boundary',
    base: '<svg id="icon"><rect id="box" fill="red" /></svg>\n',
    worker: '<svg id="icon"><rect id="box" fill="red"><set attributeName="fill" to="blue" begin="click" /></rect></svg>\n'
  },
  {
    name: 'animateTransform',
    reasonCode: 'svg-animation-runtime-boundary',
    base: '<svg id="icon"><rect id="box" /></svg>\n',
    worker: '<svg id="icon"><rect id="box"><animateTransform attributeName="transform" type="rotate" from="0" to="90" dur="1s" /></rect></svg>\n'
  },
  {
    name: 'animateMotion',
    reasonCode: 'svg-animation-runtime-boundary',
    base: '<svg id="icon"><circle id="dot" r="2" /></svg>\n',
    worker: '<svg id="icon"><circle id="dot" r="2"><animateMotion path="M0 0 L10 10" dur="1s" /></circle></svg>\n'
  },
  {
    name: 'foreignObject',
    reasonCode: 'svg-foreign-object-runtime-boundary',
    base: '<svg id="icon"><path id="glyph" d="M0 0h1v1z" /></svg>\n',
    worker: '<svg id="icon"><foreignObject><div>HTML</div></foreignObject><path id="glyph" d="M0 0h1v1z" /></svg>\n'
  },
  {
    name: 'pointer-events',
    reasonCode: 'svg-pointer-focus-runtime-boundary',
    base: '<svg id="icon"><rect id="box" pointer-events="none" /></svg>\n',
    worker: '<svg id="icon"><rect id="box" pointer-events="all" /></svg>\n'
  },
  {
    name: 'focusable',
    reasonCode: 'svg-pointer-focus-runtime-boundary',
    base: '<svg id="icon"><rect id="box" /></svg>\n',
    worker: '<svg id="icon"><rect id="box" focusable="true" /></svg>\n'
  },
  {
    name: 'tabindex',
    reasonCode: 'svg-pointer-focus-runtime-boundary',
    base: '<svg id="icon"><rect id="box" /></svg>\n',
    worker: '<svg id="icon"><rect id="box" tabindex="0" /></svg>\n'
  },
  {
    name: 'autofocus',
    reasonCode: 'svg-pointer-focus-runtime-boundary',
    base: '<svg id="icon"><rect id="box" /></svg>\n',
    worker: '<svg id="icon"><rect id="box" autofocus /></svg>\n'
  },
  {
    name: 'external-href',
    reasonCode: 'svg-external-href-runtime-boundary',
    base: '<svg id="icon"><use href="#glyph" /><symbol id="glyph" /></svg>\n',
    worker: '<svg id="icon"><use href="https://example.com/sprite.svg#glyph" /><symbol id="glyph" /></svg>\n'
  },
  {
    name: 'external-xlink-href',
    reasonCode: 'svg-external-href-runtime-boundary',
    base: '<svg id="icon"><use xlink:href="#glyph" /><symbol id="glyph" /></svg>\n',
    worker: '<svg id="icon"><use xlink:href="sprite.svg#glyph" /><symbol id="glyph" /></svg>\n'
  },
  {
    name: 'external-url-reference',
    reasonCode: 'svg-external-reference-runtime-boundary',
    base: '<svg id="icon"><defs><linearGradient id="paint"><stop offset="100%" stop-color="red" /></linearGradient></defs><rect id="box" fill="url(#paint)" /></svg>\n',
    worker: '<svg id="icon"><defs><linearGradient id="paint"><stop offset="100%" stop-color="red" /></linearGradient></defs><rect id="box" fill="url(https://example.com/paint.svg#paint)" /></svg>\n'
  }
];
for (const fixture of svgRuntimeSensitiveCases) {
  const project = safeMergeJsTsProject({
    id: `js_ts_safe_project_merge_svg_runtime_sensitive_${fixture.name}`,
    files: [{
      sourcePath: `src/${fixture.name}.svg`,
      baseSourceText: fixture.base,
      workerSourceText: fixture.worker,
      headSourceText: fixture.base
    }]
  });
  assert.equal(project.status, 'blocked', fixture.name);
  assert.equal(project.summary.svgBlockedFiles, 1, fixture.name);
  const conflict = project.conflicts.find((item) => item.code === 'svg-runtime-boundary-blocked');
  assert.ok(conflict, fixture.name);
  assert.equal(conflict.details.reasonCodes.includes(fixture.reasonCode), true, fixture.name);
  assert.equal(project.summary.svgProofGapBlockedFiles, 1, fixture.name);
  assert.equal(project.files[0].admission.browserRuntimeEquivalenceClaim, false, fixture.name);
  if (fixture.name === 'external-url-reference') {
    assert.equal(project.files[0].result.svgReferenceGraphEvidence.sides.output.externalReferenceRecords, 1, fixture.name);
    assert.equal(project.files[0].result.svgReferenceGraphEvidence.sides.output.missingReferenceRecords, 0, fixture.name);
  }
  assert.equal(matrixSurface(project, 'svg-structural-merge-admission').proofStatuses['svg-structural-merge'], 'failed', fixture.name);
}

const svgHtmlRuntimeSensitiveCases = [
  { name: 'script', reasonCode: 'script-runtime-boundary', base: '<svg id="icon"><rect id="box" /></svg>\n', worker: '<svg id="icon"><script>setup()</script><rect id="box" /></svg>\n' },
  { name: 'event-attribute', reasonCode: 'event-handler-runtime-boundary', base: '<svg id="icon"><rect id="box" /></svg>\n', worker: '<svg id="icon"><rect id="box" onclick="select()" /></svg>\n' },
  { name: 'style-attribute', reasonCode: 'inline-style-runtime-boundary', base: '<svg id="icon"><rect id="box" /></svg>\n', worker: '<svg id="icon"><rect id="box" style="fill:red" /></svg>\n' },
  { name: 'style-element', reasonCode: 'style-runtime-boundary', base: '<svg id="icon"><rect id="box" /></svg>\n', worker: '<svg id="icon"><style>.box{fill:red}</style><rect id="box" /></svg>\n' }
];
for (const fixture of svgHtmlRuntimeSensitiveCases) {
  const project = safeMergeJsTsProject({
    id: `js_ts_safe_project_merge_svg_html_runtime_sensitive_${fixture.name}`,
    files: [{
      sourcePath: `src/${fixture.name}.svg`,
      baseSourceText: fixture.base,
      workerSourceText: fixture.worker,
      headSourceText: fixture.base
    }]
  });
  assert.equal(project.status, 'blocked', fixture.name);
  assert.equal(project.summary.svgBlockedFiles, 1, fixture.name);
  assert.equal(project.summary.svgProofGapBlockedFiles, 1, fixture.name);
  assert.equal(project.conflicts.some((conflict) => conflict.code === 'html-proof-gap-blocked' && conflict.details?.reasonCode === fixture.reasonCode), true, fixture.name);
  assert.equal(project.files[0].admission.browserRuntimeEquivalenceClaim === true, false, fixture.name);
}

const svgAnimationBase = '<svg id="icon"><rect id="box" width="10" height="10" /></svg>\n';
const svgAnimationWorker = '<svg id="icon"><rect id="box" width="10" height="10"><animate attributeName="x" from="0" to="10" dur="1s" /></rect></svg>\n';
const svgAnimationRuntimeProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_animation_runtime_source_bound_proof',
  svgRuntimeProofsByPath: {
    'src/animated.svg': [sourceBoundSvgRuntimeProof({
      id: 'proof_svg_animation_runtime',
      sourcePath: 'src/animated.svg',
      base: svgAnimationBase,
      worker: svgAnimationWorker,
      head: svgAnimationBase,
      output: svgAnimationWorker
    })]
  },
  files: [{
    sourcePath: 'src/animated.svg',
    baseSourceText: svgAnimationBase,
    workerSourceText: svgAnimationWorker,
    headSourceText: svgAnimationBase
  }]
});
assert.equal(svgAnimationRuntimeProofProject.status, 'merged');
assert.equal(svgAnimationRuntimeProofProject.summary.svgBrowserRuntimeProofs, 1);
assert.equal(svgAnimationRuntimeProofProject.files[0].result.svgRuntimeBoundaryEvidence.status, 'passed');
assert.equal(svgAnimationRuntimeProofProject.files[0].result.svgRuntimeBoundaryEvidence.changedReasonCodes.includes('svg-animation-runtime-boundary'), true);
assert.match(svgAnimationRuntimeProofProject.outputFiles[0].sourceText, /<animate /);
