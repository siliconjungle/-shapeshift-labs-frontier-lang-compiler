import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { runtimeEvidenceMetadataFromProof, runtimeProofBroadClaimFields, validateRuntimeProofAgainstProbe } from './js-ts-safe-project-merge-runtime-proof-capsule.js';

function guardCanvasProjectFileMerge({ file, input, context, result, base, worker, head }) {
  const output = result?.mergedSourceText;
  const surface = canvasRuntimeSurface({ base, worker, head, output, language: context.language });
  if (!surface) return undefined;
  const proof = validCanvasProof(input, file.sourcePath, surface, { base, worker, head, output });
  if (proof) return canvasProvenResult(result, proof, surface, file.sourcePath, { base, worker, head, output });
  const conflict = canvasConflict(file.sourcePath, surface.reasonCode, surface);
  return compactRecord({
    ...result,
    status: 'blocked',
    operation: 'blocked',
    conflicts: [...(result.conflicts ?? []), conflict],
    admission: blockedCanvasAdmission(result.admission, conflict),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    canvasRuntimeEquivalenceClaim: false
  });
}

function canvasRuntimeSurface({ base, worker, head, output, language }) {
  if (!isScriptLanguage(language) || typeof output !== 'string') return undefined;
  const baseFingerprint = canvasRuntimeFingerprint(base);
  const changedWorker = canvasRuntimeFingerprint(worker) !== baseFingerprint;
  const changedHead = canvasRuntimeFingerprint(head) !== baseFingerprint;
  const outputText = `${output}\n${changedWorker ? worker : ''}\n${changedHead ? head : ''}`;
  if (!changedWorker && !changedHead || !hasCanvasRuntimeText(outputText)) return undefined;
  const offscreen = hasOffscreenCanvasText(outputText);
  const drawing = hasCanvasDrawingText(outputText);
  if (!offscreen && !drawing) return undefined;
  const sides = uniqueStrings([changedWorker ? 'worker' : undefined, changedHead ? 'head' : undefined]);
  const requiredSignalGroups = offscreen ? [...CanvasDrawingSignalGroups, ...OffscreenCanvasSignalGroups] : CanvasDrawingSignalGroups;
  return compactRecord({
    boundary: offscreen ? 'canvas-offscreen-worker-boundary' : 'canvas-drawing-runtime-boundary',
    reasonCode: offscreen ? 'canvas-offscreen-worker-proof-missing' : 'canvas-drawing-runtime-proof-missing',
    sides,
    requiredSignalGroups,
    requiredRuntimeSignals: requiredSignalGroups.map((group) => group[0]),
    canvasDrawingSurface: drawing,
    offscreenCanvasSurface: offscreen
  });
}

function validCanvasProof(input, sourcePath, surface, binding) {
  return canvasProofCandidates(input, sourcePath)
    .map((proof) => canvasProofValidation(proof, sourcePath, surface, binding))
    .find((assessment) => assessment.ok);
}

function canvasProofValidation(proof, sourcePath, surface, binding) {
  if (!proof || typeof proof !== 'object') return { proof, ok: false, reasonCodes: ['canvas-runtime-proof-missing'] };
  const metadata = runtimeEvidenceMetadataFromProof(proof);
  const validation = validateRuntimeProofAgainstProbe(proof, {
    id: `canvas-runtime-proof#${sourcePath}`,
    sourcePath,
    sourceHashes: { base: hashText(binding.base), worker: hashText(binding.worker), head: hashText(binding.head), output: hashText(binding.output) },
    requiredSourceRoles: ['base', 'worker', 'head', 'output'],
    requiredSignals: surface.requiredRuntimeSignals,
    requireRuntimeProofCapsule: true,
    requireSourceBoundProof: true,
    rejectBroadClaims: true,
    requireTelemetryHash: true
  });
  const signals = canvasProofSignals(proof, metadata);
  const missingSignals = surface.requiredSignalGroups.filter((group) => !group.some((signal) => signals.includes(signal))).map((group) => group[0]);
  const broadClaimFields = runtimeProofBroadClaimFields(proof);
  const reasonCodes = uniqueStrings([...(validation.ok ? [] : validation.reasonCodes ?? []), ...missingSignals.map((signal) => `${signal}-missing`), ...(broadClaimFields.length ? ['canvas-runtime-proof-broad-claim'] : [])]);
  return { proof, metadata, ok: reasonCodes.length === 0, reasonCodes, broadClaimFields };
}

