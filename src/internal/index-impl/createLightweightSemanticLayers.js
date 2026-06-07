import{createParadigmSemanticsLayer,createProofSpecLayer}from'@shapeshift-labs/frontier-lang-kernel';

export function createLightweightSemanticLayers(input) {
  const evidenceIds = (input.evidence ?? []).map((record) => record.id).filter(Boolean);
  const symbols = input.semanticIndex?.symbols ?? [];
  const mappings = (input.sourceMaps ?? []).flatMap((sourceMap) => sourceMap.mappings ?? []);
  const lossIds = (input.losses ?? []).map((loss) => loss.id).filter(Boolean);
  const firstSubject = symbols[0]?.id ?? input.nativeSource?.id ?? input.nativeAst?.id;
  const firstSubjectKind = symbols[0]?.id ? 'semanticSymbol' : input.nativeSource?.id ? 'nativeSource' : 'nativeAst';
  const proof = createProofSpecLayer({
    id: `proof_lightweight_${input.importIdPart}`,
    invariants: [proofInvariant(input, firstSubject, firstSubjectKind, evidenceIds, lossIds)],
    obligations: proofObligations(input, firstSubject, firstSubjectKind, evidenceIds, lossIds),
    artifacts: [{
      id: `proof_artifact_review_${input.importIdPart}`,
      kind: 'manualReview',
      evidenceIds,
      lossIds,
      summary: 'Lightweight import requires host parser, checker, tests, or human review before semantic merge.'
    }],
    assumptions: [{
      id: `proof_assumption_lightweight_${input.importIdPart}`,
      scope: 'native-import',
      subjectId: input.nativeSource?.id,
      subjectKind: 'nativeSource',
      evidenceIds,
      statement: 'Native source text and scanner evidence are preserved, but executable semantics are not proven.'
    }],
    evidence: input.evidence ?? []
  });
  const paradigmSemantics = createParadigmSemanticsLayer({
    id: `paradigm_lightweight_${input.importIdPart}`,
    bindingScopes: [{
      id: `binding_scope_${input.importIdPart}`,
      kind: 'moduleScope',
      nativeSourceId: input.nativeSource?.id,
      evidenceIds,
      sourcePath: input.sourcePath,
      sourceHash: input.sourceHash
    }],
    bindings: symbols.slice(0, 40).map((symbol) => ({
      id: `binding_${symbol.id}`,
      kind: 'nativeDeclarationBinding',
      bindingScopeId: `binding_scope_${input.importIdPart}`,
      semanticSymbolId: symbol.id,
      nativeSourceId: input.nativeSource?.id,
      evidenceIds
    })),
    evaluationModels: [evaluationModel(input, evidenceIds)],
    effectRegions: effectRegions(input, evidenceIds),
    loweringRecords: mappings.slice(0, 40).map((mapping) => ({
      id: `lowering_${mapping.id}`,
      kind: 'nativeSourceToFrontierSemanticIndex',
      sourceMapId: mapping.sourceMapId,
      sourceMapMappingId: mapping.id,
      semanticSymbolId: mapping.semanticSymbolId,
      nativeAstNodeId: mapping.nativeAstNodeId,
      evidenceIds,
      lossIds
    })),
    macroExpansions: macroBoundaryRecords(input, evidenceIds, lossIds),
    reflectionBoundaries: reflectionBoundaryRecords(input, evidenceIds, lossIds),
    evidence: input.evidence ?? []
  });
  return { proof, paradigmSemantics };
}

function proofInvariant(input, subjectId, subjectKind, evidenceIds, lossIds) {
  return {
    id: `proof_invariant_source_hash_${input.importIdPart}`,
    kind: 'sourceHashFreshness',
    subjectId,
    subjectKind,
    evidenceIds,
    lossIds,
    statement: 'Semantic merge candidates must match the preserved source hash before admission.'
  };
}

function proofObligations(input, subjectId, subjectKind, evidenceIds, lossIds) {
  return [
    {
      id: `proof_obligation_review_${input.importIdPart}`,
      kind: 'semanticMergeReview',
      status: 'open',
      subjectId,
      subjectKind,
      contractIds: [`proof_invariant_source_hash_${input.importIdPart}`],
      evidenceIds,
      lossIds,
      statement: 'Review ownership, source maps, losses, and focused tests before applying this semantic patch.'
    },
    {
      id: `proof_obligation_external_semantics_${input.importIdPart}`,
      kind: 'externalSemanticEquivalence',
      status: 'external-tool-required',
      subjectId,
      subjectKind,
      evidenceIds,
      lossIds,
      statement: 'Cross-language executable equivalence requires a target checker, oracle, or proof artifact.'
    }
  ];
}

function evaluationModel(input, evidenceIds) {
  const language = String(input.language ?? 'unknown').toLowerCase();
  const kind = ['javascript', 'typescript', 'python', 'ruby', 'php', 'lua'].includes(language)
    ? 'dynamicRuntime'
    : ['rust', 'c', 'cpp', 'c++', 'zig'].includes(language)
      ? 'compileTimeOwnershipRuntime'
      : 'languageRuntime';
  return { id: `evaluation_model_${input.importIdPart}`, kind, nativeSourceId: input.nativeSource?.id, evidenceIds };
}

function effectRegions(input, evidenceIds) {
  const predicates = new Set((input.semanticIndex?.relations ?? []).map((relation) => relation.predicate));
  return [...predicates].filter((predicate) => ['calls', 'imports', 'uses', 'requires'].includes(predicate)).map((predicate) => ({
    id: `effect_region_${input.importIdPart}_${predicate}`,
    kind: `${predicate}DependencyEffect`,
    nativeSourceId: input.nativeSource?.id,
    evidenceIds
  }));
}

function macroBoundaryRecords(input, evidenceIds, lossIds) {
  const hasMacroLoss = (input.losses ?? []).some((loss) => ['macroExpansion', 'preprocessor', 'metaprogramming'].includes(loss.kind));
  return hasMacroLoss ? [{ id: `macro_boundary_${input.importIdPart}`, kind: 'reviewRequiredMacroBoundary', nativeSourceId: input.nativeSource?.id, evidenceIds, lossIds }] : [];
}

function reflectionBoundaryRecords(input, evidenceIds, lossIds) {
  const hasReflectionLoss = (input.losses ?? []).some((loss) => ['dynamicRuntime', 'reflection', 'opaqueNative'].includes(loss.kind));
  return hasReflectionLoss ? [{ id: `reflection_boundary_${input.importIdPart}`, kind: 'reviewRequiredDynamicBoundary', nativeSourceId: input.nativeSource?.id, evidenceIds, lossIds }] : [];
}
