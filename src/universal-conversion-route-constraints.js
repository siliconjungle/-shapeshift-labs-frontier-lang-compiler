import { borrowCheckerConstraintForConversionRoute, borrowCheckerConstraintMatches } from './universal-borrow-checker-constraints.js';
import { borrowScopeConstraintForConversionRoute, borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
import { concurrencyModelConstraintForConversionRoute, concurrencyModelConstraintMatches } from './universal-concurrency-model-constraints.js';
import { controlFlowConstraintForConversionRoute, controlFlowConstraintMatches } from './universal-control-flow-constraints.js';
import { effectConstraintForConversionRoute, effectConstraintMatches } from './universal-effect-constraints.js';
import { errorModelConstraintForConversionRoute, errorModelConstraintMatches } from './universal-error-model-constraints.js';
import { evaluationModelConstraintForConversionRoute, evaluationModelConstraintMatches } from './universal-evaluation-model-constraints.js';
import { lifetimeConstraintForConversionRoute, lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { memoryModelConstraintForConversionRoute, memoryModelConstraintMatches } from './universal-memory-model-constraints.js';
import { moduleConstraintForConversionRoute, moduleConstraintMatches } from './universal-module-constraints.js';
import { objectModelConstraintForConversionRoute, objectModelConstraintMatches } from './universal-object-model-constraints.js';
import { resourceTransferForConversionRoute, resourceTransferMatches } from './universal-resource-transfer.js';
import { typeConstraintForConversionRoute, typeConstraintMatches } from './universal-type-constraints.js';

const families = [
  ['borrowCheckerConstraint', 'borrowCheckerConstraints', 'translationBorrowCheckerConstraint'],
  ['borrowScopeConstraint', 'borrowScopeConstraints', 'translationBorrowScopeConstraint'],
  ['concurrencyModelConstraint', 'concurrencyModelConstraints', 'translationConcurrencyModelConstraint'],
  ['controlFlowConstraint', 'controlFlowConstraints', 'translationControlFlowConstraint'],
  ['effectConstraint', 'effectConstraints', 'translationEffectConstraint'],
  ['errorModelConstraint', 'errorModelConstraints', 'translationErrorModelConstraint'],
  ['evaluationModelConstraint', 'evaluationModelConstraints', 'translationEvaluationModelConstraint'],
  ['lifetimeConstraint', 'lifetimeConstraints', 'translationLifetimeConstraint'],
  ['memoryModelConstraint', 'memoryModelConstraints', 'translationMemoryModelConstraint'],
  ['moduleConstraint', 'moduleConstraints', 'translationModuleConstraint'],
  ['objectModelConstraint', 'objectModelConstraints', 'translationObjectModelConstraint'],
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
    borrowScopeConstraint,
    borrowCheckerConstraint,
    effectConstraint: effectConstraintForConversionRoute(input, route, routeImports, routeEvidence, runtime),
    concurrencyModelConstraint: concurrencyModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    errorModelConstraint: errorModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    evaluationModelConstraint: evaluationModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    memoryModelConstraint: memoryModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    moduleConstraint: moduleConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    objectModelConstraint: objectModelConstraintForConversionRoute(input, route, routeImports, routeEvidence),
    typeConstraint: typeConstraintForConversionRoute(input, route, routeImports, routeEvidence)
  };
}

export function conversionRouteMatchesConstraintQuery(route = {}, query = {}) {
  return resourceTransferMatches(route.resourceTransfer, query)
    && lifetimeConstraintMatches(route.lifetimeConstraint, query)
    && controlFlowConstraintMatches(route.controlFlowConstraint, query)
    && borrowScopeConstraintMatches(route.borrowScopeConstraint, query)
    && borrowCheckerConstraintMatches(route.borrowCheckerConstraint, query)
    && effectConstraintMatches(route.effectConstraint, query)
    && concurrencyModelConstraintMatches(route.concurrencyModelConstraint, query)
    && errorModelConstraintMatches(route.errorModelConstraint, query)
    && evaluationModelConstraintMatches(route.evaluationModelConstraint, query)
    && memoryModelConstraintMatches(route.memoryModelConstraint, query)
    && moduleConstraintMatches(route.moduleConstraint, query)
    && objectModelConstraintMatches(route.objectModelConstraint, query)
    && typeConstraintMatches(route.typeConstraint, query);
}
