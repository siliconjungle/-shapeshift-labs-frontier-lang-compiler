import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalAdtPatternConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalAdtPatternConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id, sourceLanguage = input.sourceLanguage ?? route.sourceLanguage, target = input.target ?? route.target, mode = input.mode ?? route.mode;
  const sourceRecords = normalizeAdtPatternRecords('source', [...(input.sourceAdts ?? []), ...(input.adts ?? []), ...(input.sourceRecords ?? []), ...(input.sourceAdtPatternRecords ?? []), ...(input.adtPatternRecords ?? []), ...(input.sourcePatternMatches ?? []), ...(input.patternMatches ?? []), ...(input.sourceAdtPatternConstraints ?? []), ...(input.adtPatternConstraints ?? []), ...(input.imports ?? []).flatMap(adtPatternRecordsFromImport)]);
  const targetRecords = normalizeAdtPatternRecords('target', [...(input.targetAdts ?? []), ...(input.targetRecords ?? []), ...(input.targetAdtPatternRecords ?? []), ...(input.targetPatternMatches ?? []), ...(input.targetAdtPatternConstraints ?? [])]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedAdtPatternKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = adtPatternMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = adtPatternReview(missingKinds, sourceRecords, targetRecords, context);
  const status = adtPatternStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return { kind: 'frontier.lang.universalAdtPatternConstraintEvidence', version: 1, schema: 'frontier.lang.universalAdtPatternConstraintEvidence.v1', id: input.id ?? `adt_pattern_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`, routeId, sourceLanguage, target, status, action: adtPatternAction(status), requiredKinds, representedKinds, missingKinds, missingEvidence, blockers, review, sourceRecords, targetRecords, adtPatternConstraints: requiredKinds.map((kind) => adtPatternConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)), evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]), claims: { adtEquivalenceClaim: false, patternExhaustivenessClaim: false, variantPayloadEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false }, metadata: { note: 'ADT and pattern constraints model variant identity, payloads, destructuring, match dispatch, guards, and exhaustiveness for translation admission. They are not proof of full behavioral equivalence.', ...(input.metadata ?? {}) } };
}

export function adtPatternConstraintMatches(evidence = {}, query = {}) {
  const record = evidence ?? {};
  const criteria = query ?? {};
  return match(criteria.adtPatternConstraintStatus, [record.status])
    && match(criteria.adtPatternConstraintAction, [record.action])
    && match(criteria.adtPatternConstraintRequiredKind, record.requiredKinds)
    && match(criteria.adtPatternConstraintRepresentedKind, record.representedKinds)
    && match(criteria.adtPatternConstraintMissingKind, record.missingKinds)
    && match(criteria.adtPatternConstraintMissingEvidence, record.missingEvidence)
    && match(criteria.adtPatternConstraintEvidenceId, record.evidenceIds);
}

export function adtPatternConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const imports = routeImports ?? [];
  const evidence = routeEvidence ?? [];
  const explicit = matchingAdtPatternInput(input, route, evidence);
  const sourceRecords = [...(explicit?.sourceAdts ?? []), ...(explicit?.adts ?? []), ...(explicit?.sourceRecords ?? []), ...(explicit?.sourceAdtPatternRecords ?? []), ...(explicit?.adtPatternRecords ?? []), ...(explicit?.sourcePatternMatches ?? []), ...(explicit?.patternMatches ?? []), ...(explicit?.sourceAdtPatternConstraints ?? []), ...(explicit?.adtPatternConstraints ?? []), ...imports.flatMap(adtPatternRecordsFromImport)];
  const targetRecords = [...(explicit?.targetAdts ?? []), ...(explicit?.targetRecords ?? []), ...(explicit?.targetAdtPatternRecords ?? []), ...(explicit?.targetPatternMatches ?? []), ...(explicit?.targetAdtPatternConstraints ?? [])];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalAdtPatternConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports, sourceAdtPatternRecords: sourceRecords, targetAdtPatternRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...evidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeAdtPatternRecords(role, records) {
  return uniqueAdtPatternRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = adtPatternConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{ id: record?.id ?? `${role}_adt_pattern_${index + 1}_${idFragment(constraintKinds.join('_'))}`, role: record?.role ?? role, name: record?.name ?? record?.symbolName ?? record?.typeName ?? record?.enumName ?? record?.unionName, symbolId: record?.symbolId ?? record?.id, adtKind: record?.adtKind ?? record?.kind ?? record?.symbolKind ?? record?.declarationKind ?? record?.typeKind, patternKind: record?.patternKind ?? record?.matchKind ?? record?.caseKind, variantNames: list(record?.variantNames, record?.variants, record?.caseNames, record?.cases, record?.members), constructorNames: list(record?.constructorNames, record?.constructors, record?.caseConstructors), payloadFieldNames: list(record?.payloadFieldNames, record?.payloadFields, record?.fields, record?.tupleFields, record?.recordFields), tagFieldNames: list(record?.tagFieldNames, record?.tagFields, record?.discriminatorFields, record?.discriminants), matchArmNames: list(record?.matchArmNames, record?.matchArms, record?.arms, record?.switchCases), guardKinds: list(record?.guardKinds, record?.guards, record?.whereClauses, record?.conditions), destructuringKinds: list(record?.destructuringKinds, record?.destructuring, record?.bindingPatterns, record?.deconstruction), exhaustivenessKinds: list(record?.exhaustivenessKinds, record?.exhaustiveness, record?.coverageKinds), fallbackKinds: list(record?.fallbackKinds, record?.fallbacks, record?.defaultCases, record?.wildcards), genericParameterNames: list(record?.genericParameterNames, record?.typeParameters, record?.genericParameters), constraintKinds, sourcePath: record?.sourcePath ?? record?.sourceSpan?.path, sourceHash: record?.sourceHash, sourceSpan: record?.sourceSpan, evidenceIds: record?.evidenceIds ?? [] }];
  }));
}

