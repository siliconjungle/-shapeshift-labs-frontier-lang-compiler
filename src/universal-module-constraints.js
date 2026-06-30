import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalModuleConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalModuleConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceModules = normalizeModuleRecords('source', [
    ...(input.sourceModules ?? []),
    ...(input.modules ?? []),
    ...(input.imports ?? []).flatMap(moduleRecordsFromImport)
  ]);
  const targetModules = normalizeModuleRecords('target', input.targetModules ?? []);
  const requiredKinds = uniqueStrings(sourceModules.flatMap((record) => record.constraintKinds));
  const representedKinds = representedModuleKinds(requiredKinds, targetModules, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = moduleMissingEvidence(missingKinds, sourceModules, targetModules, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = moduleReview(missingKinds, sourceModules, targetModules, input);
  const status = moduleStatus({ sourceModules, targetModules, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalModuleConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalModuleConstraintEvidence.v1',
    id: input.id ?? `module_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: moduleAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceModules,
    targetModules,
    moduleConstraints: requiredKinds.map((kind) => moduleConstraintRecord(kind, sourceModules, targetModules, representedKinds)),
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...sourceModules.flatMap((record) => record.evidenceIds ?? []),
      ...targetModules.flatMap((record) => record.evidenceIds ?? [])
    ]),
    claims: {
      moduleEquivalenceClaim: false,
      linkageEquivalenceClaim: false,
      packageResolutionClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Module constraints record import/export/linkage obligations for translation admission. They are not proof of target module resolution or semantic equivalence.',
      ...(input.metadata ?? {})
    }
  };
}

export function moduleConstraintMatches(evidence = {}, query = {}) {
  return match(query.moduleConstraintStatus, [evidence.status])
    && match(query.moduleConstraintAction, [evidence.action])
    && match(query.moduleConstraintRequiredKind, evidence.requiredKinds)
    && match(query.moduleConstraintRepresentedKind, evidence.representedKinds)
    && match(query.moduleConstraintMissingKind, evidence.missingKinds)
    && match(query.moduleConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.moduleConstraintEvidenceId, evidence.evidenceIds);
}

export function moduleConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingModuleInput(input, route, routeEvidence);
  const sourceModules = [...(explicit?.sourceModules ?? []), ...(explicit?.modules ?? []), ...routeImports.flatMap(moduleRecordsFromImport)];
  const targetModules = [...(explicit?.targetModules ?? [])];
  if (!explicit && !sourceModules.length && !targetModules.length) return undefined;
  return createUniversalModuleConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceModules, targetModules, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeModuleRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = moduleConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_module_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      moduleKind: record?.moduleKind ?? record?.kind ?? record?.edgeKind ?? record?.declarationKind,
      specifier: record?.specifier ?? record?.source ?? record?.moduleSpecifier,
      importedName: record?.importedName ?? record?.importName,
      exportedName: record?.exportedName ?? record?.exportName,
      localName: record?.localName ?? record?.name,
      packageName: record?.packageName,
      packageSubpath: record?.packageSubpath ?? record?.subpath,
      packageCondition: record?.packageCondition ?? record?.condition,
      resolutionKind: record?.resolutionKind ?? record?.moduleResolutionKind,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      resolvedPath: record?.resolvedPath ?? record?.targetPath,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function moduleRecordsFromImport(imported) {
  return [
    ...(imported?.moduleConstraints ?? []),
    ...(imported?.modules ?? []),
    ...(imported?.moduleRecords ?? []),
    ...(imported?.importEdges ?? []),
    ...(imported?.exportEdges ?? []),
    ...(imported?.reExportIdentities ?? []),
    ...(imported?.outputProjectSymbolGraph?.importEdges ?? []),
    ...(imported?.outputProjectSymbolGraph?.exportRecords ?? []),
    ...(imported?.outputProjectSymbolGraph?.reExportIdentities ?? []),
    ...(imported?.projectSymbolGraph?.importEdges ?? []),
    ...(imported?.projectSymbolGraph?.exportRecords ?? []),
    ...(imported?.projectSymbolGraph?.reExportIdentities ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(moduleLikeRecord),
    ...(imported?.semanticIndex?.facts ?? []).filter(moduleLikeRecord),
    ...(imported?.nativeAst?.imports ?? []),
    ...(imported?.nativeAst?.exports ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(moduleLikeRecord)
  ];
}

function moduleLikeRecord(record = {}) {
  const token = String([
    record.role,
    record.kind,
    record.edgeKind,
    record.importKind,
    record.exportKind,
    record.resolutionKind,
    record.declarationKind,
    record.predicate
  ].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.specifier || record.importedName || record.exportedName || record.packageName || record.packageExportKey || record.packageImportKey || record.sourcePath || record.resolvedPath || /import|export|module|package|linkage|resolution|extern|abi/.test(token));
}

function moduleConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.moduleKind,
    record.kind,
    record.edgeKind,
    record.importKind,
    record.exportKind,
    record.resolutionKind,
    record.moduleResolutionKind,
    record.declarationKind,
    record.predicate,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.specifier ? 'module-specifier' : undefined,
    record.importedName ? 'import-edge' : undefined,
    record.exportedName ? 'export-binding' : undefined,
    record.reExportedName || record.reexportedName ? 're-export-edge' : undefined,
    record.packageName ? 'package' : undefined,
    record.packageExportKey ? 'package-export' : undefined,
    record.packageImportKey ? 'package-import' : undefined,
    record.packageCondition || record.condition ? 'package-runtime-condition' : undefined,
    record.importAttributes || record.assertions ? 'import-attributes' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(moduleKindForToken));
}

function moduleKindForToken(token) {
  if (/package.*runtime|runtime.*condition|condition|commonjs|esm|cjs|import\|require|module-type/.test(token)) return ['package-runtime-condition'];
  if (/package.*export|exports|export-map|subpath/.test(token)) return ['package-export'];
  if (/package.*import|imports|private-import|#internal/.test(token)) return ['package-import'];
  if (/re-export|reexport|export-star|export \*/.test(token)) return ['re-export-edge'];
  if (/side-effect/.test(token)) return ['side-effect-import'];
  if (/dynamic-import|import-call|import\(\)/.test(token)) return ['dynamic-import'];
  if (/import-attribute|attribute|assertion|with/.test(token)) return ['import-attributes'];
  if (/host|worker|worklet|serviceworker|importscripts|url|import-meta|require\.resolve|resolve/.test(token)) return ['host-dependency'];
  if (/resolution|resolved|resolver|path/.test(token)) return ['module-resolution'];
  if (/foreign|extern|linkage|linker|symbol-link|external/.test(token)) return ['foreign-linkage'];
  if (/abi|calling-convention/.test(token)) return ['abi-boundary'];
  if (/visibility|private|public|internal/.test(token)) return ['visibility'];
  if (/namespace/.test(token)) return ['namespace-import'];
  if (/default/.test(token)) return ['default-export'];
  if (/import-edge|import edge|import-declaration|import declaration|static-import|specifier|dependency|module-specifier/.test(token)) return ['import-edge'];
  if (/export-binding|named-export|local-export|export-declaration|public-export|export/.test(token)) return ['export-binding'];
  if (/module|source-path|sourcepath|file|unit|package/.test(token)) return ['module-identity'];
  return token === 'module' ? ['module-identity'] : [];
}

function representedModuleKinds(requiredKinds, targetModules, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetModules.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function moduleMissingEvidence(missingKinds, sourceModules, targetModules, input) {
  if (!sourceModules.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetModules.length || preserveSource ? [] : ['translation-module-constraint-target-evidence']),
    ...(missingKinds.length ? ['translation-module-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-module-constraint:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function moduleReview(missingKinds, sourceModules, targetModules, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Module constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceModules.length && !targetModules.length ? ['Source import/export/module records are not represented by target module evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function moduleStatus(input) {
  if (!input.sourceModules.length && !input.targetModules.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetModules.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function moduleAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-module-constraint-evidence';
  if (status === 'degraded') return 'review-module-constraint-loss';
  if (status === 'satisfied') return 'attach-module-constraint-record';
  return 'skip';
}

function moduleConstraintRecord(kind, sourceModules, targetModules, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceModuleIds: sourceModules.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetModuleIds: targetModules.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['package-runtime-condition', 'foreign-linkage', 'abi-boundary', 'host-dependency', 'module-resolution'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingModuleInput(input, route, routeEvidence) {
  const candidates = [input.moduleConstraint, input.translationModuleConstraint, ...(input.moduleConstraints ?? []), ...routeEvidence.map((record) => record?.moduleConstraint ?? record?.translationModuleConstraint)].filter(Boolean);
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
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