function canvasProofSignals(proof, metadata) {
  return uniqueStrings([
    ...asArray(metadata?.signals),
    ...asArray(proof.runtimeSignals),
    ...asArray(proof.signals),
    proof.deterministicInputHash || proof.inputSequenceHash ? 'canvas-deterministic-input' : undefined,
    proof.viewportDprHash || proof.viewportHash || proof.devicePixelRatioHash || proof.dprHash ? 'canvas-viewport-dpr' : undefined,
    proof.drawCommandTraceHash ? 'canvas-draw-command-trace' : undefined,
    proof.canvasBitmapHash || proof.bitmapHash || proof.perceptualDiffHash ? 'canvas-bitmap-proof' : undefined,
    proof.hitTestTraceHash || proof.pointerTraceHash ? 'canvas-hit-test-pointer' : undefined,
    proof.frameTimingHash || proof.frameBudgetHash ? 'canvas-frame-budget' : undefined,
    proof.accessibilitySnapshotHash || proof.fallbackSnapshotHash ? 'canvas-accessibility-fallback' : undefined,
    proof.offscreenWorkerProofHash || proof.workerTraceHash || proof.workerMessageTraceHash ? 'canvas-offscreen-worker-proof' : undefined
  ]);
}

function canvasProvenResult(result, assessment, surface, sourcePath, binding) {
  const record = canvasProofRecord(assessment, surface, sourcePath, binding);
  return compactRecord({
    ...result,
    canvasRuntimeProofs: [...(result.canvasRuntimeProofs ?? []), record],
    canvasRuntimeEquivalenceClaim: false,
    admission: compactRecord({
      ...(result.admission ?? {}),
      canvasRuntimeEquivalenceClaim: false,
      canvasRuntimeProofs: [...(result.admission?.canvasRuntimeProofs ?? []), record],
      reasonCodes: uniqueStrings([...(result.admission?.reasonCodes ?? []), 'canvas-runtime-proof-bound'])
    })
  });
}

function canvasProofRecord(assessment, surface, sourcePath, binding) {
  const { proof, metadata } = assessment;
  return compactRecord({
    id: proof.id,
    kind: proof.kind,
    status: 'passed',
    proofLevel: 'canvas-runtime-proof',
    sourcePath,
    boundary: surface.boundary,
    reasonCode: surface.reasonCode,
    sides: surface.sides,
    baseSourceHash: hashText(binding.base),
    workerSourceHash: hashText(binding.worker),
    headSourceHash: hashText(binding.head),
    outputSourceHash: hashText(binding.output),
    runtimeCommand: firstString(proof.runtimeCommand, proof.command, metadata?.command),
    runtimeProbeId: firstString(proof.runtimeProbeId, proof.probeId, metadata?.probeId),
    runtimeEvidenceHash: firstString(proof.runtimeEvidenceHash, proof.evidenceHash, metadata?.evidenceHash),
    runtimeSignals: canvasProofSignals(proof, metadata),
    runtimeProofCapsule: metadata?.capsule ?? proof.runtimeProofCapsule,
    runtimeProofCapsuleHash: proof.runtimeProofCapsuleHash ?? metadata?.capsule?.hash,
    runtimeTelemetryHash: proof.runtimeTelemetryHash ?? metadata?.capsule?.telemetryHash,
    requiredRuntimeSignals: surface.requiredRuntimeSignals,
    deterministicInputHash: proof.deterministicInputHash,
    inputSequenceHash: proof.inputSequenceHash,
    viewportDprHash: proof.viewportDprHash,
    viewportHash: proof.viewportHash,
    drawCommandTraceHash: proof.drawCommandTraceHash,
    canvasBitmapHash: proof.canvasBitmapHash ?? proof.bitmapHash,
    perceptualDiffHash: proof.perceptualDiffHash,
    hitTestTraceHash: proof.hitTestTraceHash,
    pointerTraceHash: proof.pointerTraceHash,
    frameTimingHash: proof.frameTimingHash,
    frameBudgetHash: proof.frameBudgetHash,
    accessibilitySnapshotHash: proof.accessibilitySnapshotHash,
    fallbackSnapshotHash: proof.fallbackSnapshotHash,
    offscreenWorkerProofHash: proof.offscreenWorkerProofHash,
    workerTraceHash: proof.workerTraceHash,
    workerMessageTraceHash: proof.workerMessageTraceHash,
    runtimeEvidenceBound: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    canvasRuntimeEquivalenceClaim: false
  });
}

