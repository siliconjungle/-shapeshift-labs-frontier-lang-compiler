import { assert } from './helpers.mjs';
import { createSemanticEditScript, createSemanticImportSidecar, importNativeSource } from './compiler-api.mjs';
import { effectTargetProofFields } from './runtime-order-proof-helpers.mjs';

const sourceText = [
  'export function routeWork(queue, state) {',
  '  if (state.ready) {',
  '    fetch(state.url);',
  '  }',
  '  return queue.length;',
  '}',
  ''
].join('\n');

const workerSourceText = sourceText
  .replace('fetch(state.url);', 'fetch(state.url, { cache: "reload" });');
const headSourceText = sourceText
  .replace('if (state.ready)', 'if (state.ready && !state.blocked)');

const blockedScript = createSemanticEditScript({
  id: 'semantic_runtime_executable_evidence_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  generatedAt: 301
});
const blockedOperation = runtimeOperation(blockedScript);
assert.equal(blockedScript.admission.status, 'conflict');
assert.equal(blockedOperation.status, 'conflict');
assert.equal(blockedOperation.reasonCodes.includes('runtime-order-sensitive-merge-requires-explicit-evidence'), true);
assert.equal(blockedOperation.reasonCodes.includes('control-flow-branch-merge-requires-condition-order-evidence'), true);

const booleanEvidenceScript = createSemanticEditScript({
  id: 'semantic_runtime_executable_evidence_boolean_rejected',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  runtimeOrderEvidence: true,
  generatedAt: 302
});
const booleanEvidenceOperation = runtimeOperation(booleanEvidenceScript);
assert.equal(booleanEvidenceScript.admission.status, 'conflict');
assert.equal(booleanEvidenceOperation.status, 'conflict');
assert.equal(booleanEvidenceOperation.reasonCodes.includes('runtime-order-explicit-evidence-structured-record-required'), true);

const statusOnlyScript = createSemanticEditScript({
  id: 'semantic_runtime_executable_evidence_status_only_rejected',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  runtimeOrderEvidence: { status: 'passed' },
  generatedAt: 303
});
const statusOnlyOperation = runtimeOperation(statusOnlyScript);
assert.equal(statusOnlyScript.admission.status, 'conflict');
assert.equal(statusOnlyOperation.status, 'conflict');
assert.equal(statusOnlyOperation.reasonCodes.includes('runtime-order-explicit-evidence-schema-missing'), true);
assert.equal(statusOnlyOperation.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);
assert.equal(statusOnlyOperation.reasonCodes.includes('runtime-order-explicit-evidence-region-identity-mismatch'), true);

const validEvidence = {
  id: 'runtime_order_evidence_route_work_network',
  schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
  status: 'passed',
  proofLevel: 'runtime-order-only',
  sourcePath: blockedOperation.anchor.sourcePath,
  baseSourceHash: blockedScript.baseHash,
  workerSourceHash: blockedScript.workerHash,
  headSourceHash: blockedScript.headHash,
  regionKey: blockedOperation.anchor.key,
  conflictKey: blockedOperation.anchor.conflictKey,
  regionKind: blockedOperation.anchor.regionKind,
  runtimeKind: 'network',
  signatureHash: blockedOperation.hashes.beforeSignatureHash,
  command: 'fixture-runtime-order-proof',
  traceHash: 'fixture-runtime-order-trace-hash',
  evidenceHash: 'fixture-runtime-order-proof-hash',
  ...effectTargetProofFields(runtimeRecordFromSource(workerSourceText, blockedOperation.anchor.key)),
  autoMergeClaim: false,
  semanticEquivalenceClaim: false,
  runtimeEquivalenceClaim: false
};

const admittedScript = createSemanticEditScript({
  id: 'semantic_runtime_executable_evidence_admitted',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  runtimeOrderEvidence: validEvidence,
  generatedAt: 304
});
const admittedOperation = runtimeOperation(admittedScript);
assert.equal(admittedScript.admission.status, 'auto-merge-candidate');
assert.equal(admittedScript.admission.autoMergeClaim, false);
assert.equal(admittedScript.admission.semanticEquivalenceClaim, false);
assert.equal(admittedOperation.status, 'portable');
assert.equal(admittedOperation.evidenceIds.includes(validEvidence.id), true);
assert.equal(admittedScript.admission.evidenceIds.includes(validEvidence.id), true);

const staleScript = createSemanticEditScript({
  id: 'semantic_runtime_executable_evidence_stale_rejected',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  runtimeOrderEvidence: { ...validEvidence, headSourceHash: 'sha256:stale-head-source' },
  generatedAt: 305
});
const staleOperation = runtimeOperation(staleScript);
assert.equal(staleScript.admission.status, 'conflict');
assert.equal(staleOperation.status, 'conflict');
assert.equal(staleOperation.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);

const missingEffectTargetTraceScript = createSemanticEditScript({
  id: 'semantic_runtime_effect_target_trace_missing',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  runtimeOrderEvidence: { ...validEvidence, effectTargetResolutionTraceHash: undefined },
  generatedAt: 306
});
const missingEffectTargetTraceOperation = runtimeOperation(missingEffectTargetTraceScript);
assert.equal(missingEffectTargetTraceScript.admission.status, 'conflict');
assert.equal(missingEffectTargetTraceOperation.reasonCodes.includes('runtime-order-explicit-evidence-effect-target-resolution-trace-missing'), true);

const missingEffectTargetHashScript = createSemanticEditScript({
  id: 'semantic_runtime_effect_target_hash_missing',
  language: 'typescript',
  sourcePath: 'src/runtime-executable-evidence.ts',
  baseSourceText: sourceText,
  workerSourceText,
  headSourceText,
  runtimeOrderEvidence: { ...validEvidence, effectTargetOrderHash: undefined },
  generatedAt: 307
});
const missingEffectTargetHashOperation = runtimeOperation(missingEffectTargetHashScript);
assert.equal(missingEffectTargetHashScript.admission.status, 'conflict');
assert.equal(missingEffectTargetHashOperation.reasonCodes.includes('runtime-order-explicit-evidence-effect-target-order-hash-missing'), true);

function runtimeOperation(script) {
  const operation = script.operations
    .find((candidate) => candidate.anchor.symbolName === 'routeWork:effect:network#1');
  assert.ok(operation, 'expected routeWork network-effect operation');
  return operation;
}

function runtimeRecordFromSource(sourceText, key) {
  const sidecar = createSemanticImportSidecar(importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime-executable-evidence.ts',
    sourceText
  }), { generatedAt: 308 });
  const record = sidecar.ownershipRegions.find((candidate) => candidate.key === key);
  assert.ok(record, `expected runtime record for ${key}`);
  return record;
}
