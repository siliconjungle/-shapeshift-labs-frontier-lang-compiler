import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalMetaprogrammingConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalMetaprogrammingConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeExpansionRecords('source', [
    ...(input.sourceMetaprogrammingRecords ?? []),
    ...(input.metaprogrammingRecords ?? []),
    ...(input.expansionRecords ?? []),
    ...(input.macroRecords ?? []),
    ...(input.decoratorRecords ?? []),
    ...(input.templateRecords ?? []),
    ...(input.codegenRecords ?? []),
    ...(input.imports ?? []).flatMap(expansionRecordsFromImport)
  ]);
  const targetRecords = normalizeExpansionRecords('target', input.targetMetaprogrammingRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedExpansionKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = expansionMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = expansionReview(missingKinds, sourceRecords, targetRecords, input);
  const status = expansionStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalMetaprogrammingConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalMetaprogrammingConstraintEvidence.v1',
    id: input.id ?? `metaprogramming_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: expansionAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceMetaprogrammingRecords: sourceRecords,
    targetMetaprogrammingRecords: targetRecords,
    metaprogrammingConstraints: requiredKinds.map((kind) => expansionConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      expansionEquivalenceClaim: false,
      macroHygieneClaim: false,
      generatedSourceEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Metaprogramming constraints record macro, template, decorator, preprocessor, and generated-code obligations for translation admission. They are not expansion-equivalence proof.',
      ...(input.metadata ?? {})
    }
  };
}

export function metaprogrammingConstraintMatches(evidence = {}, query = {}) {
  return match(query.metaprogrammingConstraintStatus, [evidence.status])
    && match(query.metaprogrammingConstraintAction, [evidence.action])
    && match(query.metaprogrammingConstraintRequiredKind, evidence.requiredKinds)
    && match(query.metaprogrammingConstraintRepresentedKind, evidence.representedKinds)
    && match(query.metaprogrammingConstraintMissingKind, evidence.missingKinds)
    && match(query.metaprogrammingConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.metaprogrammingConstraintEvidenceId, evidence.evidenceIds);
}

export function metaprogrammingConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingExpansionInput(input, route, routeEvidence);
  const sourceMetaprogrammingRecords = [...(explicit?.sourceMetaprogrammingRecords ?? []), ...(explicit?.metaprogrammingRecords ?? []), ...(explicit?.expansionRecords ?? []), ...(explicit?.macroRecords ?? []), ...(explicit?.decoratorRecords ?? []), ...(explicit?.templateRecords ?? []), ...(explicit?.codegenRecords ?? []), ...routeImports.flatMap(expansionRecordsFromImport)];
  const targetMetaprogrammingRecords = [...(explicit?.targetMetaprogrammingRecords ?? [])];
  if (!explicit && !sourceMetaprogrammingRecords.length && !targetMetaprogrammingRecords.length) return undefined;
  return createUniversalMetaprogrammingConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceMetaprogrammingRecords, targetMetaprogrammingRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeExpansionRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = expansionConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_metaprogramming_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      expansionKind: record?.expansionKind ?? record?.kind ?? record?.macroKind ?? record?.templateKind ?? record?.decoratorKind,
      symbolId: record?.symbolId ?? record?.nodeId,
      expansionId: record?.expansionId,
      generatorId: record?.generatorId,
      generatedSourcePath: record?.generatedSourcePath,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      expandedHash: record?.expandedHash ?? record?.generatedHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function expansionRecordsFromImport(imported) {
  return [
    ...(imported?.metaprogrammingConstraints ?? []),
    ...(imported?.metaprogrammingRecords ?? []),
    ...(imported?.expansionRecords ?? []),
    ...(imported?.macroRecords ?? []),
    ...(imported?.decoratorRecords ?? []),
    ...(imported?.templateRecords ?? []),
    ...(imported?.codegenRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(expansionLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(expansionLikeRecord),
    ...(imported?.nativeAst?.macros ?? []),
    ...(imported?.nativeAst?.templates ?? []),
    ...(imported?.nativeAst?.decorators ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(expansionLikeRecord)
  ];
}

function expansionLikeRecord(record = {}) {
  const token = String([record.kind, record.expansionKind, record.macroKind, record.templateKind, record.decoratorKind, record.generatorKind, record.predicate, record.capability, record.metadata?.kind].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.expansionId || record.generatedSourcePath || record.generatedHash || /macro|metaprogram|template|decorator|annotation|preprocessor|codegen|generated|derive|hygiene|expansion|const-eval|plugin|syntax-extension/.test(token));
}

function expansionConstraintKinds(record = {}) {
  const tokens = uniqueStrings([record.expansionKind, record.kind, record.macroKind, record.templateKind, record.decoratorKind, record.generatorKind, record.predicate, record.capability, ...(record.constraintKinds ?? []), ...(record.factKinds ?? []), ...(record.metadata?.factKinds ?? [])].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(expansionKindForToken));
}

function expansionKindForToken(token) {
  const kinds = [];
  if (/procedural-macro|proc-macro/.test(token)) kinds.push('procedural-macro');
  if (/declarative-macro|macro_rules|macro-rules/.test(token)) kinds.push('declarative-macro');
  if (/derive-macro|derive/.test(token)) kinds.push('derive-macro');
  if (/attribute-macro|attribute.*macro/.test(token)) kinds.push('attribute-macro');
  if (/macro-expansion|\bmacro\b/.test(token)) kinds.push('macro-expansion');
  if (/preprocessor.*include|#include|include/.test(token)) kinds.push('preprocessor-include');
  if (/preprocessor.*conditional|#if|ifdef|conditional-compilation|cfg\(/.test(token)) kinds.push('conditional-compilation');
  if (/token-paste|paste|concat-ident/.test(token)) kinds.push('token-paste');
  if (/stringification|stringify/.test(token)) kinds.push('stringification');
  if (/template-instantiation|template/.test(token)) kinds.push('template-instantiation');
  if (/generic-specialization|monomorph|specialization/.test(token)) kinds.push('generic-specialization');
  if (/decorator-transform|decorator/.test(token)) kinds.push('decorator-transform');
  if (/annotation-processor|annotation/.test(token)) kinds.push('annotation-processor');
  if (/compile-time-reflection|reflection/.test(token)) kinds.push('compile-time-reflection');
  if (/const-eval|constexpr|consteval|comptime/.test(token)) kinds.push('const-eval');
  if (/build-script|build-rs|build step/.test(token)) kinds.push('build-script');
  if (/generated-source|source-generated|codegen|generated-file/.test(token)) kinds.push('generated-source');
  if (/plugin-transform|babel|swc|compiler-plugin|transform-plugin/.test(token)) kinds.push('plugin-transform');
  if (/syntax-extension|language-extension/.test(token)) kinds.push('syntax-extension');
  if (/hygiene|capture|gensym/.test(token)) kinds.push('macro-hygiene');
  if (/expansion-order|phase-order|phase/.test(token)) kinds.push('expansion-order');
  if (/generated-source-map|source-map/.test(token)) kinds.push('generated-source-map');
  if (!kinds.length && (token === 'metaprogramming' || token === 'expansion')) kinds.push('metaprogramming');
  return kinds;
}

function representedExpansionKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function expansionMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-metaprogramming-target-evidence']),
    ...(missingKinds.length ? ['translation-metaprogramming-expansion-proof'] : []),
    ...(missingKinds.map((kind) => `translation-metaprogramming:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function expansionReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Metaprogramming constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source macro/template/decorator/generated-code semantics are not represented by target expansion evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function expansionStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function expansionAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-metaprogramming-evidence';
  if (status === 'degraded') return 'review-metaprogramming-loss';
  if (status === 'satisfied') return 'attach-metaprogramming-record';
  return 'skip';
}

function expansionConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceMetaprogrammingIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetMetaprogrammingIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['procedural-macro', 'attribute-macro', 'derive-macro', 'preprocessor-include', 'conditional-compilation', 'template-instantiation', 'decorator-transform', 'annotation-processor', 'build-script', 'generated-source', 'plugin-transform', 'macro-hygiene', 'expansion-order'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingExpansionInput(input, route, routeEvidence) {
  const candidates = [input.metaprogrammingConstraint, input.translationMetaprogrammingConstraint, ...(input.metaprogrammingConstraints ?? []), ...routeEvidence.map((record) => record?.metaprogrammingConstraint ?? record?.translationMetaprogrammingConstraint)].filter(Boolean);
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
