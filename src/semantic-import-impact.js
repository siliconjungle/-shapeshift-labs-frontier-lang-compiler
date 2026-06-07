import { countBy, idFragment, maxSemanticMergeReadiness, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import { semanticDependencyPredicateKey } from './semantic-import-dependencies.js';

function createSemanticImportImpact(input) {
  const relations = collectDependencyRelations(input.imports, input.dependencies);
  const proofRecords = collectProofRecords(input.imports);
  const paradigmRecords = collectParadigmRecords(input.imports);
  const symbolsByRegion = groupBy(input.symbols, (symbol) => symbol.ownershipRegionId);
  const symbolIds = new Set((input.symbols ?? []).map((symbol) => symbol.id).filter(Boolean));
  const records = [];
  for (const region of input.ownershipRegions ?? []) {
    const regionSymbols = symbolsForRegion(region, symbolsByRegion);
    const record = semanticImpactRecord({
      region,
      regionSymbols,
      relations: relations.filter((relation) => relationTouchesSymbols(relation, regionSymbols, symbolIds)),
      sourceMapMappings: sourceMapMappingsForSymbols(input.sourceMapMappings, regionSymbols),
      sourcePreservationRecords: preservationRecordsForSymbols(input.sourcePreservation?.records, regionSymbols),
      proofRecords: proofRecordsForSymbols(proofRecords, regionSymbols, region),
      paradigmRecords: paradigmRecordsForSymbols(paradigmRecords, regionSymbols, region),
      patchHints: (input.patchHints ?? []).filter((hint) => hint.ownershipRegionId === region.id || hint.ownershipKey === region.key),
      allSymbolIds: symbolIds,
      evidence: input.evidence ?? { failed: [], ids: [] },
      readiness: input.readiness
    });
    records.push(record);
  }
  return {
    kind: 'frontier.lang.semanticImpact',
    version: 1,
    records,
    summary: summarizeSemanticImpactRecords(records)
  };
}

function semanticImpactRecord(input) {
  const symbolIds = uniqueStrings(input.regionSymbols.map((symbol) => symbol.id).filter(Boolean));
  const dependencyPredicates = uniqueStrings(input.relations.map((relation) => semanticDependencyPredicateKey(relation.predicate)));
  const proof = summarizeProofImpact(input.proofRecords);
  const paradigm = summarizeParadigmImpact(input.paradigmRecords);
  const evidenceIds = relatedEvidenceIds(input);
  const readiness = input.regionSymbols.reduce(
    (current, symbol) => maxSemanticMergeReadiness(current, symbol.readiness),
    input.readiness
  );
  const verificationPlan = semanticImpactVerificationPlan({
    dependencyPredicates,
    proof,
    paradigm,
    evidenceIds,
    sourcePreservationRecords: input.sourcePreservationRecords,
    patchHints: input.patchHints,
    readiness
  });
  const risk = semanticImpactRisk({
    readiness,
    proof,
    failedEvidenceIds: input.evidence.failed ?? [],
    sourcePreservationRecords: input.sourcePreservationRecords,
    relationCount: input.relations.length,
    verificationPlan
  });
  return {
    id: `impact_${idFragment(input.region.id ?? input.region.key)}`,
    kind: 'ownership-region-impact',
    ownershipRegionId: input.region.id,
    ownershipKey: input.region.key,
    regionKind: input.region.regionKind,
    sourcePath: input.region.sourcePath,
    sourceHash: input.region.sourceHash,
    sourceSpan: input.region.sourceSpan,
    symbolIds,
    symbolNames: uniqueStrings(input.regionSymbols.map((symbol) => symbol.name).filter(Boolean)),
    dependencyRelationIds: input.relations.map((relation) => relation.id).filter(Boolean),
    dependencyPredicates,
    affectedSymbolIds: affectedSymbolIds(input.relations, symbolIds, input.allSymbolIds),
    sourceMapMappingIds: uniqueStrings([
      ...input.sourceMapMappings.map((mapping) => mapping.id),
      ...input.sourcePreservationRecords.map((record) => record.sourceMapMappingId)
    ].filter(Boolean)),
    sourcePreservationRecordIds: input.sourcePreservationRecords.map((record) => record.id).filter(Boolean),
    patchHintIds: input.patchHints.map((hint) => hint.id).filter(Boolean),
    proofSpecIds: proof.specIds,
    proofObligationIds: proof.obligationIds,
    failedProofObligationIds: proof.failedObligationIds,
    openProofObligationIds: proof.openObligationIds,
    paradigmSemanticIds: paradigm.semanticIds,
    loweringRecordIds: paradigm.loweringIds,
    evidenceIds,
    verificationPlan,
    conflictKeys: semanticImpactConflictKeys(input.region, symbolIds, input.relations, dependencyPredicates),
    readiness,
    risk,
    confidence: semanticImpactConfidence(input.region, input.sourceMapMappings, input.sourcePreservationRecords)
  };
}

function collectDependencyRelations(imports, dependencies) {
  const dependencyIds = new Set(dependencies?.ids ?? []);
  return uniqueRecordsById((imports ?? [])
    .flatMap((imported) => imported?.semanticIndex?.relations ?? imported?.universalAst?.semanticIndex?.relations ?? [])
    .filter((relation) => dependencyIds.has(relation?.id)));
}

function collectProofRecords(imports) {
  const records = [];
  for (const imported of imports ?? []) {
    const proof = imported?.universalAst?.proof ?? imported?.proof;
    if (!proof) continue;
    const proofGroups = [
      ['proof-record', proof.contracts, proof.refinements, proof.invariants, proof.termination, proof.temporal],
      ['obligation', proof.obligations],
      ['proof-record', proof.artifacts, proof.assumptions]
    ];
    for (const [proofRecordKind, ...groups] of proofGroups) for (const record of groups.flatMap((group) => group ?? [])) records.push({ ...record, proofSpecId: proof.id, proofRecordKind });
  }
  return records.filter(Boolean);
}

const ParadigmImpactGroups = Object.freeze([
  'bindingScopes', 'bindings', 'patterns', 'typeConstraints', 'evaluationModels',
  'memoryLocations', 'effectRegions', 'controlRegions', 'logicPrograms',
  'actorSystems', 'stackEffects', 'arrayShapes', 'numericKernels',
  'dataflowNetworks', 'clockModels', 'objectModels', 'macroExpansions',
  'reflectionBoundaries', 'loweringRecords'
]);

function collectParadigmRecords(imports) {
  const records = [];
  for (const imported of imports ?? []) {
    const semantics = imported?.universalAst?.paradigmSemantics ?? imported?.paradigmSemantics;
    if (!semantics) continue;
    for (const group of ParadigmImpactGroups) {
      for (const record of semantics[group] ?? []) records.push({ ...record, paradigmGroup: group, paradigmSpecId: semantics.id });
    }
  }
  return records.filter(Boolean);
}

function proofRecordsForSymbols(proofRecords, symbols, region) {
  const ids = new Set(symbols.map((symbol) => symbol.id).filter(Boolean));
  const mappingIds = new Set(symbols.map((symbol) => symbol.sourceMapMappingId).filter(Boolean));
  const nativeNodeIds = new Set(symbols.map((symbol) => symbol.nativeAstNodeId).filter(Boolean));
  const regionIds = new Set([region.id, region.key].filter(Boolean));
  return proofRecords.filter((record) => isImportWideProofRecord(record) || ids.has(record.subjectId) || ids.has(record.semanticSymbolId) || mappingIds.has(record.sourceMapMappingId) || nativeNodeIds.has(record.nativeAstNodeId) || regionIds.has(record.subjectId) || regionIds.has(record.ownershipRegionId));
}

function isImportWideProofRecord(record) {
  const kind = String(record?.subjectKind ?? '').toLowerCase();
  return (!record?.subjectId && !record?.semanticSymbolId && !record?.sourceMapMappingId && !record?.nativeAstNodeId && !record?.ownershipRegionId) || ['import', 'source', 'nativesource', 'document', 'proofspec'].includes(kind);
}

function paradigmRecordsForSymbols(records, symbols, region) {
  const symbolIds = new Set(symbols.map((symbol) => symbol.id).filter(Boolean));
  const mappingIds = new Set(symbols.map((symbol) => symbol.sourceMapMappingId).filter(Boolean));
  const nativeNodeIds = new Set(symbols.map((symbol) => symbol.nativeAstNodeId).filter(Boolean));
  const regionIds = new Set([region.id, region.key].filter(Boolean));
  return records.filter((record) => symbolIds.has(record.semanticSymbolId)
    || symbolIds.has(record.symbolId)
    || symbolIds.has(record.subjectId)
    || mappingIds.has(record.sourceMapMappingId)
    || nativeNodeIds.has(record.nativeAstNodeId)
    || regionIds.has(record.ownershipRegionId)
    || regionIds.has(record.subjectId));
}

function summarizeProofImpact(records) {
  const obligationRecords = records.filter((record) => record.proofRecordKind === 'obligation');
  const failed = obligationRecords.filter((record) => proofReadinessStatus(record.status) === 'failed');
  const open = obligationRecords.filter((record) => ['open', 'pending', 'unknown', 'stale', 'assumed', 'external-tool-required'].includes(proofReadinessStatus(record.status)));
  return {
    specIds: uniqueStrings(records.map((record) => record.proofSpecId).filter(Boolean)),
    obligationIds: uniqueStrings(obligationRecords.map((record) => record.id).filter(Boolean)),
    failedObligationIds: uniqueStrings(failed.map((record) => record.id).filter(Boolean)),
    openObligationIds: uniqueStrings(open.map((record) => record.id).filter(Boolean)),
    evidenceIds: uniqueStrings(records.flatMap((record) => record.evidenceIds ?? []).filter(Boolean))
  };
}

function summarizeParadigmImpact(records) {
  const lowering = records.filter((record) => record.paradigmGroup === 'loweringRecords');
  const semantic = records.filter((record) => record.paradigmGroup !== 'loweringRecords');
  return {
    semanticIds: uniqueStrings(semantic.map((record) => record.id).filter(Boolean)),
    loweringIds: uniqueStrings(lowering.map((record) => record.id).filter(Boolean)),
    evidenceIds: uniqueStrings(records.flatMap((record) => record.evidenceIds ?? []).filter(Boolean)),
    lossIds: uniqueStrings(records.flatMap((record) => record.lossIds ?? []).filter(Boolean))
  };
}

function proofReadinessStatus(status) {
  const value = String(status ?? 'unknown').trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (['accepted', 'checked', 'ok', 'passed', 'proved', 'qed', 'success', 'succeeded', 'valid', 'verified', 'discharged'].includes(value)) return 'discharged';
  if (['counterexample', 'cex', 'error', 'failed', 'falsified', 'invalid', 'rejected', 'violated'].includes(value)) return 'failed';
  if (['obsolete', 'outdated', 'stale'].includes(value)) return 'stale';
  if (['admit', 'admitted', 'assume', 'assumed', 'axiom', 'trusted', 'unchecked'].includes(value)) return 'assumed';
  if (['solver-required', 'prover-required', 'tool-required', 'external-tool-required'].includes(value)) return 'external-tool-required';
  if (['pending', 'todo', 'unproved', 'unverified'].includes(value)) return 'pending';
  if (value === 'open') return 'open';
  return 'unknown';
}

function symbolsForRegion(region, symbolsByRegion) {
  const symbols = [...(symbolsByRegion.get(region.id) ?? [])];
  if (symbols.length === 0 && region.symbolId) {
    symbols.push({ id: region.symbolId, name: region.symbolName, ownershipRegionId: region.id, readiness: 'needs-review' });
  }
  return symbols;
}

function relationTouchesSymbols(relation, symbols, allSymbolIds) {
  const ids = new Set(symbols.map((symbol) => symbol.id).filter(Boolean));
  if (ids.has(relation.sourceId) || ids.has(relation.targetId)) return true;
  return allSymbolIds.has(relation.sourceId) && allSymbolIds.has(relation.targetId) && ids.size === 0;
}

function sourceMapMappingsForSymbols(mappings, symbols) {
  const ids = new Set(symbols.map((symbol) => symbol.id).filter(Boolean));
  const mappingIds = new Set(symbols.map((symbol) => symbol.sourceMapMappingId).filter(Boolean));
  return uniqueRecordsById((mappings ?? []).filter((mapping) => ids.has(mapping.semanticSymbolId) || mappingIds.has(mapping.id)));
}

function preservationRecordsForSymbols(records, symbols) {
  const ids = new Set(symbols.map((symbol) => symbol.id).filter(Boolean));
  const mappingIds = new Set(symbols.map((symbol) => symbol.sourceMapMappingId).filter(Boolean));
  return uniqueRecordsById((records ?? []).filter((record) => ids.has(record.semanticSymbolId) || mappingIds.has(record.sourceMapMappingId)));
}

function relatedEvidenceIds(input) {
  return uniqueStrings([
    ...input.proofRecords.flatMap((record) => record.evidenceIds ?? []),
    ...input.paradigmRecords.flatMap((record) => record.evidenceIds ?? []),
    ...input.sourcePreservationRecords.flatMap((record) => record.evidenceIds ?? []),
    ...(input.evidence.failed ?? [])
  ].filter(Boolean));
}

function semanticImpactVerificationPlan(input) {
  const plan = [];
  if (input.dependencyPredicates.length > 0) plan.push({ kind: 'dependency-review', reason: 'region touches semantic dependency relations', required: true });
  if (input.sourcePreservationRecords.some((record) => record.level === 'estimated' || record.level === 'blocked')) plan.push({ kind: 'source-map-review', reason: 'source preservation is not exact', required: true });
  if (input.proof.failedObligationIds.length > 0) plan.push({ kind: 'reject-or-reprove', reason: 'failed proof obligations are linked', required: true });
  else if (input.proof.openObligationIds.length > 0) plan.push({ kind: 'proof-review', reason: 'open proof obligations are linked', required: true });
  if (input.paradigm.loweringIds.length > 0) plan.push({ kind: 'semantic-lowering-review', reason: 'lowering records are linked to this region', required: input.readiness !== 'ready' });
  if (input.patchHints.length > 0) plan.push({ kind: 'patch-admission', reason: 'patch hints exist for this region', required: input.readiness !== 'ready' });
  if (input.evidenceIds.length === 0) plan.push({ kind: 'evidence-review', reason: 'no region-specific evidence ids were linked', required: input.readiness !== 'ready' });
  return plan;
}

function semanticImpactRisk(input) {
  if (input.readiness === 'blocked' || input.proof.failedObligationIds.length > 0 || input.sourcePreservationRecords.some((record) => record.level === 'blocked')) return 'high';
  if (input.failedEvidenceIds.length > 0 || input.proof.openObligationIds.length > 0) return 'high';
  if (input.relationCount > 0 || input.verificationPlan.some((step) => step.required)) return 'medium';
  if (input.sourcePreservationRecords.some((record) => record.level === 'estimated')) return 'medium';
  return 'low';
}

function semanticImpactConflictKeys(region, symbolIds, relations, predicates) {
  return uniqueStrings([
    region.id ? `region:${region.id}` : undefined,
    region.key ? `ownership:${region.key}` : undefined,
    region.sourcePath ? `source:${region.sourcePath}` : undefined,
    ...symbolIds.map((id) => `symbol:${id}`),
    ...relations.map((relation) => `dependency:${relation.sourceId}:${semanticDependencyPredicateKey(relation.predicate)}:${relation.targetId}`),
    ...predicates.map((predicate) => `predicate:${predicate}`)
  ].filter(Boolean));
}

function semanticImpactConfidence(region, mappings, sourcePreservationRecords) {
  if (sourcePreservationRecords.some((record) => record.level === 'exact')) return 'source-exact';
  if ((mappings ?? []).length > 0 || region.precision === 'declaration') return 'source-addressed';
  if (region.precision === 'line' || region.precision === 'estimated') return 'estimated-source-region';
  return 'review-required';
}

function affectedSymbolIds(relations, ownSymbolIds, allSymbolIds) {
  const own = new Set(ownSymbolIds);
  return uniqueStrings(relations
    .flatMap((relation) => [relation.sourceId, relation.targetId])
    .filter((id) => id && allSymbolIds.has(id) && !own.has(id)));
}

function summarizeSemanticImpactRecords(records) {
  const verificationPlans = records.flatMap((record) => record.verificationPlan.map((step) => step.kind));
  return {
    total: records.length,
    byRisk: countBy(records.map((record) => record.risk)),
    byReadiness: countBy(records.map((record) => record.readiness)),
    conflictKeys: uniqueStrings(records.flatMap((record) => record.conflictKeys)),
    dependencyRelations: uniqueStrings(records.flatMap((record) => record.dependencyRelationIds)).length,
    affectedSymbols: uniqueStrings(records.flatMap((record) => record.affectedSymbolIds)).length,
    sourceMapMappings: uniqueStrings(records.flatMap((record) => record.sourceMapMappingIds)).length,
    sourcePreservationRecords: uniqueStrings(records.flatMap((record) => record.sourcePreservationRecordIds)).length,
    patchHints: uniqueStrings(records.flatMap((record) => record.patchHintIds)).length,
    proofObligations: uniqueStrings(records.flatMap((record) => record.proofObligationIds)).length,
    openProofObligations: uniqueStrings(records.flatMap((record) => record.openProofObligationIds)).length,
    failedProofObligations: uniqueStrings(records.flatMap((record) => record.failedProofObligationIds)).length,
    paradigmSemantics: uniqueStrings(records.flatMap((record) => record.paradigmSemanticIds)).length,
    loweringRecords: uniqueStrings(records.flatMap((record) => record.loweringRecordIds)).length,
    evidenceIds: uniqueStrings(records.flatMap((record) => record.evidenceIds)).length,
    verificationPlans: uniqueStrings(verificationPlans),
    requiredVerificationSteps: records.flatMap((record) => record.verificationPlan).filter((step) => step.required).length
  };
}

function groupBy(values, keyFn) {
  const grouped = new Map();
  for (const value of values ?? []) {
    const key = keyFn(value);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(value);
  }
  return grouped;
}

export { createSemanticImportImpact, summarizeSemanticImpactRecords };
