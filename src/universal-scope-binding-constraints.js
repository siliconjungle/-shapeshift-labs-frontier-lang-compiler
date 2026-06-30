import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalScopeBindingConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalScopeBindingConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeScopeBindingRecords('source', [
    ...(input.sourceScopeBindingRecords ?? []),
    ...(input.scopeBindingRecords ?? []),
    ...(input.bindingRecords ?? []),
    ...(input.scopeRecords ?? []),
    ...(input.useDefRecords ?? []),
    ...(input.nameResolutionRecords ?? []),
    ...(input.closureRecords ?? []),
    ...(input.imports ?? []).flatMap(scopeBindingRecordsFromImport)
  ]);
  const targetRecords = normalizeScopeBindingRecords('target', input.targetScopeBindingRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedScopeBindingKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = scopeBindingMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = scopeBindingReview(missingKinds, sourceRecords, targetRecords, input);
  const status = scopeBindingStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalScopeBindingConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalScopeBindingConstraintEvidence.v1',
    id: input.id ?? `scope_binding_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: scopeBindingAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceScopeBindingRecords: sourceRecords,
    targetScopeBindingRecords: targetRecords,
    scopeBindingConstraints: requiredKinds.map((kind) => scopeBindingConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      nameResolutionEquivalenceClaim: false,
      closureEquivalenceClaim: false,
      scopeEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Scope-binding constraints record name-resolution and use-def obligations for translation admission. They are not proof of equivalent target binding behavior.',
      ...(input.metadata ?? {})
    }
  };
}

export function scopeBindingConstraintMatches(evidence = {}, query = {}) {
  return match(query.scopeBindingConstraintStatus, [evidence.status])
    && match(query.scopeBindingConstraintAction, [evidence.action])
    && match(query.scopeBindingConstraintRequiredKind, evidence.requiredKinds)
    && match(query.scopeBindingConstraintRepresentedKind, evidence.representedKinds)
    && match(query.scopeBindingConstraintMissingKind, evidence.missingKinds)
    && match(query.scopeBindingConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.scopeBindingConstraintEvidenceId, evidence.evidenceIds);
}

export function scopeBindingConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingScopeBindingInput(input, route, routeEvidence);
  const sourceScopeBindingRecords = [...(explicit?.sourceScopeBindingRecords ?? []), ...(explicit?.scopeBindingRecords ?? []), ...(explicit?.bindingRecords ?? []), ...(explicit?.scopeRecords ?? []), ...(explicit?.useDefRecords ?? []), ...(explicit?.nameResolutionRecords ?? []), ...(explicit?.closureRecords ?? []), ...routeImports.flatMap(scopeBindingRecordsFromImport)];
  const targetScopeBindingRecords = [...(explicit?.targetScopeBindingRecords ?? [])];
  if (!explicit && !sourceScopeBindingRecords.length && !targetScopeBindingRecords.length) return undefined;
  return createUniversalScopeBindingConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceScopeBindingRecords, targetScopeBindingRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeScopeBindingRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = scopeBindingConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_scope_binding_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      bindingKind: record?.bindingKind ?? record?.kind ?? record?.scopeKind ?? record?.referenceKind,
      scopeId: record?.scopeId ?? record?.ownerScopeId,
      bindingId: record?.bindingId ?? record?.externalBindingId ?? record?.resolvedBindingId,
      declarationId: record?.declarationId ?? record?.symbolId,
      referenceId: record?.referenceId ?? record?.occurrenceId,
      name: record?.name ?? record?.localName ?? record?.resolvedName,
      namespace: record?.namespace,
      scopeType: record?.scopeType ?? record?.variableScopeType,
      lookupKind: record?.lookupKind ?? record?.resolutionKind,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function scopeBindingRecordsFromImport(imported) {
  return [
    ...(imported?.scopeBindingConstraints ?? []),
    ...(imported?.scopeBindingRecords ?? []),
    ...(imported?.bindingRecords ?? []),
    ...(imported?.scopeRecords ?? []),
    ...(imported?.useDefRecords ?? []),
    ...(imported?.nameResolutionRecords ?? []),
    ...(imported?.closureRecords ?? []),
    ...(imported?.metadata?.scopeUseDefEvidence?.bindings ?? []),
    ...(imported?.metadata?.scopeUseDefEvidence?.references ?? []),
    ...(imported?.metadata?.scopeManager?.scopes ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(scopeBindingLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(scopeBindingLikeRecord),
    ...(imported?.semanticIndex?.relations ?? []).filter(scopeBindingLikeRecord),
    ...(imported?.projectSymbolGraph?.scopeBindings ?? []),
    ...(imported?.projectSymbolGraph?.scopeReferences ?? []),
    ...(imported?.projectSymbolGraph?.relations ?? []).filter(scopeBindingLikeRecord),
    ...(imported?.nativeAst?.scopes ?? []),
    ...(imported?.nativeAst?.bindings ?? []),
    ...(imported?.nativeAst?.references ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(scopeBindingLikeRecord)
  ];
}

function scopeBindingLikeRecord(record = {}) {
  const token = String([record.kind, record.bindingKind, record.scopeKind, record.scopeType, record.referenceKind, record.predicate, record.lookupKind, record.resolutionKind, record.metadata?.kind].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.bindingId || record.externalBindingId || record.resolvedBindingId || record.referenceId || record.scopeId || record.resolvedName || /scope|binding|reference|use-def|usedef|name-resolution|closure|capture|shadow|hoist|receiver|this|super|namespace|lookup/.test(token));
}

function scopeBindingConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.bindingKind,
    record.kind,
    record.scopeKind,
    record.scopeType,
    record.referenceKind,
    record.lookupKind,
    record.resolutionKind,
    record.predicate,
    record.namespace,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.bindingId || record.externalBindingId || record.resolvedBindingId ? 'binding-identity' : undefined,
    record.referenceId || record.resolvedName || record.predicate === 'references' ? 'use-def-edge' : undefined,
    record.closure === true || record.captured === true ? 'closure-capture' : undefined,
    record.writeExpr === true || record.mutable === true ? 'mutable-capture' : undefined,
    record.shadowed === true ? 'shadowing' : undefined,
    record.hoisted === true ? 'hoisting' : undefined,
    record.typeOnly === true || record.isTypeReference === true ? 'type-namespace' : undefined,
    record.isValueReference === true ? 'value-namespace' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(scopeBindingKindForToken));
}

function scopeBindingKindForToken(token) {
  const kinds = [];
  if (/lexical|scope-chain|scope chain|lexical-scope/.test(token)) kinds.push('lexical-scope');
  if (/block-scope|block scope|let|const/.test(token)) kinds.push('block-scope');
  if (/function-scope|function scope|var-scope/.test(token)) kinds.push('function-scope');
  if (/module-scope|module scope|file-scope/.test(token)) kinds.push('module-scope');
  if (/namespace-scope|namespace|package-scope/.test(token)) kinds.push('namespace-scope');
  if (/binding-identity|binding id|externalbinding|symbol-binding/.test(token)) kinds.push('binding-identity');
  if (/use-def|usedef|reference|references|resolved-name|resolved-binding/.test(token)) kinds.push('use-def-edge');
  if (/shadow|shadowed/.test(token)) kinds.push('shadowing');
  if (/hoist|hoisted/.test(token)) kinds.push('hoisting');
  if (/temporal-dead-zone|tdz/.test(token)) kinds.push('temporal-dead-zone');
  if (/closure|capture|closed-over/.test(token)) kinds.push('closure-capture');
  if (/mutable-capture|write-capture|captured-mutable/.test(token)) kinds.push('mutable-capture');
  if (/this-binding|self-binding|receiver|receiver-binding/.test(token)) kinds.push('receiver-binding');
  if (/super-binding|super lookup|base-call/.test(token)) kinds.push('super-binding');
  if (/dynamic-lookup|dynamic-name|method-missing|eval|with-scope/.test(token)) kinds.push('dynamic-lookup');
  if (/late-binding|late lookup|runtime lookup/.test(token)) kinds.push('late-binding');
  if (/overload-resolution|overload|multimethod/.test(token)) kinds.push('overload-resolution');
  if (/destructur|binding-pattern/.test(token)) kinds.push('destructuring-binding');
  if (/pattern-binding|match-binding/.test(token)) kinds.push('pattern-binding');
  if (/global|implicit-global/.test(token)) kinds.push(token.includes('implicit') ? 'implicit-global' : 'global-binding');
  if (/type-value|value-namespace|type-namespace|namespace-conflict/.test(token)) kinds.push('type-value-namespace');
  if (/private-name|private-field|brand-check/.test(token)) kinds.push('private-name-binding');
  if (/label-binding|break-label|continue-label/.test(token)) kinds.push('label-binding');
  if (!kinds.length && (token === 'scope' || token === 'binding' || token === 'scope-binding')) kinds.push('scope-binding');
  return kinds;
}

function representedScopeBindingKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function scopeBindingMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-scope-binding-target-evidence']),
    ...(missingKinds.length ? ['translation-scope-binding-proof'] : []),
    ...(missingKinds.map((kind) => `translation-scope-binding:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function scopeBindingReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Scope-binding constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source binding/reference/name-resolution records are not represented by target scope-binding evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function scopeBindingStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function scopeBindingAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-scope-binding-evidence';
  if (status === 'degraded') return 'review-scope-binding-loss';
  if (status === 'satisfied') return 'attach-scope-binding-record';
  return 'skip';
}

function scopeBindingConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceScopeBindingIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetScopeBindingIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['binding-identity', 'use-def-edge', 'closure-capture', 'mutable-capture', 'receiver-binding', 'super-binding', 'dynamic-lookup', 'late-binding', 'overload-resolution', 'type-value-namespace', 'private-name-binding'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingScopeBindingInput(input, route, routeEvidence) {
  const candidates = [input.scopeBindingConstraint, input.translationScopeBindingConstraint, ...(input.scopeBindingConstraints ?? []), ...routeEvidence.map((record) => record?.scopeBindingConstraint ?? record?.translationScopeBindingConstraint)].filter(Boolean);
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
