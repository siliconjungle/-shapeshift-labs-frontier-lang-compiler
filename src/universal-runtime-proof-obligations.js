import {
  idFragment,
  uniqueStrings
} from './native-import-utils.js';

export const UniversalRuntimeProofSignalKinds = Object.freeze([
  'source-hash',
  'target-hash',
  'runtime-command',
  'probe-id',
  'telemetry-hash',
  'event-trace-hash',
  'network-trace-hash',
  'storage-snapshot-hash',
  'filesystem-trace-hash',
  'process-trace-hash',
  'environment-snapshot-hash',
  'shell-policy',
  'secret-scope-policy',
  'dom-snapshot-hash',
  'computed-style-hash',
  'layout-snapshot-hash',
  'accessibility-snapshot-hash',
  'focus-trace-hash',
  'bitmap-hash',
  'draw-command-trace-hash',
  'gpu-command-trace-hash',
  'wasm-module-hash',
  'sandbox-policy-hash',
  'worker-message-trace-hash',
  'deterministic-input-hash',
  'adapter-binding-hash'
]);

const baseSignals = ['source-hash', 'target-hash', 'runtime-command', 'probe-id', 'telemetry-hash', 'adapter-binding-hash'];
const capabilitySignals = Object.freeze({
  network: [...baseSignals, 'network-trace-hash'],
  fetch: [...baseSignals, 'network-trace-hash'],
  timers: [...baseSignals, 'event-trace-hash', 'deterministic-input-hash'],
  clock: [...baseSignals, 'event-trace-hash', 'deterministic-input-hash'],
  randomness: [...baseSignals, 'deterministic-input-hash'],
  crypto: [...baseSignals, 'deterministic-input-hash'],
  storage: [...baseSignals, 'storage-snapshot-hash'],
  database: [...baseSignals, 'storage-snapshot-hash'],
  filesystem: [...baseSignals, 'filesystem-trace-hash'],
  process: [...baseSignals, 'process-trace-hash'],
  environment: [...baseSignals, 'environment-snapshot-hash'],
  shell: [...baseSignals, 'process-trace-hash', 'shell-policy'],
  threading: [...baseSignals, 'event-trace-hash', 'worker-message-trace-hash'],
  dom: [...baseSignals, 'dom-snapshot-hash', 'event-trace-hash'],
  clipboard: [...baseSignals, 'event-trace-hash'],
  canvas: [...baseSignals, 'draw-command-trace-hash', 'bitmap-hash', 'deterministic-input-hash'],
  gpu: [...baseSignals, 'gpu-command-trace-hash', 'bitmap-hash', 'deterministic-input-hash'],
  wasm: [...baseSignals, 'wasm-module-hash', 'event-trace-hash'],
  sandbox: [...baseSignals, 'sandbox-policy-hash'],
  secrets: [...baseSignals, 'secret-scope-policy'],
  async: [...baseSignals, 'event-trace-hash'],
  ffi: [...baseSignals, 'process-trace-hash', 'adapter-binding-hash']
});

export function runtimeProofSignalsForCapability(capability) {
  return uniqueStrings(capabilitySignals[capability] ?? baseSignals);
}

export function createUniversalRuntimeProofObligation(input = {}) {
  const adapterRequirement = input.adapterRequirement ?? {};
  const capability = input.capability ?? adapterRequirement.capability;
  const requiredSignals = uniqueStrings(input.requiredSignals ?? runtimeProofSignalsForCapability(capability));
  const evidence = scopedRuntimeProofEvidence(input.evidence ?? input.routeEvidence ?? [], input, capability, adapterRequirement);
  const providedSignals = uniqueStrings(input.providedSignals ?? signalsFromEvidence(evidence));
  const missingSignals = requiredSignals.filter((signal) => !providedSignals.includes(signal));
  const blockers = uniqueStrings(input.blockers ?? []);
  const status = !capability ? 'not-applicable' : blockers.length ? 'blocked' : missingSignals.length ? 'needs-evidence' : 'satisfied';
  return {
    kind: 'frontier.lang.universalRuntimeProofObligation',
    version: 1,
    schema: 'frontier.lang.universalRuntimeProofObligation.v1',
    id: input.id ?? `runtime_proof_${idFragment(input.sourceHost ?? adapterRequirement.sourceHost)}_${idFragment(input.targetHost ?? adapterRequirement.targetHost)}_${idFragment(capability)}`,
    capability,
    adapterRequirementId: adapterRequirement.id,
    adapterKind: input.adapterKind ?? adapterRequirement.adapterKind,
    sourceHost: input.sourceHost ?? adapterRequirement.sourceHost,
    targetHost: input.targetHost ?? adapterRequirement.targetHost,
    status,
    action: runtimeProofAction(status),
    requiredSignals,
    providedSignals,
    missingSignals,
    missingEvidence: missingSignals.map((signal) => `runtime-proof-signal:${signal}`),
    blockers,
    review: uniqueStrings([
      ...(missingSignals.length ? [`Runtime proof for ${capability} is missing signals: ${missingSignals.join(', ')}.`] : []),
      ...(input.review ?? [])
    ]),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...evidence.map((record) => record?.id).filter(Boolean)]),
    claims: {
      runtimeEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      autoMergeClaim: false
    }
  };
}

