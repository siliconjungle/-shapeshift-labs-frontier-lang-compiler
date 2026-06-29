import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { runtimeProofCapsule } from './html-css-merge-test-helpers.mjs';

function sourceBoundProof({ id, sourcePath, reasonCode, side = 'worker', boundary, boundaryAttributes, base, worker, head, output }) {
  const command = `node test/html-runtime/${id}.mjs`;
  const probeId = `html:${reasonCode}:${boundary}`;
  const evidenceHash = `html-runtime-evidence:${reasonCode}:${boundary}:${id}`;
  const signals = runtimeSignals(reasonCode, boundary);
  return {
    id,
    kind: 'html-source-bound-runtime-boundary-proof',
    status: 'passed',
    sourcePath,
    reasonCode,
    side,
    boundary,
    boundaryAttributes,
    sourceTexts: { base, worker, head, output },
    runtimeCommand: command,
    runtimeProbeId: probeId,
    runtimeEvidenceHash: evidenceHash,
    runtimeSignals: signals,
    runtimeProofCapsule: runtimeProofCapsule({ command, probeId, evidenceHash, signals, label: id })
  };
}

function runtimeSignals(reasonCode, boundary) {
  const text = `${reasonCode ?? ''} ${boundary ?? ''}`.toLowerCase();
  if (text.includes('template')) return ['html-template-runtime'];
  if (text.includes('slot')) return ['html-slot-runtime'];
  if (text.includes('custom-element')) return ['html-custom-element-runtime'];
  if (text.includes('framework-directive')) return ['html-framework-directive-runtime'];
  return ['html-browser-runtime'];
}

const templateBase = '<template data-frontier-key="row"><span>A</span></template>\n';
const templateWorker = '<template data-frontier-key="row"><span>B</span></template>\n';
const templateBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_template_runtime_block',
  files: [{ sourcePath: 'src/template.html', baseSourceText: templateBase, workerSourceText: templateWorker, headSourceText: templateBase }]
});
assert.equal(templateBlockedProject.status, 'blocked');
assert.equal(templateBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
const templateBlockedConflict = templateBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'template-runtime-boundary');
assert.ok(templateBlockedConflict);
assert.equal(templateBlockedConflict.details.boundary, 'html-template-runtime');
assert.match(templateBlockedConflict.details.proofGap.nextProof, /html-template-runtime/);

const templateClaimingProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_template_runtime_claiming_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/template.html': [{
      ...sourceBoundProof({
        id: 'html_template_runtime_claiming',
        sourcePath: 'src/template.html',
        reasonCode: 'template-runtime-boundary',
        boundary: 'html-template-runtime',
        base: templateBase,
        worker: templateWorker,
        head: templateBase,
        output: templateWorker
      }),
      browserRuntimeEquivalenceClaim: true,
      semanticEquivalenceClaim: true
    }]
  },
  files: [{ sourcePath: 'src/template.html', baseSourceText: templateBase, workerSourceText: templateWorker, headSourceText: templateBase }]
});
assert.equal(templateClaimingProofProject.status, 'blocked');
assert.equal(templateClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(templateClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(templateClaimingProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(templateClaimingProofProject.conflicts.some((conflict) => conflict.code === 'html-runtime-proof-broad-claim'), true);
assert.equal(templateClaimingProofProject.conflicts.find((conflict) => conflict.code === 'html-runtime-proof-broad-claim').details.proofGapCode, 'template-runtime-boundary');

const templateProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_template_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/template.html': [sourceBoundProof({
      id: 'html_template_runtime_source_bound',
      sourcePath: 'src/template.html',
      reasonCode: 'template-runtime-boundary',
      boundary: 'html-template-runtime',
      base: templateBase,
      worker: templateWorker,
      head: templateBase,
      output: templateWorker
    })]
  },
  files: [{ sourcePath: 'src/template.html', baseSourceText: templateBase, workerSourceText: templateWorker, headSourceText: templateBase }]
});
assert.equal(templateProvenProject.status, 'merged');
assert.equal(templateProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(templateProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-template-runtime');
assert.match(templateProvenProject.outputFiles[0].sourceText, /<span>B<\/span>/);

const slotBase = '<slot data-frontier-key="main-slot" name="summary"></slot>\n';
const slotWorker = '<slot data-frontier-key="main-slot" name="details"></slot>\n';
const slotWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_slot_runtime_wrong_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/slot.html': [sourceBoundProof({
      id: 'html_slot_runtime_wrong_boundary',
      sourcePath: 'src/slot.html',
      reasonCode: 'slot-runtime-boundary',
      boundary: 'html-template-runtime',
      base: slotBase,
      worker: slotWorker,
      head: slotBase,
      output: slotWorker
    })]
  },
  files: [{ sourcePath: 'src/slot.html', baseSourceText: slotBase, workerSourceText: slotWorker, headSourceText: slotBase }]
});
assert.equal(slotWrongProofProject.status, 'blocked');
assert.equal(slotWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'slot-runtime-boundary'), true);

const slotProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_slot_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/slot.html': [sourceBoundProof({
      id: 'html_slot_runtime_source_bound',
      sourcePath: 'src/slot.html',
      reasonCode: 'slot-runtime-boundary',
      boundary: 'html-slot-runtime',
      base: slotBase,
      worker: slotWorker,
      head: slotBase,
      output: slotWorker
    })]
  },
  files: [{ sourcePath: 'src/slot.html', baseSourceText: slotBase, workerSourceText: slotWorker, headSourceText: slotBase }]
});
assert.equal(slotProvenProject.status, 'merged');
assert.equal(slotProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(slotProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-slot-runtime');
assert.match(slotProvenProject.outputFiles[0].sourceText, /name="details"/);

const customBase = '<x-card data-frontier-key="card">A</x-card>\n';
const customWorker = '<x-card data-frontier-key="card">B</x-card>\n';
const customBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_custom_element_runtime_block',
  files: [{ sourcePath: 'src/custom.html', baseSourceText: customBase, workerSourceText: customWorker, headSourceText: customBase }]
});
assert.equal(customBlockedProject.status, 'blocked');
const customBlockedConflict = customBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'custom-element-runtime-boundary');
assert.ok(customBlockedConflict);
assert.equal(customBlockedConflict.details.boundary, 'html-custom-element-runtime');
assert.match(customBlockedConflict.details.proofGap.nextProof, /html-custom-element-runtime/);

const customProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_custom_element_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/custom.html': [sourceBoundProof({
      id: 'html_custom_element_runtime_source_bound',
      sourcePath: 'src/custom.html',
      reasonCode: 'custom-element-runtime-boundary',
      boundary: 'html-custom-element-runtime',
      base: customBase,
      worker: customWorker,
      head: customBase,
      output: customWorker
    })]
  },
  files: [{ sourcePath: 'src/custom.html', baseSourceText: customBase, workerSourceText: customWorker, headSourceText: customBase }]
});
assert.equal(customProvenProject.status, 'merged');
assert.equal(customProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(customProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-custom-element-runtime');
assert.match(customProvenProject.outputFiles[0].sourceText, />B</);

const directiveBase = '<div data-frontier-key="panel" :class="oldClass">Panel</div>\n';
const directiveWorker = '<div data-frontier-key="panel" :class="nextClass">Panel</div>\n';
const directiveBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_framework_directive_runtime_block',
  files: [{ sourcePath: 'src/directive.html', baseSourceText: directiveBase, workerSourceText: directiveWorker, headSourceText: directiveBase }]
});
assert.equal(directiveBlockedProject.status, 'blocked');
const directiveBlockedConflict = directiveBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'framework-directive-boundary');
assert.ok(directiveBlockedConflict);
assert.equal(directiveBlockedConflict.details.boundary, 'html-framework-directive');
assert.equal(directiveBlockedConflict.details.attributeName, ':class');
assert.match(directiveBlockedConflict.details.proofGap.nextProof, /boundaryAttributes/);

const directiveWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_framework_directive_wrong_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/directive.html': [sourceBoundProof({
      id: 'html_framework_directive_wrong_attribute',
      sourcePath: 'src/directive.html',
      reasonCode: 'framework-directive-boundary',
      boundary: 'html-framework-directive',
      boundaryAttributes: ['@click'],
      base: directiveBase,
      worker: directiveWorker,
      head: directiveBase,
      output: directiveWorker
    })]
  },
  files: [{ sourcePath: 'src/directive.html', baseSourceText: directiveBase, workerSourceText: directiveWorker, headSourceText: directiveBase }]
});
assert.equal(directiveWrongProofProject.status, 'blocked');
assert.equal(directiveWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'framework-directive-boundary'), true);

const directiveProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_framework_directive_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/directive.html': [sourceBoundProof({
      id: 'html_framework_directive_source_bound',
      sourcePath: 'src/directive.html',
      reasonCode: 'framework-directive-boundary',
      boundary: 'html-framework-directive',
      boundaryAttributes: [':class'],
      base: directiveBase,
      worker: directiveWorker,
      head: directiveBase,
      output: directiveWorker
    })]
  },
  files: [{ sourcePath: 'src/directive.html', baseSourceText: directiveBase, workerSourceText: directiveWorker, headSourceText: directiveBase }]
});
assert.equal(directiveProvenProject.status, 'merged');
assert.equal(directiveProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(directiveProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-framework-directive');
assert.equal(directiveProvenProject.files[0].result.htmlRuntimeProofs[0].attributeName, ':class');
assert.match(directiveProvenProject.outputFiles[0].sourceText, /nextClass/);
