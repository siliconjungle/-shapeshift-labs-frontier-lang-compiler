import { borrowCheckerConstraintForConversionRoute, borrowCheckerConstraintMatches } from './universal-borrow-checker-constraints.js';
import { borrowScopeConstraintForConversionRoute, borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
import { adtPatternConstraintForConversionRoute, adtPatternConstraintMatches } from './universal-adt-pattern-constraints.js';
import { concurrencyModelConstraintForConversionRoute, concurrencyModelConstraintMatches } from './universal-concurrency-model-constraints.js';
import { controlFlowConstraintForConversionRoute, controlFlowConstraintMatches } from './universal-control-flow-constraints.js';
import { dataLayoutConstraintForConversionRoute, dataLayoutConstraintMatches } from './universal-data-layout-constraints.js';
import { effectConstraintForConversionRoute, effectConstraintMatches } from './universal-effect-constraints.js';
import { errorModelConstraintForConversionRoute, errorModelConstraintMatches } from './universal-error-model-constraints.js';
import { evaluationModelConstraintForConversionRoute, evaluationModelConstraintMatches } from './universal-evaluation-model-constraints.js';
import { hostEnvironmentConstraintForConversionRoute, hostEnvironmentConstraintMatches } from './universal-host-environment-constraints.js';
import { lifetimeConstraintForConversionRoute, lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { memoryModelConstraintForConversionRoute, memoryModelConstraintMatches } from './universal-memory-model-constraints.js';
import { metaprogrammingConstraintForConversionRoute, metaprogrammingConstraintMatches } from './universal-metaprogramming-constraints.js';
import { moduleConstraintForConversionRoute, moduleConstraintMatches } from './universal-module-constraints.js';
import { numericSemanticsConstraintForConversionRoute, numericSemanticsConstraintMatches } from './universal-numeric-semantics-constraints.js';
import { textSemanticsConstraintForConversionRoute, textSemanticsConstraintMatches } from './universal-text-semantics-constraints.js';
import { collectionSemanticsConstraintForConversionRoute, collectionSemanticsConstraintMatches } from './universal-collection-semantics-constraints.js';
import { serializationSemanticsConstraintForConversionRoute, serializationSemanticsConstraintMatches } from './universal-serialization-semantics-constraints.js';
import { objectModelConstraintForConversionRoute, objectModelConstraintMatches } from './universal-object-model-constraints.js';
import { protocolConstraintForConversionRoute, protocolConstraintMatches } from './universal-protocol-constraints.js';
import { resourceTransferForConversionRoute, resourceTransferMatches } from './universal-resource-transfer.js';
import { scopeBindingConstraintForConversionRoute, scopeBindingConstraintMatches } from './universal-scope-binding-constraints.js';
import { typeConstraintForConversionRoute, typeConstraintMatches } from './universal-type-constraints.js';

const families = [
  ['borrowCheckerConstraint', 'borrowCheckerConstraints', 'translationBorrowCheckerConstraint'],
  ['borrowScopeConstraint', 'borrowScopeConstraints', 'translationBorrowScopeConstraint'],
  ['concurrencyModelConstraint', 'concurrencyModelConstraints', 'translationConcurrencyModelConstraint'],
  ['controlFlowConstraint', 'controlFlowConstraints', 'translationControlFlowConstraint'],
  ['adtPatternConstraint', 'adtPatternConstraints', 'translationAdtPatternConstraint'],
  ['dataLayoutConstraint', 'dataLayoutConstraints', 'translationDataLayoutConstraint'],
  ['effectConstraint', 'effectConstraints', 'translationEffectConstraint'],
  ['errorModelConstraint', 'errorModelConstraints', 'translationErrorModelConstraint'],
  ['evaluationModelConstraint', 'evaluationModelConstraints', 'translationEvaluationModelConstraint'],
  ['hostEnvironmentConstraint', 'hostEnvironmentConstraints', 'translationHostEnvironmentConstraint'],
  ['lifetimeConstraint', 'lifetimeConstraints', 'translationLifetimeConstraint'],
  ['memoryModelConstraint', 'memoryModelConstraints', 'translationMemoryModelConstraint'],
  ['metaprogrammingConstraint', 'metaprogrammingConstraints', 'translationMetaprogrammingConstraint'],
  ['scopeBindingConstraint', 'scopeBindingConstraints', 'translationScopeBindingConstraint'],
  ['moduleConstraint', 'moduleConstraints', 'translationModuleConstraint'],
  ['numericSemanticsConstraint', 'numericSemanticsConstraints', 'translationNumericSemanticsConstraint'],
  ['textSemanticsConstraint', 'textSemanticsConstraints', 'translationTextSemanticsConstraint'],
  ['collectionSemanticsConstraint', 'collectionSemanticsConstraints', 'translationCollectionSemanticsConstraint'],
  ['serializationSemanticsConstraint', 'serializationSemanticsConstraints', 'translationSerializationSemanticsConstraint'],
  ['objectModelConstraint', 'objectModelConstraints', 'translationObjectModelConstraint'],
  ['protocolConstraint', 'protocolConstraints', 'translationProtocolConstraint'],
  ['resourceTransfer', 'resourceTransfers', 'translationResourceTransfer'],
  ['typeConstraint', 'typeConstraints', 'translationTypeConstraint']
];

export function conversionConstraintRouteInput(input = {}) {
  return Object.fromEntries(families.flatMap(([single, many, translation]) => [
    [single, input[single]],
    [many, input[many] ?? []],
    [translation, input[translation]]
  ]));
}

export function createConversionRouteConstraints(input = {}, route = {}, routeImports = [], routeEvidence = [], runtime = {}) {
  const resourceTransfer = resourceTransferForConversionRoute(input, route, routeImports, routeEvidence);
  const lifetimeConstraint = lifetimeConstraintForConversionRoute(input, route, routeImports, routeEvidence);
  const controlFlowConstraint = controlFlowConstraintForConversionRoute(input, route, routeImports, routeEvidence);
  const borrowScopeConstraint = borrowScopeConstraintForConversionRoute(input, route, routeImports, routeEvidence, {
    ownershipConstraint: resourceTransfer?.ownershipConstraints,
    lifetimeConstraint,
    controlFlowConstraint
  });
  const borrowCheckerConstraint = borrowCheckerConstraintForConversionRoute(input, route, routeImports, routeEvidence, {
    resourceTransfer,
    lifetimeConstraint,
    controlFlowConstraint,
    borrowScopeConstraint
  });
  return {
    resourceTransfer,
    lifetimeConstraint,
    controlFlowConstraint,
    adtPatternConstraint: adtPatternConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    borrowScopeConstraint,
    borrowCheckerConstraint,
    dataLayoutConstraint: dataLayoutConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    effectConstraint: effectConstraintForConversionRoute(input, route, routeImports, routeEvidence, runtime),
    concurrencyModelConstraint: concurrencyModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    errorModelConstraint: errorModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    evaluationModelConstraint: evaluationModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    hostEnvironmentConstraint: hostEnvironmentConstraintForConversionRoute(input, route, routeImports, routeEvidence, runtime),
    memoryModelConstraint: memoryModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    metaprogrammingConstraint: metaprogrammingConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    scopeBindingConstraint: scopeBindingConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    moduleConstraint: moduleConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    numericSemanticsConstraint: numericSemanticsConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    textSemanticsConstraint: textSemanticsConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    collectionSemanticsConstraint: collectionSemanticsConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    serializationSemanticsConstraint: serializationSemanticsConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    objectModelConstraint: objectModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    protocolConstraint: protocolConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    typeConstraint: typeConstraintForConversionRoute(input, route, routeImports, routeEvidence)
  };
}

export function conversionRouteMatchesConstraintQuery(route = {}, query = {}) {
  return resourceTransferMatches(route.resourceTransfer, query)
    && lifetimeConstraintMatches(route.lifetimeConstraint, query)
    && controlFlowConstraintMatches(route.controlFlowConstraint, query)
    && adtPatternConstraintMatches(route.adtPatternConstraint, query)
    && borrowScopeConstraintMatches(route.borrowScopeConstraint, query)
    && borrowCheckerConstraintMatches(route.borrowCheckerConstraint, query)
    && dataLayoutConstraintMatches(route.dataLayoutConstraint, query)
    && effectConstraintMatches(route.effectConstraint, query)
    && concurrencyModelConstraintMatches(route.concurrencyModelConstraint, query)
    && errorModelConstraintMatches(route.errorModelConstraint, query)
    && evaluationModelConstraintMatches(route.evaluationModelConstraint, query)
    && hostEnvironmentConstraintMatches(route.hostEnvironmentConstraint, query)
    && memoryModelConstraintMatches(route.memoryModelConstraint, query)
    && metaprogrammingConstraintMatches(route.metaprogrammingConstraint, query)
    && scopeBindingConstraintMatches(route.scopeBindingConstraint, query)
    && moduleConstraintMatches(route.moduleConstraint, query)
    && numericSemanticsConstraintMatches(route.numericSemanticsConstraint, query)
    && textSemanticsConstraintMatches(route.textSemanticsConstraint, query)
    && collectionSemanticsConstraintMatches(route.collectionSemanticsConstraint, query)
    && serializationSemanticsConstraintMatches(route.serializationSemanticsConstraint, query)
    && objectModelConstraintMatches(route.objectModelConstraint, query)
    && protocolConstraintMatches(route.protocolConstraint, query)
    && typeConstraintMatches(route.typeConstraint, query);
}
