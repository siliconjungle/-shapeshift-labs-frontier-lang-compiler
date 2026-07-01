import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalCollectionSemanticsConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalCollectionSemanticsConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id;
  const sourceLanguage = input.sourceLanguage ?? route.sourceLanguage;
  const target = input.target ?? route.target;
  const mode = input.mode ?? route.mode;
  const sourceRecords = normalizeCollectionRecords('source', [
    ...(input.sourceCollectionSemanticsRecords ?? []),
    ...(input.collectionSemanticsRecords ?? []),
    ...(input.collectionRecords ?? []),
    ...(input.containerRecords ?? []),
    ...(input.arrayRecords ?? []),
    ...(input.mapRecords ?? []),
    ...(input.setRecords ?? []),
    ...(input.iteratorRecords ?? []),
    ...(input.sequenceRecords ?? []),
    ...(input.sourceCollectionSemanticsConstraints ?? []),
    ...(input.collectionSemanticsConstraints ?? []),
    ...(input.imports ?? []).flatMap(collectionRecordsFromImport)
  ]);
  const targetRecords = normalizeCollectionRecords('target', [
    ...(input.targetCollectionSemanticsRecords ?? []),
    ...(input.targetCollectionSemanticsConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedCollectionKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = collectionMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = collectionReview(missingKinds, sourceRecords, targetRecords, context);
  const status = collectionStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalCollectionSemanticsConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalCollectionSemanticsConstraintEvidence.v1',
    id: input.id ?? `collection_semantics_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`,
    routeId,
    sourceLanguage,
    target,
    status,
    action: collectionAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceRecords,
    targetRecords,
    collectionSemanticsConstraints: requiredKinds.map((kind) => collectionConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: { collectionEquivalenceClaim: false, orderingEquivalenceClaim: false, lookupEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { note: 'Collection-semantics constraints model container behavior for translation admission. They are not proof of equivalent target execution.', ...(input.metadata ?? {}) }
  };
}

export function collectionSemanticsConstraintMatches(evidence = {}, query = {}) {
  return match(query.collectionSemanticsConstraintStatus, [evidence.status])
    && match(query.collectionSemanticsConstraintAction, [evidence.action])
    && match(query.collectionSemanticsConstraintRequiredKind, evidence.requiredKinds)
    && match(query.collectionSemanticsConstraintRepresentedKind, evidence.representedKinds)
    && match(query.collectionSemanticsConstraintMissingKind, evidence.missingKinds)
    && match(query.collectionSemanticsConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.collectionSemanticsConstraintEvidenceId, evidence.evidenceIds);
}

export function collectionSemanticsConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const explicit = matchingCollectionInput(input, route, routeEvidence);
  const sourceRecords = [
    ...(explicit?.sourceCollectionSemanticsRecords ?? []),
    ...(explicit?.collectionSemanticsRecords ?? []),
    ...(explicit?.collectionRecords ?? []),
    ...(explicit?.containerRecords ?? []),
    ...(explicit?.arrayRecords ?? []),
    ...(explicit?.mapRecords ?? []),
    ...(explicit?.setRecords ?? []),
    ...(explicit?.iteratorRecords ?? []),
    ...(explicit?.sequenceRecords ?? []),
    ...(explicit?.sourceCollectionSemanticsConstraints ?? []),
    ...(explicit?.collectionSemanticsConstraints ?? []),
    ...routeImports.flatMap(collectionRecordsFromImport)
  ];
  const targetRecords = [...(explicit?.targetCollectionSemanticsRecords ?? []), ...(explicit?.targetCollectionSemanticsConstraints ?? [])];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalCollectionSemanticsConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceCollectionSemanticsRecords: sourceRecords, targetCollectionSemanticsRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...routeEvidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeCollectionRecords(role, records) {
  return uniqueCollectionRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = collectionConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_collection_${index + 1}_${idFragment(constraintKinds.join('_'))}`, role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.typeName ?? record?.collectionTypeName, symbolId: record?.symbolId ?? record?.id,
      collectionKind: record?.collectionKind ?? record?.containerKind ?? record?.kind ?? record?.typeKind, elementKind: record?.elementKind ?? record?.elementType,
      keyKind: record?.keyKind ?? record?.keyType, valueKind: record?.valueKind ?? record?.valueType, ordering: record?.ordering ?? record?.orderKind,
      iterationOrder: record?.iterationOrder ?? record?.traversalOrder, duplicatePolicy: record?.duplicatePolicy ?? record?.duplicates,
      equality: record?.equality ?? record?.equalitySemantics, hash: record?.hash ?? record?.hashSemantics, comparator: record?.comparator ?? record?.comparison,
      indexBase: record?.indexBase, boundsBehavior: record?.boundsBehavior ?? record?.bounds, lengthSemantics: record?.lengthSemantics ?? record?.sizeSemantics,
      sparseSemantics: record?.sparseSemantics ?? record?.holes, mutability: record?.mutability ?? record?.collectionMutability, persistence: record?.persistence ?? record?.persistent,
      copyOnWrite: record?.copyOnWrite ?? record?.cow, iteratorInvalidation: record?.iteratorInvalidation ?? record?.invalidation, traversal: record?.traversal ?? record?.laziness,
      capacityGrowth: record?.capacityGrowth ?? record?.growth, concurrency: record?.concurrency ?? record?.threadSafety, constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path, sourceHash: record?.sourceHash, sourceSpan: record?.sourceSpan, evidenceIds: record?.evidenceIds ?? []
    }];
  }));
}

function collectionRecordsFromImport(imported) {
  return uniqueCollectionRecords([
    ...(imported?.collectionSemanticsConstraints ?? []),
    ...(imported?.collectionSemanticsRecords ?? []),
    ...(imported?.collectionRecords ?? []),
    ...(imported?.containerRecords ?? []),
    ...(imported?.arrayRecords ?? []),
    ...(imported?.mapRecords ?? []),
    ...(imported?.setRecords ?? []),
    ...(imported?.iteratorRecords ?? []),
    ...(imported?.sequenceRecords ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(collectionLikeRecord),
    ...(imported?.semanticIndex?.facts ?? []).filter(collectionLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(collectionLikeRecord),
    ...(imported?.nativeAst?.expressions ?? []).filter(collectionLikeRecord)
  ]);
}

function collectionLikeRecord(record = {}) {
  const token = String([record.kind, record.collectionKind, record.containerKind, record.typeKind, record.valueKind, record.operator, record.predicate, record.capability, record.ordering, record.iterationOrder, record.equality, record.hash, record.comparator].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.collectionKind || record.containerKind || record.keyKind || record.elementKind || record.indexBase !== undefined || record.boundsBehavior || record.lengthSemantics || record.sparseSemantics || record.iteratorInvalidation || /array|list|vector|slice|map|dict|dictionary|set|tuple|range|collection|container|iterator|iterable|sequence|ordered|hash|comparator|duplicate|sparse|hole|bounds|length|capacity|copy-on-write|persistent|lazy/.test(token));
}

function collectionConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([
    primitiveToken, record.collectionKind, record.containerKind, record.kind, record.typeKind, record.valueKind, record.operator, record.predicate, record.capability,
    record.elementKind, record.elementType, record.keyKind, record.keyType, record.valueType, record.ordering, record.orderKind, record.iterationOrder, record.traversalOrder,
    record.duplicatePolicy, record.duplicates, record.equality, record.equalitySemantics, record.hash, record.hashSemantics, record.comparator, record.comparison,
    record.indexBase !== undefined ? 'index-semantics' : undefined, record.boundsBehavior, record.bounds, record.lengthSemantics, record.sizeSemantics, record.sparseSemantics, record.holes,
    record.mutability, record.collectionMutability, record.persistence, record.persistent, record.copyOnWrite, record.cow, record.iteratorInvalidation, record.invalidation,
    record.traversal, record.laziness, record.capacityGrowth, record.growth, record.concurrency, record.threadSafety, ...(record.constraintKinds ?? []), ...(record.factKinds ?? []), ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(collectionKindForToken));
}

function collectionKindForToken(token) {
  const kinds = [];
  if (/array|list|vector|slice|map|dict|dictionary|set|tuple|range|collection|container|iterator|iterable|sequence/.test(token)) kinds.push('collection-type');
  if (/ordered|order|sequence-order|stable-order|insertion-order|sorted/.test(token)) kinds.push('sequence-order');
  if (/index|offset|subscript|zero-based|one-based/.test(token)) kinds.push('index-semantics');
  if (/bounds|out-of-range|range-check|panic|throw|undefined/.test(token)) kinds.push('bounds-semantics');
  if (/length|size|count|cardinality/.test(token)) kinds.push('length-semantics');
  if (/slice|splice|subarray|sublist|range/.test(token)) kinds.push('collection-slicing');
  if (/sparse|hole|empty-slot|elision/.test(token)) kinds.push('sparse-holes');
  if (/iteration|iterator|iterable|enumerat|traversal/.test(token)) kinds.push('iteration-order');
  if (/duplicate|dedupe|multiset|bag/.test(token)) kinds.push('duplicate-policy');
  if (/key|lookup|map|dict|dictionary|hashmap/.test(token)) kinds.push('map-key-semantics');
  if (/set|membership|contains|unique/.test(token)) kinds.push('set-membership');
  if (/equality|equivalence|samevalue|object-is|deep-equal/.test(token)) kinds.push('key-equality');
  if (/hash|hashcode|hashable/.test(token)) kinds.push('hash-semantics');
  if (/comparator|compare|ordering-function|sort/.test(token)) kinds.push('comparator-semantics');
  if (/mutable|immutable|readonly|frozen/.test(token)) kinds.push('mutability');
  if (/persistent|structural-sharing|immutable-data/.test(token)) kinds.push('persistence');
  if (/copy-on-write|cow/.test(token)) kinds.push('copy-on-write');
  if (/invalidation|iterator-invalid|concurrent-modification/.test(token)) kinds.push('iterator-invalidation');
  if (/lazy|eager|generator|stream/.test(token)) kinds.push('lazy-evaluation');
  if (/capacity|growth|reserve|realloc/.test(token)) kinds.push('capacity-growth');
  if (/thread|concurrent|sync|lock-free|atomic/.test(token)) kinds.push('concurrency-safety');
  return kinds;
}

function representedCollectionKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function collectionMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  return uniqueStrings([
    ...(targetRecords.length || input.preserveSource ? [] : ['translation-collection-semantics-target-evidence']),
    ...(missingKinds.length ? ['translation-collection-semantics-proof'] : []),
    ...missingKinds.map((kind) => `translation-collection-semantics:${kind}`),
    ...(input.missingEvidence ?? [])
  ]);
}

function collectionReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Collection semantics are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source collection behavior is not represented by target collection-semantics evidence.'] : []),
    ...(missingKinds.some((kind) => ['sequence-order', 'iteration-order', 'duplicate-policy', 'sparse-holes'].includes(kind)) ? ['Ordering, duplicate, sparse-array, and iteration behavior require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => ['map-key-semantics', 'set-membership', 'key-equality', 'hash-semantics', 'comparator-semantics'].includes(kind)) ? ['Lookup, membership, equality, hashing, and comparator semantics require source-bound target evidence.'] : []),
    ...(missingKinds.some((kind) => ['mutability', 'persistence', 'copy-on-write', 'iterator-invalidation', 'lazy-evaluation'].includes(kind)) ? ['Mutation, persistence, copy-on-write, iterator invalidation, and laziness require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => ['index-semantics', 'bounds-semantics', 'length-semantics', 'collection-slicing', 'capacity-growth', 'concurrency-safety'].includes(kind)) ? ['Indexing, bounds, length, slicing, growth, and concurrency semantics require explicit target proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function collectionStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function collectionAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-collection-semantics-evidence';
  if (status === 'degraded') return 'review-collection-semantics-loss';
  if (status === 'satisfied') return 'attach-collection-semantics-record';
  return 'skip';
}

function collectionConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceCollectionSemanticsIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetCollectionSemanticsIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['sequence-order', 'index-semantics', 'bounds-semantics', 'sparse-holes', 'map-key-semantics', 'set-membership', 'key-equality', 'hash-semantics', 'comparator-semantics', 'mutability', 'iterator-invalidation', 'lazy-evaluation', 'concurrency-safety'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingCollectionInput(input, route, routeEvidence) {
  const candidates = [input.collectionSemanticsConstraint, input.translationCollectionSemanticsConstraint, ...(input.collectionSemanticsConstraints ?? []), ...routeEvidence.flatMap(collectionCandidatesFromRouteEvidence)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function collectionCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.collectionSemanticsConstraint, record.translationCollectionSemanticsConstraint, collectionEvidenceRecord(record) ? record : undefined, ...(record.collectionSemanticsConstraints ?? []), ...(record.translationCollectionSemanticsConstraints ?? [])].filter(Boolean);
}

function collectionEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalCollectionSemanticsConstraintEvidence' || record?.schema === 'frontier.lang.universalCollectionSemanticsConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.collectionSemanticsConstraints?.length);
}

function routeMatch(candidate, route = {}) {
  return (!candidate.routeId || String(candidate.routeId) === String(route.id))
    && (!candidate.sourceLanguage || normalizeToken(candidate.sourceLanguage) === normalizeToken(route.sourceLanguage))
    && (!candidate.target || normalizeToken(candidate.target) === normalizeToken(route.target));
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

function uniqueCollectionRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.kind, record.collectionKind, record.containerKind, record.typeKind].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
