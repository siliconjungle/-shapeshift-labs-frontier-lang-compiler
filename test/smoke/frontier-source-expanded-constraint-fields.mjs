import { assert } from './helpers.mjs';
import {
  createUniversalConversionPlanFromFrontierSource,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const source = `
module ExpandedConstraintFields @id("mod_expanded_constraint_fields")

conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  evidence translationProof kind semantic-equivalence status pass
  constraint callable-boundary saveUserCall @id("callable_boundary_save_user") role source kind method-call callableKind function functionName saveUser signatureHash sig_save_user parameterCount 2 parameterOrder user|options returnKind promise asyncKind async dispatchKind dynamic evidence translationProof
  constraint adt-pattern userResult @id("adt_pattern_user_result") role source kind tagged-union adtKind union typeName UserResult variantNames Ok|Err payloadFieldNames value|error exhaustivenessKinds total evidence translationProof
  constraint data-layout userStruct @id("data_layout_user_struct") role target kind repr-c layoutKind struct typeId type:User sizeBytes 24 alignmentBytes 8 pointerWidth 64 repr c evidence translationProof
  constraint numeric-semantics userAge @id("numeric_semantics_user_age") role source kind integer numericKind int width 53 overflowMode safe-integer specialValues nan|infinity evidence translationProof
  constraint text-semantics userName @id("text_semantics_user_name") role source kind string encoding utf-16 normalizationForm nfc boundaryKinds grapheme|word evidence translationProof
  constraint collection-semantics userList @id("collection_semantics_user_list") role source kind array collectionKind array elementKind User iterationOrder insertion duplicatePolicy allow indexBase 0 copyOnWrite evidence translationProof
  constraint serialization-semantics userJson @id("serialization_semantics_user_json") role source kind json format json codec JSON.stringify schemaName UserSchema deterministic evidence translationProof
  constraint dependency-semantics npmReact @id("dependency_semantics_npm_react") role source kind package packageManager npm packageName react versionRange ^19.0.0 lockfile package-lock.json features exports|types evidence translationProof
  constraint concurrency-model asyncTask @id("concurrency_model_async_task") role source kind async-task concurrencyKind async-task constructId task:save scheduler event-loop cancellationKey signal:abort async await structured evidence translationProof
  constraint error-model userError @id("error_model_user_error") role source kind exception errorKind exception errorType UserError boundaryId catch:user evidence translationProof
  constraint evaluation-model optionalChain @id("evaluation_model_optional_chain") role source kind short-circuit evaluationKind short-circuit expressionId expr:user operator ?. evaluationOrder left-to-right evidence translationProof
  constraint metaprogramming decorator @id("metaprogramming_decorator") role source kind decorator expansionKind decorator expansionId expansion:user generatedSourcePath dist/user.js expandedHash hash-expanded evidence translationProof
  constraint object-model userClass @id("object_model_user_class") role source kind class objectKind class classId class:User methodId method:save dispatchKind virtual virtual evidence translationProof
  constraint protocol serializable @id("protocol_serializable") role target kind trait-bound protocolKind trait traitName Serializable requirementNames serialize|deserialize associatedTypeNames Error evidence translationProof
}
`;

const plan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'expanded-constraint-fields.frontier',
  generatedAt: 902,
  universalCapabilityMatrix: capabilityMatrix('javascript', 'rust'),
  imports: [sourceImport()],
  evidence: [routeProof()]
});

