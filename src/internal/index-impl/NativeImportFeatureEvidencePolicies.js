import{nativeImportFeatureEvidencePolicy}from'./nativeImportFeatureEvidencePolicy.js';
export const NativeImportFeatureEvidencePolicies = Object.freeze({
  macroExpansion: nativeImportFeatureEvidencePolicy('macroExpansion', {
    category: 'macroExpansion',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['macroDefinitionsHash', 'expandedSourceHash'],
    recommendedEvidenceKeys: ['expansionMapId', 'sourceMapId', 'macroCallSites'],
    notes: ['Macro-expanded code must retain a link from generated output back to macro call sites before semantic merges can be trusted.']
  }),
  macroHygiene: nativeImportFeatureEvidencePolicy('macroHygiene', {
    category: 'macroExpansion',
    risk: 'critical',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['hygieneContextHash', 'bindingMapId'],
    recommendedEvidenceKeys: ['expansionMapId', 'captureSetHash'],
    notes: ['Hygiene-sensitive macros can change binding identity even when emitted text looks equivalent.']
  }),
  preprocessor: nativeImportFeatureEvidencePolicy('preprocessor', {
    category: 'preprocessor',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['preprocessedOutputHash', 'definesHash'],
    recommendedEvidenceKeys: ['includeGraphHash', 'conditionalBranches', 'sourceMapId'],
    notes: ['Preprocessor imports need the active defines/includes and preprocessed output hash to make replayable claims.']
  }),
  conditionalCompilation: nativeImportFeatureEvidencePolicy('conditionalCompilation', {
    category: 'conditionalCompilation',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['activeBranches', 'inactiveBranchesHash'],
    recommendedEvidenceKeys: ['compileTarget', 'featureFlags', 'preprocessedOutputHash'],
    notes: ['Conditional branches that were not active still affect portability and conflict review.']
  }),
  metaprogramming: nativeImportFeatureEvidencePolicy('metaprogramming', {
    category: 'metaprogramming',
    risk: 'critical',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['generatedArtifactHash', 'generatorIdentity'],
    recommendedEvidenceKeys: ['generatorInputsHash', 'generatedRanges', 'replayCommand'],
    notes: ['Generated or metaprogrammed declarations need replayable generator identity and input evidence.']
  }),
  reflection: nativeImportFeatureEvidencePolicy('reflection', {
    category: 'reflection',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['reflectionSurface', 'runtimeContract'],
    recommendedEvidenceKeys: ['observedMembers', 'fixtureIds', 'runtimeVersion'],
    notes: ['Reflection-heavy code needs a declared runtime contract because static AST evidence is incomplete.']
  }),
  dynamicRuntime: nativeImportFeatureEvidencePolicy('dynamicRuntime', {
    category: 'reflection',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['runtimeContract'],
    recommendedEvidenceKeys: ['fixtureIds', 'observedEffects', 'runtimeVersion'],
    notes: ['Dynamic runtime behavior should stay review-required until fixtures or traces describe the observed contract.']
  }),
  dynamicDispatch: nativeImportFeatureEvidencePolicy('dynamicDispatch', {
    category: 'overloadTypeInference',
    risk: 'medium',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['dispatchTargets'],
    recommendedEvidenceKeys: ['callGraphId', 'typeEvidenceId', 'fixtureIds'],
    notes: ['Dynamic dispatch needs candidate target evidence before call graph or porting claims are merge-ready.']
  }),
  generatedCode: nativeImportFeatureEvidencePolicy('generatedCode', {
    category: 'generatedCode',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['generatedArtifactHash', 'generatedRanges'],
    recommendedEvidenceKeys: ['generatorIdentity', 'generatorInputsHash', 'sourceMapId'],
    notes: ['Generated code must preserve generated ranges and artifact hashes so workers can avoid editing derived output blindly.']
  }),
  overloadResolution: nativeImportFeatureEvidencePolicy('overloadResolution', {
    category: 'overloadTypeInference',
    risk: 'medium',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['resolvedOverloads'],
    recommendedEvidenceKeys: ['typeEvidenceId', 'compilerVersion', 'callSiteSpans'],
    notes: ['Overload-sensitive imports should record compiler/type evidence for each call site.']
  }),
  typeInference: nativeImportFeatureEvidencePolicy('typeInference', {
    category: 'overloadTypeInference',
    risk: 'medium',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['inferredTypesHash'],
    recommendedEvidenceKeys: ['typeEvidenceId', 'compilerVersion', 'symbolTableHash'],
    notes: ['Inferred types need a stable type-evidence hash before cross-language projection can claim fidelity.']
  }),
  unsupportedSyntax: nativeImportFeatureEvidencePolicy('unsupportedSyntax', {
    category: 'unsupportedSyntax',
    risk: 'high',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['unsupportedSyntaxKind', 'sourceSpan'],
    recommendedEvidenceKeys: ['parserDiagnosticId', 'nativeAstNodeId', 'sourceSnippetHash'],
    notes: ['Unsupported syntax must remain anchored to source spans and parser diagnostics for later adapter work.']
  }),
  unsupportedSemantic: nativeImportFeatureEvidencePolicy('unsupportedSemantic', {
    category: 'unsupportedSyntax',
    risk: 'high',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['unsupportedSemanticKind', 'semanticSymbolId'],
    recommendedEvidenceKeys: ['semanticIndexId', 'sourceMapId', 'reason'],
    notes: ['Unsupported semantics should name the affected symbol so merge tools can isolate the unsafe region.']
  })
});
