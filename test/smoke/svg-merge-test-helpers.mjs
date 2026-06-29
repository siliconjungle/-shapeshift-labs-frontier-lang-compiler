import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { runtimeProofCapsule } from './html-css-merge-test-helpers.mjs';

const SvgEvidenceClaimFields = [
  'autoMergeClaim',
  'semanticEquivalenceClaim',
  'runtimeEquivalenceClaim',
  'renderEquivalenceClaim',
  'browserRuntimeEquivalenceClaim',
  'browserRenderEquivalenceClaim'
];

const svgBase = '<svg id="icon" viewBox="0 0 10 10"><path id="glyph" d="M0 0h10v10z" /></svg>\n';
const svgWorker = '<svg id="icon" viewBox="0 0 10 10" role="img"><path id="glyph" d="M0 0h10v10z" /></svg>\n';
const svgHead = '<svg id="icon" viewBox="0 0 10 10"><path id="glyph" d="M0 0h10v10z" fill="red" /></svg>\n';
const svgOutput = '<svg id="icon" role="img" viewBox="0 0 10 10"><path id="glyph" d="M0 0h10v10z" fill="red" /></svg>\n';
const svgRuntimeProof = sourceBoundSvgRuntimeProof({
  id: 'proof_svg_icon_runtime',
  sourcePath: 'src/icon.svg',
  base: svgBase,
  worker: svgWorker,
  head: svgHead,
  output: svgOutput
});

function assertNoSvgEvidenceRuntimeClaims(evidence, label) {
  for (const field of SvgEvidenceClaimFields) assert.equal(evidence[field], false, `${label} ${field}`);
  for (const [sideName, side] of Object.entries(evidence.sides ?? {})) {
    for (const field of SvgEvidenceClaimFields) assert.equal(side[field], false, `${label} ${sideName} ${field}`);
  }
}

function sourceBoundSvgRuntimeProof({ id, sourcePath, base, worker, head, output }) {
  const command = 'playwright test svg-runtime-proof.spec.ts --project=chromium';
  const probeId = `${id}_probe`;
  const evidenceHash = `${id}_evidence`;
  const signals = ['svg-browser-runtime'];
  return {
    kind: 'frontier.runtime-proof.source-bound-proof',
    version: 1,
    id,
    status: 'passed',
    sourcePath,
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    outputSourceHash: hashSemanticValue(output),
    runtimeCommand: command,
    runtimeProbeId: probeId,
    runtimeEvidenceHash: evidenceHash,
    runtimeSignals: signals,
    runtimeProofCapsule: runtimeProofCapsule({ command, probeId, evidenceHash, signals, label: id }),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false
  };
}

export {
  assertNoSvgEvidenceRuntimeClaims,
  sourceBoundSvgRuntimeProof,
  svgBase,
  svgHead,
  svgOutput,
  svgRuntimeProof,
  svgWorker
};