function canvasConflict(sourcePath, reasonCode, surface) {
  return {
    code: reasonCode,
    gateId: 'canvas-runtime-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode,
      conflictKey: `canvas#${sourcePath}#${reasonCode}`,
      proofGap: {
        code: reasonCode,
        status: 'missing',
        proofLevel: 'canvas-runtime-proof',
        requiredSignalGroups: surface.requiredSignalGroups,
        nextProof: 'Attach canvasRuntimeProofsByPath[sourcePath] with source hashes, command, probe id, evidence hash, deterministic input, viewport/DPR, draw trace, bitmap/perceptual diff, hit-test/pointer, frame budget, accessibility/fallback, and OffscreenCanvas worker proof when applicable.',
        failClosed: true
      },
      canvasDrawingSurface: surface.canvasDrawingSurface,
      offscreenCanvasSurface: surface.offscreenCanvasSurface,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      browserRuntimeEquivalenceClaim: false,
      canvasRuntimeEquivalenceClaim: false
    })
  };
}

function blockedCanvasAdmission(admission = {}, conflict) {
  return compactRecord({
    ...admission,
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    canvasRuntimeEquivalenceClaim: false,
    reasonCodes: uniqueStrings([...(admission.reasonCodes ?? []), conflict.details?.reasonCode ?? conflict.code])
  });
}

function canvasProofCandidates(input, sourcePath) {
  return [
    input.canvasRuntimeProof,
    input.canvasRuntimeProofs,
    input.canvasRuntimeProofsByPath?.[sourcePath],
    input.canvasDrawingRuntimeProof,
    input.canvasDrawingRuntimeProofs,
    input.canvasDrawingRuntimeProofsByPath?.[sourcePath],
    input.canvasOffscreenWorkerProof,
    input.canvasOffscreenWorkerProofs,
    input.canvasOffscreenWorkerProofsByPath?.[sourcePath],
    input.sourceBoundRuntimeProofsByPath?.[sourcePath],
    input.browserRuntimeProofsByPath?.[sourcePath]
  ].flatMap(asArray).filter(Boolean);
}

function isScriptLanguage(language) { return ['javascript', 'typescript', 'jsx', 'tsx'].includes(String(language ?? '').toLowerCase()); }
function hasCanvasRuntimeText(text) { return hasCanvasDrawingText(text) || hasOffscreenCanvasText(text); }
function hasCanvasDrawingText(text) { return /\bCanvasRenderingContext2D\b|\bgetContext\s*\(|\b(?:drawImage|fillRect|strokeRect|clearRect|beginPath|arc|lineTo|moveTo|stroke|fill|getImageData|putImageData|isPointInPath)\s*\(/.test(String(text ?? '')); }
function hasOffscreenCanvasText(text) { return /\bOffscreenCanvas\b|\btransferControlToOffscreen\s*\(/.test(String(text ?? '')); }
function canvasRuntimeFingerprint(text) { return String(text ?? '').split(/\r?\n/).filter(hasCanvasRuntimeText).map((line) => line.trim()).join('\n'); }
function firstString(...values) { for (const value of values) if (typeof value === 'string' && value.length) return value; return undefined; }
function asArray(value) { return Array.isArray(value) ? value : value === undefined ? [] : [value]; }

const CanvasDrawingSignalGroups = [
  ['canvas-deterministic-input', 'deterministic-input'],
  ['canvas-viewport-dpr', 'viewport-dpr'],
  ['canvas-draw-command-trace', 'draw-command-trace'],
  ['canvas-bitmap-proof', 'canvas-bitmap-hash', 'perceptual-diff'],
  ['canvas-hit-test-pointer', 'hit-test-pointer'],
  ['canvas-frame-budget', 'frame-budget'],
  ['canvas-accessibility-fallback', 'accessibility-fallback']
];
const OffscreenCanvasSignalGroups = [['canvas-offscreen-worker-proof', 'offscreen-worker-proof']];

export { guardCanvasProjectFileMerge };
