import { uniqueStrings } from './native-import-utils.js';

export const UniversalRepresentationConstructKinds = Object.freeze([
  'source-import',
  'semantic-symbol',
  'source-map',
  'parser-feature',
  'source-preservation',
  'declaration-stub',
  'target-adapter',
  'runtime-capability',
  'dialect-projection',
  'semantic-ownership',
  'proof-evidence'
]);

export function createUniversalRepresentationCoverage(input = {}) {
  const language = input.sourceLanguage ?? input.language?.language ?? input.language;
  const target = input.target ?? input.targetCell?.target;
  const imports = input.imports ?? input.language?.imports ?? {};
  const parser = input.parser ?? input.language?.parser ?? {};
  const projection = input.projection ?? input.language?.projection ?? {};
  const runtime = input.runtime ?? {};
  const dialect = input.dialect ?? {};
  const mergeRefs = input.mergeRefs ?? {};
  const evidence = input.evidence ?? [];
  const constructs = representationConstructs({
    evidence,
    imports,
    mergeRefs,
    parser,
    projection,
    runtime,
    dialect,
    targetCell: input.targetCell
  });
  const missing = missingRepresentation({ imports, parser, projection, runtime, dialect, mergeRefs, evidence });
  const blockers = representationBlockers({ imports, parser, runtime, dialect, missing });
  const review = representationReview({ imports, parser, projection, runtime, dialect, targetCell: input.targetCell });
  return {
    kind: 'frontier.lang.universalRepresentationCoverage',
    version: 1,
    language,
    target,
    constructKinds: uniqueStrings(constructs.map((item) => item.kind)),
    constructs,
    surfaces: representationSurfaces({ imports, parser, projection, runtime, dialect, mergeRefs, evidence }),
    missing,
    blockers,
    review,
    summary: {
      constructs: constructs.length,
      representedConstructs: constructs.filter((item) => item.status === 'represented').length,
      reviewConstructs: constructs.filter((item) => item.status === 'review').length,
      blockedConstructs: constructs.filter((item) => item.status === 'blocked').length,
      missing: missing.length,
      blockers: blockers.length,
      review: review.length
    },
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function representationCoverageMatches(coverage, query = {}) {
  return match(query.constructKind ?? query.construct, coverage?.constructKinds)
    && match(query.runtimeCapability, coverage?.surfaces?.runtime?.requiredCapabilities)
    && match(query.dialectConstructKind, coverage?.surfaces?.dialect?.constructKinds)
    && match(query.dialectReadiness, [coverage?.surfaces?.dialect?.readiness])
    && match(query.sourceMapPrecision, coverage?.surfaces?.sourceMaps?.precisions)
    && match(query.transformIdentityHash, coverage?.surfaces?.mergeRefs?.transformIdentityHashes);
}

function representationConstructs(input) {
  return uniqueConstructs([
    construct('source-import', input.imports.total ? 'represented' : 'missing', 'native-import', input.imports.total),
    construct('semantic-symbol', input.imports.symbols ? 'represented' : 'missing', 'semantic-index', input.imports.symbols),
    construct('source-map', input.imports.sourceMapMappings ? 'represented' : 'review', 'source-map', input.imports.sourceMapMappings),
    construct('parser-feature', input.parser.rows ? 'represented' : 'missing', 'parser', input.parser.rows),
    construct('source-preservation', input.projection.sourceProjection?.exactSource?.evidence?.importsWithExactSource ? 'represented' : 'review', 'projection', input.projection.sourceProjection?.exactSource?.evidence?.importsWithExactSource),
    construct('declaration-stub', input.projection.sourceProjection?.stubs?.evidence?.importsWithDeclarations ? 'represented' : 'review', 'projection', input.projection.sourceProjection?.stubs?.evidence?.importsWithDeclarations),
    construct('target-adapter', input.targetCell?.adapter ? 'represented' : input.targetCell?.lossClass === 'missingAdapter' ? 'blocked' : 'review', 'target-projection', input.targetCell?.adapter ? 1 : 0),
    ...runtimeConstructs(input.runtime),
    ...dialectConstructs(input.dialect),
    construct('semantic-ownership', input.mergeRefs.semanticOwnershipKeys?.length ? 'represented' : 'review', 'merge-refs', input.mergeRefs.semanticOwnershipKeys?.length),
    construct('proof-evidence', proofEvidenceCount(input.evidence) ? 'represented' : 'review', 'evidence', proofEvidenceCount(input.evidence))
  ]);
}

function dialectConstructs(dialect) {
  if (!(dialect.records ?? []).length) return [];
  return [construct('dialect-projection', dialect.readiness === 'blocked' ? 'blocked' : dialect.readiness === 'ready' ? 'represented' : 'review', 'dialect-projection', dialect.records.length)];
}

function construct(kind, status, surface, count = 0) {
  return {
    kind,
    status,
    surface,
    count: Number(count ?? 0),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function runtimeConstructs(runtime) {
  return (runtime.requiredCapabilities ?? []).map((capability) => construct(
    'runtime-capability',
    (runtime.missingCapabilities ?? []).includes(capability) ? 'blocked' : (runtime.adapterRequirements ?? []).some((entry) => entry.capability === capability) ? 'review' : 'represented',
    `runtime:${capability}`,
    1
  ));
}

function representationSurfaces(input) {
  return {
    sourceImport: { total: Number(input.imports.total ?? 0), readiness: input.imports.readiness },
    semanticIndex: { symbols: Number(input.imports.symbols ?? 0), sourceMapMappings: Number(input.imports.sourceMapMappings ?? 0) },
    sourceMaps: { mappings: Number(input.imports.sourceMapMappings ?? 0), precisions: sourceMapPrecisions(input) },
    parser: { rows: Number(input.parser.rows ?? 0), mergeReadyParsers: input.parser.mergeReadyParsers ?? [] },
    projection: {
      targetEntries: input.projection.targets?.length ?? 0,
      missingTargets: input.projection.missingTargets ?? [],
      unsupportedTargets: input.projection.unsupportedTargets ?? []
    },
    runtime: {
      requiredCapabilities: input.runtime.requiredCapabilities ?? [],
      satisfiedCapabilities: input.runtime.satisfiedCapabilities ?? [],
      missingCapabilities: input.runtime.missingCapabilities ?? [],
      adapterRequirements: (input.runtime.adapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean)
    },
    dialect: {
      readiness: input.dialect.readiness ?? 'ready',
      registryIds: input.dialect.registryIds ?? [],
      recordIds: input.dialect.recordIds ?? [],
      constructKinds: input.dialect.constructKinds ?? [],
      externKinds: input.dialect.externKinds ?? [],
      projectionDispositions: input.dialect.projectionDispositions ?? []
    },
    mergeRefs: {
      ownershipKeys: input.mergeRefs.semanticOwnershipKeys ?? [],
      conflictKeys: input.mergeRefs.conflictKeys ?? [],
      sourceMapIds: input.mergeRefs.sourceMapIds ?? [],
      sourceMapMappingIds: input.mergeRefs.sourceMapMappingIds ?? [],
      transformIdentityHashes: input.mergeRefs.transformIdentityHashes ?? []
    },
    evidence: {
      records: input.evidence.length,
      proofRecords: proofEvidenceCount(input.evidence)
    }
  };
}

function missingRepresentation(input) {
  return uniqueStrings([
    ...(input.imports.total ? [] : ['source-import']),
    ...(input.imports.symbols ? [] : ['semantic-symbol']),
    ...(input.imports.sourceMapMappings ? [] : ['source-map']),
    ...(input.parser.rows ? [] : ['parser-feature']),
    ...((input.projection.sourceProjection?.exactSource?.evidence?.importsWithExactSource ?? 0) ? [] : ['source-preservation']),
    ...(input.mergeRefs.semanticOwnershipKeys?.length ? [] : ['semantic-ownership']),
    ...(proofEvidenceCount(input.evidence) ? [] : ['proof-evidence'])
  ]);
}

function representationBlockers(input) {
  return uniqueStrings([
    ...(input.imports.total ? [] : ['No source import evidence is available.']),
    ...(input.parser.rows ? [] : ['No parser feature evidence is available.']),
    ...((input.runtime.missingCapabilities ?? []).map((capability) => `Runtime capability is missing: ${capability}.`)),
    ...(input.dialect.blockers ?? [])
  ]);
}

function representationReview(input) {
  return uniqueStrings([
    ...((input.imports.losses ?? 0) ? [`Native import has ${input.imports.losses} loss record(s).`] : []),
    ...((input.parser.reviewFeatures ?? []).map((feature) => `Parser feature needs review: ${feature}.`)),
    ...((input.projection.unsupportedTargets ?? []).map((target) => `Target projection has unsupported features for ${target}.`)),
    ...((input.runtime.adapterRequirements ?? []).map((entry) => entry.reason).filter(Boolean)),
    ...(input.dialect.review ?? []),
    ...(input.targetCell?.reason ? [input.targetCell.reason] : [])
  ]);
}

function sourceMapPrecisions(input) {
  return uniqueStrings([
    ...(input.imports.sourceMapMappings ? ['imported'] : []),
    ...(input.mergeRefs.sourceMapMappingIds?.length ? ['mapped'] : []),
    ...(input.projection.sourceProjection?.exactSource?.evidence?.importsWithExactSource ? ['exact-source'] : []),
    ...(input.projection.sourceProjection?.stubs?.evidence?.importsWithDeclarations ? ['declaration'] : [])
  ]);
}

function proofEvidenceCount(evidence) {
  return (evidence ?? []).filter((record) => record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success').length;
}

function uniqueConstructs(constructs) {
  const seen = new Set();
  return constructs.filter((item) => {
    const key = `${item.kind}:${item.surface}:${item.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