function adtPatternRecordsFromImport(imported) {
  return uniqueAdtPatternRecords([...(imported?.adtPatternConstraints ?? []), ...(imported?.adtPatternRecords ?? []), ...(imported?.algebraicDataTypes ?? []), ...(imported?.adts ?? []), ...(imported?.enums ?? []), ...(imported?.variants ?? []), ...(imported?.patternMatches ?? []), ...(imported?.matches ?? []), ...(imported?.semanticIndex?.symbols ?? []).filter(adtPatternLikeRecord), ...(imported?.semanticIndex?.relations ?? []).filter(adtPatternLikeRecord), ...(imported?.semanticIndex?.facts ?? []).filter(adtPatternLikeRecord), ...(imported?.symbols ?? []).filter(adtPatternLikeRecord), ...(imported?.declarations ?? []).filter(adtPatternLikeRecord), ...(imported?.nativeAst?.declarations ?? []).filter(adtPatternLikeRecord), ...(imported?.nativeAst?.relations ?? []).filter(adtPatternLikeRecord), ...(imported?.nativeAst?.patterns ?? []).filter(adtPatternLikeRecord)]);
}

function adtPatternLikeRecord(record = {}) {
  const token = String([record.kind, record.adtKind, record.patternKind, record.symbolKind, record.declarationKind, record.typeKind, record.predicate, record.relationKind].filter(Boolean).join(' ')).toLowerCase();
  return /adt|algebraic|sum|enum|variant|union|sealed|case|match|pattern|destructur|exhaust|discrimin|tagged|option|result|fallthrough/.test(token);
}

function adtPatternConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([primitiveToken, record.adtKind, record.patternKind, record.kind, record.symbolKind, record.declarationKind, record.typeKind, record.predicate, record.relationKind, ...(record.constraintKinds ?? []), ...(record.factKinds ?? []), ...(record.metadata?.factKinds ?? []), record.variantNames?.length || record.variants?.length || record.caseNames?.length || record.cases?.length || record.members?.length ? 'variant' : undefined, record.payloadFieldNames?.length || record.payloadFields?.length || record.fields?.length || record.tupleFields?.length || record.recordFields?.length ? 'payload' : undefined, record.tagFieldNames?.length || record.tagFields?.length || record.discriminatorFields?.length || record.discriminants?.length ? 'discriminator' : undefined, record.matchArmNames?.length || record.matchArms?.length || record.arms?.length || record.switchCases?.length ? 'match' : undefined, record.guardKinds?.length || record.guards?.length || record.whereClauses?.length || record.conditions?.length ? 'guard' : undefined, record.destructuringKinds?.length || record.destructuring?.length || record.bindingPatterns?.length || record.deconstruction?.length ? 'destructuring' : undefined, record.exhaustivenessKinds?.length || record.exhaustiveness?.length || record.coverageKinds?.length ? 'exhaustiveness' : undefined, record.fallbackKinds?.length || record.fallbacks?.length || record.defaultCases?.length || record.wildcards?.length ? 'wildcard' : undefined, record.genericParameterNames?.length || record.typeParameters?.length || record.genericParameters?.length ? 'generic' : undefined].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(adtPatternKindForToken));
}

