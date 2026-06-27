import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';
import { htmlCssProjectMergeMatrixProofStatus } from '../../src/js-ts-safe-project-merge-html-css-matrix.js';

const sourcePath = 'src/anim.css';
const base = '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }\n.button { color: red; }\n';
const worker = base.replace('opacity: 1', 'opacity: .8');
const head = base.replace('color: red', 'color: blue');
const output = '@keyframes fade { from { opacity: 0; } to { opacity: .8; } }\n\n.button {\n  color: blue;\n}\n';

const preserved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_at_rule_preserved',
  files: [{
    sourcePath,
    baseSourceText: base,
    workerSourceText: head,
    headSourceText: base.replace('.button {', '.button { background-color: white;')
  }]
});
assert.equal(preserved.status, 'merged');
assert.equal(preserved.summary.cssMergedFiles, 1);
assert.match(preserved.outputFiles[0].sourceText, /@keyframes fade/);
assert.match(preserved.outputFiles[0].sourceText, /color: blue/);
assert.match(preserved.outputFiles[0].sourceText, /background-color: white/);

const unproved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_at_rule_unproved',
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: head }]
});
assert.equal(unproved.status, 'blocked');
assert.equal(unproved.summary.cssBlockedFiles, 1);
assert.equal(unproved.conflicts.some((item) => item.details.reasonCode === 'css-keyframes-runtime-equivalence-unproved'), true);

