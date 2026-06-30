import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalHostEnvironmentConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalHostEnvironmentConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const runtime = input.runtime ?? {};
  const sourceRecords = normalizeHostRecords('source', [
    ...(input.sourceHostEnvironmentRecords ?? []),
    ...(input.hostEnvironmentRecords ?? []),
    ...(input.hostRecords ?? []),
    ...(input.environmentRecords ?? []),
    ...(input.capabilityRecords ?? []),
    ...(input.permissionRecords ?? []),
    ...(input.imports ?? []).flatMap(hostRecordsFromImport),
    ...hostRecordsFromRuntime(runtime, 'source')
  ]);
  const targetRecords = normalizeHostRecords('target', [
    ...(input.targetHostEnvironmentRecords ?? []),
    ...hostRecordsFromRuntime(runtime, 'target')
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedHostKinds(requiredKinds, targetRecords, { mode: input.mode ?? route.mode, sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = hostMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = hostBlockers(runtime, input);
  const review = hostReview(missingKinds, sourceRecords, targetRecords, input);
  const status = hostStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalHostEnvironmentConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalHostEnvironmentConstraintEvidence.v1',
    id: input.id ?? `host_environment_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: hostAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceHostEnvironmentRecords: sourceRecords,
    targetHostEnvironmentRecords: targetRecords,
    hostEnvironmentConstraints: requiredKinds.map((kind) => hostConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      hostEquivalenceClaim: false,
      permissionEquivalenceClaim: false,
      environmentEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Host-environment constraints record runtime host, global, resource, and permission obligations for translation admission. They are not proof of equivalent target host behavior.',
      ...(input.metadata ?? {})
    }
  };
}

export function hostEnvironmentConstraintMatches(evidence = {}, query = {}) {
  return match(query.hostEnvironmentConstraintStatus, [evidence.status])
    && match(query.hostEnvironmentConstraintAction, [evidence.action])
    && match(query.hostEnvironmentConstraintRequiredKind, evidence.requiredKinds)
    && match(query.hostEnvironmentConstraintRepresentedKind, evidence.representedKinds)
    && match(query.hostEnvironmentConstraintMissingKind, evidence.missingKinds)
    && match(query.hostEnvironmentConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.hostEnvironmentConstraintEvidenceId, evidence.evidenceIds);
}

export function hostEnvironmentConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = [], runtime = {}) {
  const explicit = matchingHostInput(input, route, routeEvidence);
  const sourceHostEnvironmentRecords = [
    ...(explicit?.sourceHostEnvironmentRecords ?? []),
    ...(explicit?.hostEnvironmentRecords ?? []),
    ...(explicit?.hostRecords ?? []),
    ...(explicit?.environmentRecords ?? []),
    ...(explicit?.capabilityRecords ?? []),
    ...(explicit?.permissionRecords ?? []),
    ...routeImports.flatMap(hostRecordsFromImport)
  ];
  const targetHostEnvironmentRecords = [...(explicit?.targetHostEnvironmentRecords ?? [])];
  if (!explicit && !sourceHostEnvironmentRecords.length && !targetHostEnvironmentRecords.length && !(runtime?.requiredCapabilities ?? []).length && !(runtime?.adapterRequirements ?? []).length) return undefined;
  return createUniversalHostEnvironmentConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceHostEnvironmentRecords, targetHostEnvironmentRecords, runtime, routeEvidence, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeHostRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = hostConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_host_environment_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      hostKind: record?.hostKind ?? record?.kind ?? record?.capability ?? record?.runtimeKind,
      capability: record?.capability,
      apiName: record?.apiName ?? record?.name ?? record?.callee ?? record?.importedName,
      globalName: record?.globalName ?? record?.global ?? record?.objectName,
      permission: record?.permission ?? record?.permissionKind,
      resource: record?.resource ?? record?.resourceId ?? record?.path,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      adapterRequired: Boolean(record?.adapterRequired),
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function hostRecordsFromImport(imported) {
  return [
    ...(imported?.hostEnvironmentConstraints ?? []),
    ...(imported?.hostEnvironmentRecords ?? []),
    ...(imported?.hostRecords ?? []),
    ...(imported?.environmentRecords ?? []),
    ...(imported?.capabilityRecords ?? []),
    ...(imported?.permissionRecords ?? []),
    ...(imported?.runtimeHostRecords ?? []),
    ...(imported?.metadata?.hostEnvironmentEvidence?.records ?? []),
    ...(imported?.metadata?.runtimeCapabilities ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(hostLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(hostLikeRecord),
    ...(imported?.semanticIndex?.relations ?? []).filter(hostLikeRecord),
    ...(imported?.nativeAst?.hosts ?? []),
    ...(imported?.nativeAst?.effects ?? []).filter(hostLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(hostLikeRecord)
  ];
}

function hostRecordsFromRuntime(runtime = {}, role) {
  const source = role === 'source' ? runtime.requiredCapabilities ?? [] : runtime.satisfiedCapabilities ?? [];
  const adapters = role === 'target' ? runtime.adapterRequirements ?? [] : [];
  return [
    ...source.map((capability) => ({ kind: capability, capability, evidenceIds: [] })),
    ...adapters.map((adapter) => ({ kind: adapter.capability, capability: adapter.capability, adapterRequired: true, evidenceIds: adapter.evidenceIds ?? [] }))
  ];
}

function hostLikeRecord(record = {}) {
  const token = String([record.kind, record.hostKind, record.capability, record.permission, record.predicate, record.globalName, record.metadata?.kind, record.value?.kind].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.hostId || record.capability || record.permission || record.globalName || /host|runtime|capability|permission|filesystem|process|env|network|fetch|storage|database|dom|browser|node|worker|clock|timer|random|locale|timezone|crypto|clipboard|canvas|gpu|wasm|sandbox|secret|shell|native/.test(token));
}

function hostConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.hostKind,
    record.kind,
    record.capability,
    record.runtimeKind,
    record.permission,
    record.permissionKind,
    record.globalName,
    record.global,
    record.apiName,
    record.predicate,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.value?.kind
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(hostKindForToken));
}

function hostKindForToken(token) {
  const kinds = [];
  if (/fs|file|filesystem|path/.test(token)) kinds.push(token.includes('path') ? 'platform-path' : 'filesystem');
  if (/process|child_process|argv|stdin|stdout|stderr/.test(token)) kinds.push('process');
  if (/(^|[\s_-])env($|[\s_-])|environment-variable|dotenv/.test(token)) kinds.push('environment-variable');
  if (/network|fetch|http|websocket|eventsource|socket/.test(token)) kinds.push('network');
  if (/storage|indexeddb|localstorage|sessionstorage|cookie|cache/.test(token)) kinds.push('storage');
  if (/database|sql|sqlite|postgres|mysql|redis/.test(token)) kinds.push('database');
  if (/(^|[\s_-])dom($|[\s_-])|document|element|shadow-root/.test(token)) kinds.push('dom');
  if (/browser|window|navigator|history|location/.test(token)) kinds.push('browser-api');
  if (/node|nodejs|node:|require\.resolve/.test(token)) kinds.push('node-api');
  if (/worker|thread|threading|sharedworker|worklet/.test(token)) kinds.push('worker');
  if (/clock|date|time|now/.test(token)) kinds.push('clock');
  if (/timer|timeout|interval|animation-frame|idle/.test(token)) kinds.push('timer');
  if (/random|rng|uuid/.test(token)) kinds.push('randomness');
  if (/locale|intl|collator|numberformat/.test(token)) kinds.push('locale');
  if (/timezone|time-zone|tz/.test(token)) kinds.push('timezone');
  if (/encoding|textencoder|textdecoder|unicode|charset/.test(token)) kinds.push('encoding');
  if (/crypto|subtle|hash|digest/.test(token)) kinds.push('crypto');
  if (/clipboard/.test(token)) kinds.push('clipboard');
  if (/gpu|webgpu|webgl/.test(token)) kinds.push('gpu');
  if (/canvas|2d-context|offscreen/.test(token)) kinds.push('canvas');
  if (/wasm|webassembly/.test(token)) kinds.push('wasm');
  if (/permission|capability-boundary|allowlist|denylist/.test(token)) kinds.push('permission-boundary');
  if (/sandbox|isolate|vm|realm/.test(token)) kinds.push('sandbox');
  if (/secret|credential|token|keychain/.test(token)) kinds.push('secret');
  if (/shell|command|exec|spawn/.test(token)) kinds.push('shell-command');
  if (/ffi|native|addon|napi/.test(token)) kinds.push('native-addon');
  if (!kinds.length && (token === 'host' || token === 'runtime' || token === 'capability')) kinds.push('host-environment');
  return kinds;
}

function representedHostKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function hostMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-host-environment-target-evidence']),
    ...(missingKinds.length ? ['translation-host-environment-proof'] : []),
    ...(missingKinds.map((kind) => `translation-host-environment:${kind}`)),
    ...((input.runtime?.adapterRequirements ?? []).length && !hasPassedHostProof(input.routeEvidence) ? ['translation-host-environment-adapter-proof'] : []),
    ...(input.missingEvidence ?? [])
  ]);
}

function hostBlockers(runtime = {}, input = {}) {
  return uniqueStrings([
    ...((runtime.missingCapabilities ?? []).map((capability) => `Target runtime is missing host capability: ${capability}.`)),
    ...(input.blockers ?? [])
  ]);
}

function hostReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Host-environment constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source host/runtime/permission records are not represented by target host-environment evidence.'] : []),
    ...((input.runtime?.adapterRequirements ?? []).map((entry) => `Host adapter proof is required for ${entry.capability}.`)),
    ...(input.review ?? [])
  ]);
}

function hasPassedHostProof(evidence) {
  return (evidence ?? []).some((record) => (record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success') && /host|runtime|capability|adapter|proof|replay|gate|verification/i.test(String(record?.kind ?? record?.type ?? record?.scope ?? '')));
}

function hostStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function hostAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-host-environment-evidence';
  if (status === 'degraded') return 'review-host-environment-loss';
  if (status === 'satisfied') return 'attach-host-environment-record';
  return 'skip';
}

function hostConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceHostEnvironmentIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetHostEnvironmentIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['filesystem', 'process', 'environment-variable', 'network', 'database', 'dom', 'browser-api', 'node-api', 'permission-boundary', 'sandbox', 'secret', 'shell-command', 'native-addon'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingHostInput(input, route, routeEvidence) {
  const candidates = [input.hostEnvironmentConstraint, input.translationHostEnvironmentConstraint, ...(input.hostEnvironmentConstraints ?? []), ...routeEvidence.map((record) => record?.hostEnvironmentConstraint ?? record?.translationHostEnvironmentConstraint)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function routeMatch(candidate, route) {
  return (!candidate.routeId || candidate.routeId === route.id)
    && (!candidate.sourceLanguage || candidate.sourceLanguage === route.sourceLanguage)
    && (!candidate.target || candidate.target === route.target);
}

function sameLanguage(source, target) { return String(source ?? '').toLowerCase() === String(target ?? '').toLowerCase(); }

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
