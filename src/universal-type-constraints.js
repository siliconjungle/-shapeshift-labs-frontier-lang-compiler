import { rustTypeConstraintRecordsFromInput } from './internal/index-impl/rustTypeConstraintRecords.js';
import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalTypeConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalTypeConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceTypes = normalizeTypeRecords('source', [
    ...(input.sourceTypes ?? []),
    ...(input.types ?? []),
    ...(input.imports ?? []).flatMap(typeRecordsFromImport)
  ]);
  const targetTypes = normalizeTypeRecords('target', input.targetTypes ?? []);
  const requiredKinds = uniqueStrings(sourceTypes.flatMap((record) => record.constraintKinds));
  const representedKinds = representedTypeKinds(requiredKinds, targetTypes, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = typeMissingEvidence(missingKinds, sourceTypes, targetTypes, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = typeReview(missingKinds, sourceTypes, targetTypes, input);
  const status = typeStatus({ sourceTypes, targetTypes, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalTypeConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalTypeConstraintEvidence.v1',
    id: input.id ?? `type_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: typeAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceTypes,
    targetTypes,
    typeConstraints: requiredKinds.map((kind) => typeConstraintRecord(kind, sourceTypes, targetTypes, representedKinds)),
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...sourceTypes.flatMap((record) => record.evidenceIds ?? []),
      ...targetTypes.flatMap((record) => record.evidenceIds ?? [])
    ]),
    claims: {
      typeEquivalenceClaim: false,
      publicApiEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Type constraints record public API and type-shape obligations for translation admission. They are not proof of full cross-language type equivalence.',
      ...(input.metadata ?? {})
    }
  };
}

export function typeConstraintMatches(evidence = {}, query = {}) {
  return match(query.typeConstraintStatus, [evidence.status])
    && match(query.typeConstraintAction, [evidence.action])
    && match(query.typeConstraintRequiredKind, evidence.requiredKinds)
    && match(query.typeConstraintRepresentedKind, evidence.representedKinds)
    && match(query.typeConstraintMissingKind, evidence.missingKinds)
    && match(query.typeConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.typeConstraintEvidenceId, evidence.evidenceIds);
}

export function typeConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingTypeInput(input, route, routeEvidence);
  const sourceTypes = [...(explicit?.sourceTypes ?? []), ...(explicit?.types ?? []), ...routeImports.flatMap(typeRecordsFromImport)];
  const targetTypes = [...(explicit?.targetTypes ?? [])];
  if (!explicit && !sourceTypes.length && !targetTypes.length) return undefined;
  return createUniversalTypeConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceTypes, targetTypes, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeTypeRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = typeConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_type_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.localName,
      symbolId: record?.symbolId ?? record?.id,
      typeKind: record?.typeKind ?? record?.kind ?? record?.symbolKind ?? record?.declarationKind,
      signatureHash: record?.signatureHash ?? record?.contractHash ?? record?.typeHash,
      constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function typeRecordsFromImport(imported) {
  return uniqueTypeRecords([
    ...(imported?.typeConstraints ?? []),
    ...(imported?.types ?? []),
    ...(imported?.publicContracts ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(publicTypeRecord),
    ...(imported?.symbols ?? []).filter(publicTypeRecord),
    ...(imported?.declarations ?? []).filter(publicTypeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(publicTypeRecord),
    ...rustTypeConstraintRecordsFromInput(imported)
  ]);
}

function publicTypeRecord(record = {}) {
  const role = String(record.role ?? record.metadata?.role ?? '');
  const kind = String(record.typeKind ?? record.kind ?? record.symbolKind ?? record.declarationKind ?? '');
  return record.publicContract || record.signatureHash || /export|public/.test(role) || /type|interface|class|struct|enum|trait|function|method|signature|property/.test(kind);
}

function typeConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.typeKind,
    record.kind,
    record.symbolKind,
    record.declarationKind,
    record.apiSurfaceKind,
    record.publicContractKind,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.signatureHash ? 'signature' : undefined,
    record.contractHash ? 'public-contract' : undefined,
    record.nullable || record.optional ? 'nullable' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(typeKindForToken));
}

function typeKindForToken(token) {
  if (/public|api|contract|export|declaration/.test(token)) return ['public-contract'];
  if (/call|construct|function|method|signature|delegate/.test(token)) return ['callable-signature'];
  if (/generic|template|typeparam|type-parameter/.test(token)) return ['generic-parameters'];
  if (/trait.*bound|bound.*trait|protocol.*constraint|interface.*constraint/.test(token)) return ['trait-bound'];
  if (/where-clause|where.*constraint/.test(token)) return ['where-clause'];
  if (/lifetime.*bound|type-lifetime|outlives.*type/.test(token)) return ['type-lifetime-bound'];
  if (/associated-type|assoc.*type/.test(token)) return ['associated-type-binding'];
  if (/existential|impl-trait|opaque-type/.test(token)) return ['existential-type'];
  if (/parameter|argument|param/.test(token)) return ['parameter-shape'];
  if (/return|result|yield/.test(token)) return ['return-type'];
  if (/null|optional|undefined|maybe|nullable/.test(token)) return ['nullability'];
  if (/union|intersection|tuple|mapped|conditional|infer|keyof|template-literal|indexed-access/.test(token)) return ['advanced-type-operator'];
  if (/nominal|class|struct|enum|trait|interface/.test(token)) return ['nominal-identity'];
  if (/structural|shape|property|member|field|record/.test(token)) return ['structural-shape'];
  if (/variance|covariant|contravariant|invariant/.test(token)) return ['variance'];
  if (/overload/.test(token)) return ['overload-set'];
  if (/visibility|private|protected|public/.test(token)) return ['visibility'];
  return token === 'type' ? ['type-identity'] : [];
}

function representedTypeKinds(requiredKinds, targetTypes, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetTypes.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function typeMissingEvidence(missingKinds, sourceTypes, targetTypes, input) {
  if (!sourceTypes.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetTypes.length || preserveSource ? [] : ['translation-type-constraint-target-evidence']),
    ...(missingKinds.length ? ['translation-type-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-type-constraint:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function typeReview(missingKinds, sourceTypes, targetTypes, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Type constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceTypes.length && !targetTypes.length ? ['Source public type/API records are not represented by target type evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function typeStatus(input) {
  if (!input.sourceTypes.length && !input.targetTypes.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetTypes.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function typeAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-type-constraint-evidence';
  if (status === 'degraded') return 'review-type-constraint-loss';
  if (status === 'satisfied') return 'attach-type-constraint-record';
  return 'skip';
}

function typeConstraintRecord(kind, sourceTypes, targetTypes, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceTypeIds: sourceTypes.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetTypeIds: targetTypes.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['public-contract', 'callable-signature', 'return-type', 'nullability', 'trait-bound', 'associated-type-binding'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingTypeInput(input, route, routeEvidence) {
  const candidates = [input.typeConstraint, input.translationTypeConstraint, ...(input.typeConstraints ?? []), ...routeEvidence.map((record) => record?.typeConstraint ?? record?.translationTypeConstraint)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function routeMatch(candidate, route) {
  return (!candidate.routeId || candidate.routeId === route.id)
    && (!candidate.sourceLanguage || candidate.sourceLanguage === route.sourceLanguage)
    && (!candidate.target || candidate.target === route.target);
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

function uniqueTypeRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    if (!record?.id) {
      result.push(record);
      continue;
    }
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    result.push(record);
  }
  return result;
}