const proven = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_at_rule_proven',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      cssCascadeRuntimeProofs: [{
        id: 'proof_css_project_keyframes_runtime',
        kind: 'css-source-bound-cascade-runtime-proof',
        status: 'passed',
        sourcePath,
        reasonCode: 'css-keyframes-runtime-equivalence-unproved',
        side: 'worker',
        shapeKey: 'at-rule:keyframes::fade',
        baseSourceHash: hashSemanticValue(base),
        workerSourceHash: hashSemanticValue(worker),
        headSourceHash: hashSemanticValue(head),
        outputSourceHash: hashSemanticValue(output),
        runtimeCommand: 'playwright test css-project-keyframes-runtime.spec.ts',
        runtimeProbeId: 'css-project-keyframes-fade-probe',
        runtimeEvidenceHash: hashSemanticValue('src/anim.css keyframes project runtime evidence'),
        runtimeSignals: ['css-keyframes-runtime']
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: head }]
});
assert.equal(proven.status, 'merged');
assert.equal(proven.summary.cssMergedFiles, 1);
assert.equal(proven.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(proven.files[0].result.cascadeRuntimeProofs[0].runtimeEvidenceBound, true);
assert.equal(proven.outputFiles[0].sourceText, output);

const propertyPath = 'src/props.css';
const propertyBase = '@property --brand-hue { syntax: "<number>"; inherits: false; initial-value: 210; }\n.button { color: red; }\n';
const propertyWorker = propertyBase.replace('initial-value: 210', 'initial-value: 250');
const propertyHead = propertyBase.replace('color: red', 'color: blue');
const propertyOutput = '@property --brand-hue { syntax: "<number>"; inherits: false; initial-value: 250; }\n\n.button {\n  color: blue;\n}\n';
const propertyUnproved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_property_unproved',
  files: [{ sourcePath: propertyPath, baseSourceText: propertyBase, workerSourceText: propertyWorker, headSourceText: propertyHead }]
});
assert.equal(propertyUnproved.status, 'blocked');
assert.equal(propertyUnproved.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(propertyUnproved.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(propertyUnproved.summary.cssRuntimeDescriptorBlockedFiles, 0);
assert.equal(propertyUnproved.summary.cssPropertyDescriptorFiles, 1);
assert.equal(propertyUnproved.summary.cssPropertyDescriptorEvidenceFiles, 1);
assert.equal(propertyUnproved.summary.cssPageDescriptorFiles, 0);
assert.equal(propertyUnproved.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(propertyUnproved.conflicts.some((item) => item.details.reasonCode === 'css-property-runtime-equivalence-unproved'), true);
assert.equal(matrixSurface(propertyUnproved, 'css-runtime-descriptor-evidence').proofStatuses['css-runtime-descriptor-evidence'], 'passed');
const propertyProven = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_property_proven',
  cssMergeOptionsByPath: { [propertyPath]: { cssCascadeRuntimeProofs: [runtimeProof({ id: 'proof_css_project_property_runtime', sourcePath: propertyPath, reasonCode: 'css-property-runtime-equivalence-unproved', shapeKey: 'at-rule:property::--brand-hue', base: propertyBase, worker: propertyWorker, head: propertyHead, output: propertyOutput })] } },
  files: [{ sourcePath: propertyPath, baseSourceText: propertyBase, workerSourceText: propertyWorker, headSourceText: propertyHead }]
});
assert.equal(propertyProven.status, 'merged');
assert.equal(propertyProven.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(propertyProven.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(propertyProven.summary.cssPropertyDescriptorEvidenceFiles, 1);
assert.equal(propertyProven.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(propertyProven.files[0].result.cascadeRuntimeProofs[0].runtimeSignals.includes('css-property-registration-runtime'), true);
assert.equal(propertyProven.outputFiles[0].sourceText, propertyOutput);

const pagePath = 'src/print.css';
const pageBase = '@page chapter:left { margin: 1cm; @top-left { content: "Chapter"; } }\n.article { color: red; }\n';
const pageWorker = pageBase.replace('content: "Chapter"', 'content: "Appendix"');
const pageHead = pageBase.replace('color: red', 'color: blue');
const pageOutput = '@page chapter:left { margin: 1cm; @top-left { content: "Appendix"; } }\n\n.article {\n  color: blue;\n}\n';
const pageUnproved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_page_unproved',
  files: [{ sourcePath: pagePath, baseSourceText: pageBase, workerSourceText: pageWorker, headSourceText: pageHead }]
});
assert.equal(pageUnproved.status, 'blocked');
assert.equal(pageUnproved.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(pageUnproved.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(pageUnproved.summary.cssRuntimeDescriptorBlockedFiles, 0);
assert.equal(pageUnproved.summary.cssPropertyDescriptorFiles, 0);
assert.equal(pageUnproved.summary.cssPageDescriptorFiles, 1);
assert.equal(pageUnproved.summary.cssPageDescriptorEvidenceFiles, 1);
assert.equal(pageUnproved.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(pageUnproved.conflicts.some((item) => item.details.reasonCode === 'css-page-runtime-equivalence-unproved'), true);
assert.equal(matrixSurface(pageUnproved, 'css-runtime-descriptor-evidence').proofStatuses['css-runtime-descriptor-evidence'], 'passed');
assert.equal(matrixSurface(pageUnproved, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');
assert.equal(pageUnproved.files[0].result.dependencyGraphEvidence.pageDescriptors, 1);
assert.equal(pageUnproved.files[0].result.dependencyGraphEvidence.pageMarginDescriptors, 1);
assert.equal(pageUnproved.files[0].result.dependencyGraphEvidence.sides.base.records.pageMarginDescriptors[0].marginBox, '@top-left');
const pageProven = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_page_proven',
  cssMergeOptionsByPath: { [pagePath]: { cssCascadeRuntimeProofs: [runtimeProof({ id: 'proof_css_project_page_runtime', sourcePath: pagePath, reasonCode: 'css-page-runtime-equivalence-unproved', shapeKey: 'at-rule:page::chapter:left', base: pageBase, worker: pageWorker, head: pageHead, output: pageOutput })] } },
  files: [{ sourcePath: pagePath, baseSourceText: pageBase, workerSourceText: pageWorker, headSourceText: pageHead }]
});
assert.equal(pageProven.status, 'merged');
assert.equal(pageProven.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(pageProven.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(pageProven.summary.cssPageDescriptorEvidenceFiles, 1);
assert.equal(pageProven.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(pageProven.files[0].result.dependencyGraphEvidence.pageMarginDescriptors, 1);
assert.equal(pageProven.files[0].result.cascadeRuntimeProofs[0].runtimeSignals.includes('css-page-runtime'), true);
assert.equal(pageProven.outputFiles[0].sourceText, pageOutput);

const fontFacePath = 'src/fonts.css';
const fontFaceBase = '@font-face { font-family: "Inter"; src: url("./inter.woff2") format("woff2"); }\n.button { color: red; font-family: "Inter"; }\n';
const fontFaceWorker = fontFaceBase.replace('./inter.woff2', './inter-v2.woff2');
const fontFaceHead = fontFaceBase.replace('color: red', 'color: blue');
const fontFaceOutput = '@font-face { font-family: "Inter"; src: url("./inter-v2.woff2") format("woff2"); }\n\n.button {\n  color: blue;\n  font-family: "Inter";\n}\n';
const fontFaceUnproved = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_font_face_unproved',
  files: [{ sourcePath: fontFacePath, baseSourceText: fontFaceBase, workerSourceText: fontFaceWorker, headSourceText: fontFaceHead }]
});
assert.equal(fontFaceUnproved.status, 'blocked');
assert.equal(fontFaceUnproved.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(fontFaceUnproved.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(fontFaceUnproved.summary.cssRuntimeDescriptorBlockedFiles, 0);
assert.equal(fontFaceUnproved.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(fontFaceUnproved.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(fontFaceUnproved.conflicts.some((item) => item.details.reasonCode === 'css-font-face-runtime-equivalence-unproved'), true);
assert.equal(matrixSurface(fontFaceUnproved, 'css-runtime-descriptor-evidence').proofStatuses['css-runtime-descriptor-evidence'], 'passed');
assert.equal(matrixSurface(fontFaceUnproved, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');
assert.equal(matrixSurface(fontFaceUnproved, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');
assert.equal(fontFaceUnproved.files[0].result.browserCascadeEquivalenceClaim, false);
assert.equal(fontFaceUnproved.files[0].result.admission.browserCascadeEquivalenceClaim, false);
assert.equal(fontFaceUnproved.files[0].result.dependencyGraphEvidence.sides.base.records.fontFaces[0].family, 'Inter');
assert.equal(fontFaceUnproved.files[0].result.dependencyGraphEvidence.sides.base.records.urlAssetReferences[0].sourceKind, 'font-face-src');
assert.equal(fontFaceUnproved.files[0].result.candidateMergedSourceText, fontFaceOutput);
const fontFaceProven = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_font_face_proven',
  cssMergeOptionsByPath: { [fontFacePath]: { cssCascadeRuntimeProofs: [runtimeProof({ id: 'proof_css_project_font_face_runtime', sourcePath: fontFacePath, reasonCode: 'css-font-face-runtime-equivalence-unproved', shapeKey: 'at-rule:font-face::', base: fontFaceBase, worker: fontFaceWorker, head: fontFaceHead, output: fontFaceOutput })] } },
  files: [{ sourcePath: fontFacePath, baseSourceText: fontFaceBase, workerSourceText: fontFaceWorker, headSourceText: fontFaceHead }]
});
assert.equal(fontFaceProven.status, 'merged');
assert.equal(fontFaceProven.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(fontFaceProven.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(fontFaceProven.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(fontFaceProven.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(fontFaceProven.files[0].result.cascadeRuntimeProofs[0].runtimeSignals.includes('css-font-face-runtime'), true);
assert.equal(fontFaceProven.files[0].result.cascadeRuntimeProofs[0].browserRenderEquivalenceClaim, false);
assert.equal(fontFaceProven.outputFiles[0].sourceText, fontFaceOutput);

const forgedPropertyDescriptorSummary = htmlCssProjectSummary([{
  language: 'css',
  sourcePath: 'src/forged-property.css',
  status: 'merged',
  outputSourceText: '@property --brand-hue { syntax: "<number>"; inherits: false; initial-value: 210; }\n',
  result: {
    dependencyGraphEvidence: {
      kind: 'frontier.lang.cssDependencyGraphEvidence',
      propertyRegistrations: 1,
      propertyRegistrationDescriptors: 3,
      records: {
        propertyRegistrations: [{ kind: 'property-registration', name: '--brand-hue' }],
        propertyRegistrationDescriptors: [{ kind: 'property-registration-descriptor', name: '--brand-hue', descriptorName: 'syntax' }]
      }
    }
  }
}]);
assert.equal(forgedPropertyDescriptorSummary.cssRuntimeDescriptorFiles, 1);
assert.equal(forgedPropertyDescriptorSummary.cssPropertyDescriptorFiles, 1);
assert.equal(forgedPropertyDescriptorSummary.cssPropertyDescriptorEvidenceFiles, 0);
assert.equal(forgedPropertyDescriptorSummary.cssRuntimeDescriptorEvidenceFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-runtime-descriptor-evidence', forgedPropertyDescriptorSummary), 'missing');

const forgedPageDescriptorSummary = htmlCssProjectSummary([{
  language: 'css',
  sourcePath: 'src/forged-page.css',
  status: 'merged',
  outputSourceText: '@page chapter:left { margin: 1cm; @top-left { content: "Chapter"; } }\n',
  result: {
    dependencyGraphEvidence: {
      kind: 'frontier.lang.cssDependencyGraphEvidence',
      pageDescriptors: 1,
      pageMarginDescriptors: 1,
      records: {
        pageDescriptors: [{ kind: 'page-descriptor', pageSelector: 'chapter:left', property: 'margin' }],
        pageMarginDescriptors: [{ kind: 'page-margin-descriptor', marginBox: '@top-left', property: 'content' }]
      }
    }
  }
}]);
assert.equal(forgedPageDescriptorSummary.cssRuntimeDescriptorFiles, 1);
assert.equal(forgedPageDescriptorSummary.cssPageDescriptorFiles, 1);
assert.equal(forgedPageDescriptorSummary.cssPageDescriptorEvidenceFiles, 0);
assert.equal(forgedPageDescriptorSummary.cssRuntimeDescriptorEvidenceFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-runtime-descriptor-evidence', forgedPageDescriptorSummary), 'missing');

function runtimeProof({ id, sourcePath, reasonCode, shapeKey, base, worker, head, output }) {
  const runtimeSignal = runtimeSignalForReason(reasonCode);
  return { id, kind: 'css-source-bound-cascade-runtime-proof', status: 'passed', sourcePath, reasonCode, side: 'worker', shapeKey, baseSourceHash: hashSemanticValue(base), workerSourceHash: hashSemanticValue(worker), headSourceHash: hashSemanticValue(head), outputSourceHash: hashSemanticValue(output), runtimeCommand: 'playwright test css-project-runtime-at-rules.spec.ts', runtimeProbeId: `${shapeKey}:project-probe`, runtimeEvidenceHash: hashSemanticValue(`${sourcePath}:${reasonCode}:${shapeKey}:project-runtime`), runtimeSignals: [runtimeSignal] };
}

function runtimeSignalForReason(reasonCode) {
  if (reasonCode.includes('font-face')) return 'css-font-face-runtime';
  if (reasonCode.includes('property')) return 'css-property-registration-runtime';
  return 'css-page-runtime';
}

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
