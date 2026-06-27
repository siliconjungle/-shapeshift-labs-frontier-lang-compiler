import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

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
const pageBase = '@page { margin: 1cm; }\n.article { color: red; }\n';
const pageWorker = pageBase.replace('margin: 1cm', 'margin: 0.75cm');
const pageHead = pageBase.replace('color: red', 'color: blue');
const pageOutput = '@page { margin: 0.75cm; }\n\n.article {\n  color: blue;\n}\n';
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
const pageProven = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_page_proven',
  cssMergeOptionsByPath: { [pagePath]: { cssCascadeRuntimeProofs: [runtimeProof({ id: 'proof_css_project_page_runtime', sourcePath: pagePath, reasonCode: 'css-page-runtime-equivalence-unproved', shapeKey: 'at-rule:page::', base: pageBase, worker: pageWorker, head: pageHead, output: pageOutput })] } },
  files: [{ sourcePath: pagePath, baseSourceText: pageBase, workerSourceText: pageWorker, headSourceText: pageHead }]
});
assert.equal(pageProven.status, 'merged');
assert.equal(pageProven.summary.cssRuntimeDescriptorFiles, 1);
assert.equal(pageProven.summary.cssRuntimeDescriptorEvidenceFiles, 1);
assert.equal(pageProven.summary.cssPageDescriptorEvidenceFiles, 1);
assert.equal(pageProven.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(pageProven.files[0].result.cascadeRuntimeProofs[0].runtimeSignals.includes('css-page-runtime'), true);
assert.equal(pageProven.outputFiles[0].sourceText, pageOutput);

function runtimeProof({ id, sourcePath, reasonCode, shapeKey, base, worker, head, output }) {
  const runtimeSignal = reasonCode.includes('property') ? 'css-property-registration-runtime' : 'css-page-runtime';
  return { id, kind: 'css-source-bound-cascade-runtime-proof', status: 'passed', sourcePath, reasonCode, side: 'worker', shapeKey, baseSourceHash: hashSemanticValue(base), workerSourceHash: hashSemanticValue(worker), headSourceHash: hashSemanticValue(head), outputSourceHash: hashSemanticValue(output), runtimeCommand: 'playwright test css-project-runtime-at-rules.spec.ts', runtimeProbeId: `${shapeKey}:project-probe`, runtimeEvidenceHash: hashSemanticValue(`${sourcePath}:${reasonCode}:${shapeKey}:project-runtime`), runtimeSignals: [runtimeSignal] };
}

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