export function createUniversalRuntimeProofObligationsForRoute(route = {}, evidence = []) {
  return (route.adapterRequirements ?? []).map((adapterRequirement) => createUniversalRuntimeProofObligation({
    adapterRequirement,
    evidence,
    sourceHost: route.source?.id ?? adapterRequirement.sourceHost,
    targetHost: route.target?.id ?? adapterRequirement.targetHost
  }));
}

export function runtimeProofObligationMatches(obligation = {}, query = {}) {
  return match(query.runtimeProofObligationId, [obligation.id])
    && match(query.runtimeProofCapability, [obligation.capability])
    && match(query.runtimeProofStatus, [obligation.status])
    && match(query.runtimeProofMissingSignal, obligation.missingSignals)
    && match(query.runtimeProofRequiredSignal, obligation.requiredSignals)
    && match(query.runtimeProofProvidedSignal, obligation.providedSignals);
}

export function summarizeRuntimeProofObligations(obligations = []) {
  return {
    obligations: obligations.length,
    byStatus: countBy(obligations.map((obligation) => obligation.status)),
    byCapability: countBy(obligations.map((obligation) => obligation.capability)),
    requiredSignals: countBy(obligations.flatMap((obligation) => obligation.requiredSignals ?? [])),
    missingSignals: countBy(obligations.flatMap((obligation) => obligation.missingSignals ?? [])),
    providedSignals: countBy(obligations.flatMap((obligation) => obligation.providedSignals ?? []))
  };
}

function signalsFromEvidence(evidence) {
  return uniqueStrings((evidence ?? []).flatMap((record) => [
    ...(record?.runtimeProofSignals ?? []),
    ...(record?.proofSignals ?? []),
    ...(record?.signals ?? []),
    ...Object.entries({
      'source-hash': record?.sourceHash,
      'target-hash': record?.targetHash ?? record?.outputHash,
      'runtime-command': record?.command ?? record?.runtimeCommand,
      'probe-id': record?.probeId,
      'telemetry-hash': record?.telemetryHash,
      'event-trace-hash': record?.eventTraceHash,
      'network-trace-hash': record?.networkTraceHash,
      'storage-snapshot-hash': record?.storageSnapshotHash,
      'filesystem-trace-hash': record?.filesystemTraceHash,
      'process-trace-hash': record?.processTraceHash,
      'environment-snapshot-hash': record?.environmentSnapshotHash,
      'shell-policy': record?.shellPolicyHash ?? record?.shellPolicy,
      'secret-scope-policy': record?.secretScopePolicyHash ?? record?.secretScopePolicy,
      'dom-snapshot-hash': record?.domSnapshotHash,
      'computed-style-hash': record?.computedStyleHash,
      'layout-snapshot-hash': record?.layoutSnapshotHash,
      'accessibility-snapshot-hash': record?.accessibilitySnapshotHash,
      'focus-trace-hash': record?.focusTraceHash,
      'bitmap-hash': record?.bitmapHash,
      'draw-command-trace-hash': record?.drawCommandTraceHash,
      'gpu-command-trace-hash': record?.gpuCommandTraceHash,
      'wasm-module-hash': record?.wasmModuleHash,
      'sandbox-policy-hash': record?.sandboxPolicyHash,
      'worker-message-trace-hash': record?.workerMessageTraceHash,
      'deterministic-input-hash': record?.deterministicInputHash,
      'adapter-binding-hash': record?.adapterBindingHash
    }).filter(([, value]) => value).map(([signal]) => signal)
  ]));
}

function scopedRuntimeProofEvidence(records, input, capability, adapterRequirement) {
  return (records ?? []).filter((record) => runtimeProofEvidenceMatches(record, input, capability, adapterRequirement));
}

function runtimeProofEvidenceMatches(record, input, capability, adapterRequirement) {
  if (!passedRuntimeProofEvidence(record)) return false;
  const adapterId = adapterRequirement?.id;
  const sourceHost = input.sourceHost ?? adapterRequirement?.sourceHost;
  const targetHost = input.targetHost ?? adapterRequirement?.targetHost;
  const capabilityMatches = [record?.capability, record?.runtimeCapability, record?.runtimeProofCapability].filter(Boolean).includes(capability);
  const adapterMatches = [record?.adapterRequirementId, record?.runtimeAdapterRequirementId].filter(Boolean).includes(adapterId);
  const sourceMatches = !record?.sourceHost || !sourceHost || record.sourceHost === sourceHost;
  const targetMatches = !record?.targetHost || !targetHost || record.targetHost === targetHost;
  return (capabilityMatches || adapterMatches) && sourceMatches && targetMatches;
}

function passedRuntimeProofEvidence(record) {
  return record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success';
}

function runtimeProofAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-runtime-proof-signals';
  if (status === 'satisfied') return 'attach-runtime-proof-obligation';
  return 'skip';
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function countBy(values) {
  const counts = {};
  for (const value of values.filter(Boolean)) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}