function adtPatternKindForToken(token) {
  const kinds = [];
  if (/adt|algebraic|sum-type|sum type|enum|union|sealed|variant|case/.test(token)) kinds.push('adt-identity');
  if (/variant|case|enum-member|union-member/.test(token)) kinds.push('variant-identity');
  if (/payload|tuple|record|struct|field|member/.test(token)) kinds.push('payload-shape');
  if (/tag|discriminant|discriminator|tagged/.test(token)) kinds.push('tag-discriminator');
  if (/constructor|case-constructor/.test(token)) kinds.push('constructor-shape');
  if (/pattern-binding|binding|bind|capture/.test(token)) kinds.push('pattern-binding');
  if (/destructur|deconstruct|unpack/.test(token)) kinds.push('destructuring');
  if (/match|switch|case-dispatch/.test(token)) kinds.push('match-dispatch');
  if (/exhaust|total-match|sealed/.test(token)) kinds.push('exhaustiveness');
  if (/guard|where|condition/.test(token)) kinds.push('guard-condition');
  if (/wildcard|catchall|catch-all|default/.test(token)) kinds.push('wildcard-catchall');
  if (/fallthrough|fall-through/.test(token)) kinds.push('fallthrough');
  if (/refutable|irrefutable/.test(token)) kinds.push('refutability');
  if (/recursive/.test(token)) kinds.push('recursive-variant');
  if (/option|result|maybe|either/.test(token)) kinds.push('option-result-convention');
  if (/null|nullable|undefined/.test(token)) kinds.push('nullability-encoding');
  if (/case-order|order-sensitive|ordered-case|priority/.test(token)) kinds.push('order-sensitive-case');
  if (/generic|type-parameter|template-parameter/.test(token)) kinds.push('generic-variant');
  if (/repr|representation|layout/.test(token)) kinds.push('layout-representation');
  return kinds;
}

function representedAdtPatternKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function adtPatternMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.preserveSource ?? (input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target));
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-adt-pattern-target-evidence']),
    ...(missingKinds.length ? ['translation-adt-pattern-proof'] : []),
    ...(missingKinds.map((kind) => `translation-adt-pattern:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function adtPatternReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`ADT/pattern constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source enum/sum/pattern records are not represented by target ADT or tagged-union evidence.'] : []),
    ...(missingKinds.includes('exhaustiveness') ? ['Match or switch exhaustiveness requires target coverage proof.'] : []),
    ...(missingKinds.includes('payload-shape') ? ['Variant payload field or tuple shape is not represented in the target evidence.'] : []),
    ...(missingKinds.includes('tag-discriminator') ? ['Target discriminator/tag encoding is missing or unbound.'] : []),
    ...(missingKinds.includes('fallthrough') ? ['Switch/case fallthrough behavior requires explicit target proof.'] : []),
    ...(missingKinds.includes('guard-condition') ? ['Pattern guard conditions require target evaluation-order proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function adtPatternStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function adtPatternAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-adt-pattern-evidence';
  if (status === 'degraded') return 'review-adt-pattern-loss';
  if (status === 'satisfied') return 'attach-adt-pattern-record';
  return 'skip';
}

function adtPatternConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceAdtPatternIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetAdtPatternIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['variant-identity', 'payload-shape', 'tag-discriminator', 'match-dispatch', 'exhaustiveness', 'guard-condition', 'fallthrough', 'refutability', 'layout-representation'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingAdtPatternInput(input, route, routeEvidence) {
  const candidates = [
    input.adtPatternConstraint,
    input.translationAdtPatternConstraint,
    ...(input.adtPatternConstraints ?? []),
    ...routeEvidence.flatMap(adtPatternCandidatesFromRouteEvidence)
  ].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function adtPatternCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.adtPatternConstraint, record.translationAdtPatternConstraint, adtPatternEvidenceRecord(record) ? record : undefined, ...(record.adtPatternConstraints ?? []), ...(record.translationAdtPatternConstraints ?? [])].filter(Boolean);
}

function adtPatternEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalAdtPatternConstraintEvidence' || record?.schema === 'frontier.lang.universalAdtPatternConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.adtPatternConstraints?.length);
}

function routeMatch(candidate, route = {}) {
  return (!candidate.routeId || String(candidate.routeId) === String(route.id))
    && (!candidate.sourceLanguage || normalizeToken(candidate.sourceLanguage) === normalizeToken(route.sourceLanguage))
    && (!candidate.target || normalizeToken(candidate.target) === normalizeToken(route.target));
}

function list(...values) {
  return uniqueStrings(values.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).map(listValue).filter(Boolean).map(String));
}

function listValue(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object') return value;
  return value.name ?? value.id ?? value.symbolName ?? value.typeName ?? value.enumName ?? value.unionName ?? value.fieldName ?? value.caseName ?? value.variantName ?? value.kind ?? value.label;
}

function sameLanguage(source, target) {
  const sourceKey = normalizeToken(source);
  const targetKey = normalizeToken(target);
  return Boolean(sourceKey && targetKey && sourceKey === targetKey);
}

function match(filter, values) {
  const filters = (Array.isArray(filter) ? filter : filter === undefined || filter === null ? [] : [filter]).filter((item) => item !== null && item !== undefined);
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter((value) => value !== null && value !== undefined).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function uniqueAdtPatternRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.kind, record.adtKind, record.patternKind].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
