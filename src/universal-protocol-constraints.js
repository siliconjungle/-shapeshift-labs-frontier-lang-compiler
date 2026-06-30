import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalProtocolConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalProtocolConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceProtocols = normalizeProtocolRecords('source', [
    ...(input.sourceProtocols ?? []),
    ...(input.protocols ?? []),
    ...(input.sourceProtocolConstraints ?? []),
    ...(input.protocolConstraints ?? []),
    ...(input.imports ?? []).flatMap(protocolRecordsFromImport)
  ]);
  const targetProtocols = normalizeProtocolRecords('target', [
    ...(input.targetProtocols ?? []),
    ...(input.targetProtocolConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceProtocols.flatMap((record) => record.constraintKinds));
  const representedKinds = representedProtocolKinds(requiredKinds, targetProtocols, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = protocolMissingEvidence(missingKinds, sourceProtocols, targetProtocols, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = protocolReview(missingKinds, sourceProtocols, targetProtocols, input);
  const status = protocolStatus({ sourceProtocols, targetProtocols, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalProtocolConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalProtocolConstraintEvidence.v1',
    id: input.id ?? `protocol_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: protocolAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceProtocols,
    targetProtocols,
    protocolConstraints: requiredKinds.map((kind) => protocolConstraintRecord(kind, sourceProtocols, targetProtocols, representedKinds)),
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...sourceProtocols.flatMap((record) => record.evidenceIds ?? []),
      ...targetProtocols.flatMap((record) => record.evidenceIds ?? [])
    ]),
    claims: {
      protocolEquivalenceClaim: false,
      implementationCoherenceClaim: false,
      dispatchEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Protocol constraints model trait, interface, protocol, typeclass, and concept obligations for translation admission. They are not proof of full behavioral equivalence.',
      ...(input.metadata ?? {})
    }
  };
}

export function protocolConstraintMatches(evidence = {}, query = {}) {
  return match(query.protocolConstraintStatus, [evidence.status])
    && match(query.protocolConstraintAction, [evidence.action])
    && match(query.protocolConstraintRequiredKind, evidence.requiredKinds)
    && match(query.protocolConstraintRepresentedKind, evidence.representedKinds)
    && match(query.protocolConstraintMissingKind, evidence.missingKinds)
    && match(query.protocolConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.protocolConstraintEvidenceId, evidence.evidenceIds);
}

export function protocolConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingProtocolInput(input, route, routeEvidence);
  const sourceProtocols = [
    ...(explicit?.sourceProtocols ?? []),
    ...(explicit?.protocols ?? []),
    ...(explicit?.sourceProtocolConstraints ?? []),
    ...(explicit?.protocolConstraints ?? []),
    ...routeImports.flatMap(protocolRecordsFromImport)
  ];
  const targetProtocols = [...(explicit?.targetProtocols ?? []), ...(explicit?.targetProtocolConstraints ?? [])];
  if (!explicit && !sourceProtocols.length && !targetProtocols.length) return undefined;
  return createUniversalProtocolConstraintEvidence({
    ...explicit,
    route,
    routeId: route.id,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    imports: routeImports,
    sourceProtocols,
    targetProtocols,
    evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean)
  });
}

function normalizeProtocolRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = protocolConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_protocol_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.protocolName ?? record?.traitName ?? record?.interfaceName,
      symbolId: record?.symbolId ?? record?.id,
      protocolKind: record?.protocolKind ?? record?.kind ?? record?.symbolKind ?? record?.declarationKind,
      subjectName: record?.subjectName ?? record?.receiverName ?? record?.implementedFor,
      requirementNames: list(record?.requirementNames, record?.requirements, record?.methods, record?.members),
      associatedTypeNames: list(record?.associatedTypeNames, record?.associatedTypes),
      genericParameterNames: list(record?.genericParameterNames, record?.typeParameters, record?.genericParameters),
      boundNames: list(record?.boundNames, record?.bounds, record?.traitBounds, record?.protocolBounds, record?.whereBounds),
      implementationKinds: list(record?.implementationKinds, record?.implKinds, record?.implementations),
      dispatchKinds: list(record?.dispatchKinds, record?.dispatchModes),
      coherenceKinds: list(record?.coherenceKinds, record?.coherenceRules),
      constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function protocolRecordsFromImport(imported) {
  return uniqueProtocolRecords([
    ...(imported?.protocolConstraints ?? []),
    ...(imported?.protocols ?? []),
    ...(imported?.traits ?? []),
    ...(imported?.interfaces ?? []),
    ...(imported?.concepts ?? []),
    ...(imported?.typeClasses ?? []),
    ...(imported?.typeConstraints ?? []).filter(protocolLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(protocolLikeRecord),
    ...(imported?.semanticIndex?.relations ?? []).filter(protocolLikeRecord),
    ...(imported?.semanticIndex?.facts ?? []).filter(protocolLikeRecord),
    ...(imported?.symbols ?? []).filter(protocolLikeRecord),
    ...(imported?.declarations ?? []).filter(protocolLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(protocolLikeRecord),
    ...(imported?.nativeAst?.relations ?? []).filter(protocolLikeRecord)
  ]);
}

function protocolLikeRecord(record = {}) {
  const token = String([record.kind, record.protocolKind, record.symbolKind, record.declarationKind, record.typeKind, record.predicate, record.relationKind].filter(Boolean).join(' ')).toLowerCase();
  return /trait|protocol|interface|concept|typeclass|type-class|impl|implements|conforms|extension|associated-type|object-safety|coherence|orphan|blanket/.test(token);
}

function protocolConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.protocolKind,
    record.kind,
    record.symbolKind,
    record.declarationKind,
    record.typeKind,
    record.predicate,
    record.relationKind,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.requirementNames?.length || record.requirements?.length || record.methods?.length || record.members?.length ? 'required-member' : undefined,
    record.associatedTypeNames?.length || record.associatedTypes?.length ? 'associated-type' : undefined,
    record.genericParameterNames?.length || record.typeParameters?.length || record.genericParameters?.length ? 'generic-parameter' : undefined,
    record.boundNames?.length || record.bounds?.length || record.traitBounds?.length || record.protocolBounds?.length || record.whereBounds?.length ? 'protocol-bound' : undefined,
    ...(record.dispatchKinds ?? []),
    ...(record.dispatchModes ?? []),
    ...(record.implementationKinds ?? []),
    ...(record.implKinds ?? []),
    ...(record.coherenceKinds ?? []),
    ...(record.coherenceRules ?? []),
    ...(record.metadata?.traits ?? []),
    ...(record.metadata?.autoTraits ?? [])
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(protocolKindForToken));
}

function protocolKindForToken(token) {
  const kinds = [];
  if (/trait|protocol|interface|concept|typeclass|type-class/.test(token)) kinds.push('protocol-identity');
  if (/required-member|required-method|method-requirement|member-requirement/.test(token)) kinds.push('required-member');
  if (/associated-type|associatedtype|type-member/.test(token)) kinds.push('associated-type');
  if (/generic|type-parameter|template-parameter/.test(token)) kinds.push('generic-parameter');
  if (/trait-bound|protocol-bound|interface-bound|concept-bound|where-clause|constraint/.test(token)) kinds.push('protocol-bound');
  if (/impl|implementation|implements|conforms|conformance/.test(token)) kinds.push('implementation');
  if (/blanket/.test(token)) kinds.push('blanket-implementation');
  if (/conditional/.test(token)) kinds.push('conditional-implementation');
  if (/default-method|default-implementation/.test(token)) kinds.push('default-method');
  if (/extension-method|extension|protocol-extension/.test(token)) kinds.push('extension-method');
  if (/dynamic|dyn|trait-object|existential-dispatch|virtual-dispatch/.test(token)) kinds.push('dynamic-dispatch');
  if (/static-dispatch|monomorph|monomorphization/.test(token)) kinds.push('static-dispatch');
  if (/object-safety|object-safe/.test(token)) kinds.push('object-safety');
  if (/coherence/.test(token)) kinds.push('coherence-rule');
  if (/orphan/.test(token)) kinds.push('orphan-rule');
  if (/sealed/.test(token)) kinds.push('sealed-protocol');
  if (/marker/.test(token)) kinds.push('marker-protocol');
  if (/auto-trait|send|sync/.test(token)) kinds.push('auto-trait');
  if (/existential|impl-trait|opaque-protocol/.test(token)) kinds.push('existential-protocol');
  if (/structural/.test(token)) kinds.push('structural-protocol');
  if (/nominal/.test(token)) kinds.push('nominal-protocol');
  if (/higher-ranked|hrtb|forall|for</.test(token)) kinds.push('higher-ranked-bound');
  if (/specialization/.test(token)) kinds.push('specialization');
  return kinds;
}

function representedProtocolKinds(requiredKinds, targetProtocols, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetProtocols.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function protocolMissingEvidence(missingKinds, sourceProtocols, targetProtocols, input) {
  if (!sourceProtocols.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetProtocols.length || preserveSource ? [] : ['translation-protocol-constraint-target-evidence']),
    ...(missingKinds.length ? ['translation-protocol-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-protocol-constraint:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function protocolReview(missingKinds, sourceProtocols, targetProtocols, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Protocol constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceProtocols.length && !targetProtocols.length ? ['Source trait/interface/protocol records are not represented by target protocol evidence.'] : []),
    ...(missingKinds.includes('coherence-rule') ? ['Implementation coherence or orphan-rule behavior requires target proof.'] : []),
    ...(missingKinds.includes('dynamic-dispatch') ? ['Dynamic dispatch behavior is not represented in the target protocol evidence.'] : []),
    ...(missingKinds.includes('associated-type') ? ['Associated type/member obligations are not represented in the target protocol evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function protocolStatus(input) {
  if (!input.sourceProtocols.length && !input.targetProtocols.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetProtocols.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function protocolAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-protocol-constraint-evidence';
  if (status === 'degraded') return 'review-protocol-constraint-loss';
  if (status === 'satisfied') return 'attach-protocol-constraint-record';
  return 'skip';
}

function protocolConstraintRecord(kind, sourceProtocols, targetProtocols, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceProtocolIds: sourceProtocols.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetProtocolIds: targetProtocols.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['required-member', 'associated-type', 'protocol-bound', 'implementation', 'dynamic-dispatch', 'object-safety', 'coherence-rule', 'orphan-rule', 'auto-trait', 'higher-ranked-bound', 'specialization'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingProtocolInput(input, route, routeEvidence) {
  const candidates = [input.protocolConstraint, input.translationProtocolConstraint, ...(input.protocolConstraints ?? []), ...routeEvidence.map((record) => record?.protocolConstraint ?? record?.translationProtocolConstraint)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function routeMatch(candidate, route) {
  return (!candidate.routeId || candidate.routeId === route.id)
    && (!candidate.sourceLanguage || String(candidate.sourceLanguage).toLowerCase() === String(route.sourceLanguage).toLowerCase())
    && (!candidate.target || String(candidate.target).toLowerCase() === String(route.target).toLowerCase());
}

function list(...values) {
  return uniqueStrings(values.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).map(String));
}

function sameLanguage(source, target) {
  return String(source ?? '').toLowerCase() === String(target ?? '').toLowerCase();
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function uniqueProtocolRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.kind, record.protocolKind, record.predicate].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