const metadata = plan.document.metadata.universalConversionPlan;
assert.equal(metadata.callableBoundaryConstraints[0].sourceCallableBoundaryRecords[0].functionName, 'saveUser');
assert.deepEqual(metadata.callableBoundaryConstraints[0].sourceCallableBoundaryRecords[0].parameterOrder, ['user', 'options']);
assert.deepEqual(metadata.adtPatternConstraints[0].sourceAdtPatternRecords[0].variantNames, ['Ok', 'Err']);
assert.equal(metadata.dataLayoutConstraints[0].targetDataLayoutRecords[0].pointerWidth, 64);
assert.equal(metadata.numericSemanticsConstraints[0].sourceNumericSemanticsRecords[0].width, 53);
assert.deepEqual(metadata.textSemanticsConstraints[0].sourceTextSemanticsRecords[0].boundaryKinds, ['grapheme', 'word']);
assert.equal(metadata.collectionSemanticsConstraints[0].sourceCollectionSemanticsRecords[0].copyOnWrite, true);
assert.equal(metadata.serializationSemanticsConstraints[0].sourceSerializationSemanticsRecords[0].schemaName, 'UserSchema');
assert.equal(metadata.dependencySemanticsConstraints[0].sourceDependencySemanticsRecords[0].packageManager, 'npm');
assert.equal(metadata.concurrencyModelConstraints[0].sourceConcurrencyModelRecords[0].constructId, 'task:save');
assert.equal(metadata.errorModelConstraints[0].sourceErrorModelRecords[0].errorType, 'UserError');
assert.equal(metadata.evaluationModelConstraints[0].sourceEvaluationModelRecords[0].operator, '?.');
assert.equal(metadata.metaprogrammingConstraints[0].sourceMetaprogrammingRecords[0].expandedHash, 'hash-expanded');
assert.equal(metadata.objectModelConstraints[0].sourceObjectModelRecords[0].classId, 'class:User');
assert.deepEqual(metadata.protocolConstraints[0].targetProtocols[0].requirementNames, ['serialize', 'deserialize']);

const route = queryUniversalConversionPlan(plan, { sourceLanguage: 'javascript', target: 'rust' }).bestRoute;
assert.equal(route.callableBoundaryConstraint.requiredKinds.includes('callable-signature'), true);
assert.equal(route.adtPatternConstraint.requiredKinds.includes('exhaustiveness'), true);
assert.equal(route.dataLayoutConstraint.targetDataLayoutRecords[0].pointerWidth, 64);
assert.equal(route.numericSemanticsConstraint.requiredKinds.includes('numeric-type'), true);
assert.equal(route.numericSemanticsConstraint.sourceRecords[0].overflowMode, 'safe-integer');
assert.equal(route.textSemanticsConstraint.requiredKinds.includes('encoding'), true);
assert.deepEqual(route.textSemanticsConstraint.sourceRecords[0].boundaryKinds, ['grapheme', 'word']);
assert.equal(route.collectionSemanticsConstraint.requiredKinds.includes('index-semantics'), true);
assert.equal(route.collectionSemanticsConstraint.sourceRecords[0].iterationOrder, 'insertion');
assert.equal(route.serializationSemanticsConstraint.requiredKinds.includes('serialization-format'), true);
assert.equal(route.dependencySemanticsConstraint.requiredKinds.includes('lockfile-integrity'), true);
assert.equal(route.concurrencyModelConstraint.requiredKinds.includes('async-task'), true);
assert.equal(route.errorModelConstraint.requiredKinds.includes('throw-exception'), true);
assert.equal(route.evaluationModelConstraint.requiredKinds.includes('short-circuit'), true);
assert.equal(route.metaprogrammingConstraint.requiredKinds.includes('decorator-transform'), true);
assert.equal(route.objectModelConstraint.requiredKinds.includes('virtual-dispatch'), true);
assert.deepEqual(route.protocolConstraint.targetProtocols[0].requirementNames, ['serialize', 'deserialize']);

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 902,
    languages: [{
      language,
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_expanded_constraint_fields',
    language: 'javascript',
    sourcePath: 'src/public-api.js',
    sourceHash: 'hash_public_api_source',
    evidence: [{ id: 'native_import_expanded_constraint_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_public_api', ownershipKeys: ['symbol.publicApi'], conflictKeys: ['symbol.publicApi'] }],
    sourceMaps: [{ id: 'source_map_conversion', mappings: [{ id: 'source_map_mapping_conversion', ownershipRegionKey: 'symbol.publicApi', sourceSpan: { path: 'src/public-api.js' } }] }]
  };
}

function routeProof() {
  return {
    id: 'translationProof',
    kind: 'conversion-replay-proof',
    status: 'passed',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}
