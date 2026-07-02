import { idFragment, uniqueStrings } from './native-import-utils.js';
import { layoutStyleKindForToken } from './universal-layout-style-kind-tokens.js';

export const UniversalLayoutStyleConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalLayoutStyleConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeLayoutStyleRecords('source', [
    ...(input.sourceLayoutStyleRecords ?? []),
    ...(input.layoutStyleRecords ?? []),
    ...(input.styleRecords ?? []),
    ...(input.layoutRecords ?? []),
    ...(input.cssRecords ?? []),
    ...(input.renderRecords ?? []),
    ...(input.imports ?? []).flatMap(layoutStyleRecordsFromImport)
  ]);
  const targetRecords = normalizeLayoutStyleRecords('target', input.targetLayoutStyleRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedLayoutStyleKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = layoutStyleMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = layoutStyleReview(missingKinds, sourceRecords, targetRecords, input);
  const status = layoutStyleStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalLayoutStyleConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalLayoutStyleConstraintEvidence.v1',
    id: input.id ?? `layout_style_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: layoutStyleAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceLayoutStyleRecords: sourceRecords,
    targetLayoutStyleRecords: targetRecords,
    layoutStyleConstraints: requiredKinds.map((kind) => layoutStyleConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    sourceMapIds: uniqueStrings([...(input.sourceMapIds ?? []), ...sourceRecords.flatMap((record) => record.sourceMapIds ?? []), ...targetRecords.flatMap((record) => record.sourceMapIds ?? [])]),
    sourceMapMappingIds: uniqueStrings([...(input.sourceMapMappingIds ?? []), ...sourceRecords.flatMap((record) => record.sourceMapMappingIds ?? []), ...targetRecords.flatMap((record) => record.sourceMapMappingIds ?? [])]),
    proofObligationIds: uniqueStrings([...(input.proofObligationIds ?? []), ...sourceRecords.flatMap((record) => record.proofObligationIds ?? []), ...targetRecords.flatMap((record) => record.proofObligationIds ?? [])]),
    proofEvidenceIds: uniqueStrings([...(input.proofEvidenceIds ?? []), ...sourceRecords.flatMap((record) => record.proofEvidenceIds ?? []), ...targetRecords.flatMap((record) => record.proofEvidenceIds ?? [])]),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    failClosed: Boolean(input.failClosed || sourceRecords.some((record) => record.failClosed) || targetRecords.some((record) => record.failClosed) || missingEvidence.length),
    claims: {
      layoutStyleEquivalenceClaim: false,
      computedStyleEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      layoutEquivalenceClaim: false,
      styleEquivalenceClaim: false,
      visualEquivalenceClaim: false,
      browserEquivalenceClaim: false,
      browserRuntimeEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Layout/style constraints record UI rendering, cascade, selector, layout, focus, and accessibility obligations for translation admission. They are not proof of equivalent target rendering.',
      ...(input.metadata ?? {})
    }
  };
}

export function layoutStyleConstraintMatches(evidence = {}, query = {}) {
  return match(query.layoutStyleConstraintStatus, [evidence.status])
    && match(query.layoutStyleConstraintAction, [evidence.action])
    && match(query.layoutStyleConstraintRequiredKind, evidence.requiredKinds)
    && match(query.layoutStyleConstraintRepresentedKind, evidence.representedKinds)
    && match(query.layoutStyleConstraintMissingKind, evidence.missingKinds)
    && match(query.layoutStyleConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.layoutStyleConstraintEvidenceId, evidence.evidenceIds)
    && match(query.layoutStyleConstraintSourceMapId, evidence.sourceMapIds)
    && match(query.layoutStyleConstraintProofObligationId, evidence.proofObligationIds)
    && match(query.layoutStyleConstraintProofEvidenceId, evidence.proofEvidenceIds);
}

export function layoutStyleConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingLayoutStyleInput(input, route, routeEvidence);
  const sourceLayoutStyleRecords = [
    ...(explicit?.sourceLayoutStyleRecords ?? []),
    ...(explicit?.layoutStyleRecords ?? []),
    ...(explicit?.styleRecords ?? []),
    ...(explicit?.layoutRecords ?? []),
    ...(explicit?.cssRecords ?? []),
    ...(explicit?.renderRecords ?? []),
    ...routeImports.flatMap(layoutStyleRecordsFromImport)
  ];
  const targetLayoutStyleRecords = [...(explicit?.targetLayoutStyleRecords ?? [])];
  if (!explicit && !sourceLayoutStyleRecords.length && !targetLayoutStyleRecords.length) return undefined;
  return createUniversalLayoutStyleConstraintEvidence({
    ...explicit,
    route,
    routeId: route.id,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    imports: routeImports,
    sourceLayoutStyleRecords,
    targetLayoutStyleRecords,
    evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean)
  });
}

function normalizeLayoutStyleRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = layoutStyleConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_layout_style_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      kind: record?.kind,
      selector: record?.selector,
      styleProperty: record?.styleProperty ?? record?.cssProperty ?? record?.property,
      value: record?.value,
      computedValue: record?.computedValue,
      cascadeLayer: record?.cascadeLayer,
      specificity: record?.specificity,
      mediaQuery: record?.mediaQuery,
      containerQuery: record?.containerQuery,
      boxModel: record?.boxModel,
      layoutKind: record?.layoutKind,
      display: record?.display,
      position: record?.position,
      zIndex: record?.zIndex,
      writingMode: record?.writingMode,
      direction: record?.direction,
      viewport: record?.viewport,
      renderTreeId: record?.renderTreeId,
      styleRuleId: record?.styleRuleId,
      computedStyleHash: record?.computedStyleHash,
      layoutSnapshotHash: record?.layoutSnapshotHash,
      bitmapHash: record?.bitmapHash,
      accessibilityTreeHash: record?.accessibilityTreeHash,
      focusOrderHash: record?.focusOrderHash,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      sourceMapIds: asStrings(record?.sourceMapIds ?? record?.sourceMapId),
      sourceMapMappingIds: asStrings(record?.sourceMapMappingIds ?? record?.sourceMapMappingId),
      proofObligationIds: asStrings(record?.proofObligationIds ?? record?.proofObligationId),
      proofEvidenceIds: asStrings(record?.proofEvidenceIds ?? record?.proofEvidenceId),
      missingEvidence: asStrings(record?.missingEvidence),
      failClosed: Boolean(record?.failClosed),
      constraintKinds,
      evidenceIds: asStrings(record?.evidenceIds ?? record?.evidenceId)
    }];
  });
}

function layoutStyleRecordsFromImport(imported) {
  return [
    ...(imported?.layoutStyleConstraints ?? []),
    ...(imported?.layoutStyleRecords ?? []),
    ...(imported?.styleRecords ?? []),
    ...(imported?.cssRecords ?? []),
    ...(imported?.renderRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(layoutStyleLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(layoutStyleLikeRecord),
    ...(imported?.nativeAst?.styleRules ?? []),
    ...(imported?.nativeAst?.layoutRecords ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(layoutStyleLikeRecord)
  ];
}

function layoutStyleLikeRecord(record = {}) {
  const token = String([
    record.kind,
    record.selector,
    record.styleProperty,
    record.cssProperty,
    record.property,
    record.cascadeLayer,
    record.mediaQuery,
    record.containerQuery,
    record.display,
    record.position,
    record.layoutKind,
    record.predicate,
    record.capability
  ].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.selector || record.styleProperty || record.cssProperty || record.computedStyleHash || record.layoutSnapshotHash || record.bitmapHash || record.accessibilityTreeHash || record.focusOrderHash || /css|style|selector|cascade|specificity|media-query|container-query|box-model|layout|render|viewport|focus|accessibility|aria|dom/.test(token));
}

function layoutStyleConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.kind,
    record.layoutKind,
    record.styleProperty,
    record.cssProperty,
    record.property,
    record.cascadeLayer,
    record.mediaQuery,
    record.containerQuery,
    record.display,
    record.position,
    record.writingMode,
    record.direction,
    record.predicate,
    record.capability,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.selector ? 'selector-target' : undefined,
    record.value !== undefined ? 'declared-style-value' : undefined,
    record.computedValue !== undefined || record.computedStyleHash ? 'computed-style' : undefined,
    record.specificity ? 'specificity' : undefined,
    record.boxModel ? 'box-model' : undefined,
    record.zIndex !== undefined ? 'stacking-context' : undefined,
    record.viewport ? 'viewport' : undefined,
    record.renderTreeId ? 'render-tree' : undefined,
    record.styleRuleId ? 'style-rule' : undefined,
    record.layoutSnapshotHash ? 'layout-snapshot' : undefined,
    record.bitmapHash ? 'bitmap-snapshot' : undefined,
    record.accessibilityTreeHash ? 'accessibility-tree' : undefined,
    record.focusOrderHash ? 'focus-order' : undefined,
    (record.sourceMapIds?.length || record.sourceMapId) ? 'source-map' : undefined,
    (record.proofObligationIds?.length || record.proofObligationId || record.proofEvidenceIds?.length || record.proofEvidenceId || record.failClosed || record.missingEvidence?.length) ? 'layout-style-proof' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(layoutStyleKindForToken));
}

function representedLayoutStyleKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function layoutStyleMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-layout-style-target-evidence']),
    ...(missingKinds.length ? ['translation-layout-style-proof'] : []),
    ...(missingKinds.map((kind) => `translation-layout-style:${kind}`)),
    ...sourceRecords.flatMap((record) => record.missingEvidence ?? []),
    ...(input.missingEvidence ?? [])
  ]);
}

function layoutStyleReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Layout/style constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source UI layout/style semantics are not represented by target layout-style evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function layoutStyleStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function layoutStyleAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-layout-style-evidence';
  if (status === 'degraded') return 'review-layout-style-loss';
  if (status === 'satisfied') return 'attach-layout-style-record';
  return 'skip';
}

function layoutStyleConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceLayoutStyleIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetLayoutStyleIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    evidenceIds: uniqueStrings([...sourceRecords, ...targetRecords].filter((record) => record.constraintKinds.includes(kind)).flatMap((record) => record.evidenceIds)),
    missingEvidence: representedKinds.includes(kind) ? [] : [`translation-layout-style:${kind}`],
    severity: ['selector-target', 'computed-style', 'cascade-layer', 'specificity', 'layout-kind', 'display', 'position', 'stacking-context', 'layout-snapshot', 'accessibility-tree', 'focus-order'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingLayoutStyleInput(input, route, routeEvidence) {
  const candidates = [
    input.layoutStyleConstraint,
    input.translationLayoutStyleConstraint,
    ...(input.layoutStyleConstraints ?? []),
    ...routeEvidence.map((record) => record?.layoutStyleConstraint ?? record?.translationLayoutStyleConstraint)
  ].filter(Boolean);
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

function asStrings(value) {
  return uniqueStrings((Array.isArray(value) ? value : value === undefined ? [] : [value]).filter(Boolean).map(String));
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
