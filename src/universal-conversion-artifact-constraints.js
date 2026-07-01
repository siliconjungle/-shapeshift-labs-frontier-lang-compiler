import { uniqueStrings } from './native-import-utils.js';
import { adtPatternConstraintMatches } from './universal-adt-pattern-constraints.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';
import { borrowCheckerConstraintMatches } from './universal-borrow-checker-constraints.js';
import { borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
import { concurrencyModelConstraintMatches } from './universal-concurrency-model-constraints.js';
import { controlFlowConstraintMatches } from './universal-control-flow-constraints.js';
import { dataLayoutConstraintMatches } from './universal-data-layout-constraints.js';
import { effectConstraintMatches } from './universal-effect-constraints.js';
import { errorModelConstraintMatches } from './universal-error-model-constraints.js';
import { evaluationModelConstraintMatches } from './universal-evaluation-model-constraints.js';
import { hostEnvironmentConstraintMatches } from './universal-host-environment-constraints.js';
import { lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { memoryModelConstraintMatches } from './universal-memory-model-constraints.js';
import { metaprogrammingConstraintMatches } from './universal-metaprogramming-constraints.js';
import { moduleConstraintMatches } from './universal-module-constraints.js';
import { numericSemanticsConstraintMatches } from './universal-numeric-semantics-constraints.js';
import { objectModelConstraintMatches } from './universal-object-model-constraints.js';
import { protocolConstraintMatches } from './universal-protocol-constraints.js';
import { scopeBindingConstraintMatches } from './universal-scope-binding-constraints.js';
import { typeConstraintMatches } from './universal-type-constraints.js';

export function artifactConstraintIndex(records = []) {
  const rTransfers = records.map(res);
  return {
    resourceTransferStatuses: uniqueStrings(rTransfers.map((r) => r.status)),
    resourceTransferActions: uniqueStrings(rTransfers.map((r) => r.action)),
    resourceTransferMissingEvidence: uniqueStrings(rTransfers.flatMap((r) => r.missingEvidence ?? [])),
    resourceTransferLossKinds: uniqueStrings(rTransfers.flatMap((record) => (record.losses ?? []).map((loss) => loss.kind))),
    ...constraintIndex('ownershipConstraint', records.map(own)),
    ...constraintIndex('lifetimeConstraint', records.map(life)),
    ...constraintIndex('controlFlowConstraint', records.map(ctrl)),
    ...constraintIndex('adtPatternConstraint', records.map(adt)),
    ...constraintIndex('borrowScopeConstraint', records.map(bscope)),
    ...constraintIndex('borrowCheckerConstraint', records.map(bchecker)),
    ...constraintIndex('dataLayoutConstraint', records.map(layout)),
    ...constraintIndex('effectConstraint', records.map(effect)),
    ...constraintIndex('concurrencyModelConstraint', records.map(conc)),
    ...constraintIndex('errorModelConstraint', records.map(err)),
    ...constraintIndex('evaluationModelConstraint', records.map(evalm)),
    ...constraintIndex('hostEnvironmentConstraint', records.map(host)),
    ...constraintIndex('memoryModelConstraint', records.map(mem)),
    ...constraintIndex('metaprogrammingConstraint', records.map(meta)),
    ...constraintIndex('scopeBindingConstraint', records.map(scope)),
    ...constraintIndex('moduleConstraint', records.map(mods)),
    ...constraintIndex('numericSemanticsConstraint', records.map(num)),
    ...constraintIndex('objectModelConstraint', records.map(obj)),
    ...constraintIndex('protocolConstraint', records.map(proto)),
    ...constraintIndex('typeConstraint', records.map(types))
  };
}

export function artifactConstraintsMatch(record, query = {}) {
  return resourceTransferMatches(res(record), query)
    && lifetimeConstraintMatches(life(record), query)
    && controlFlowConstraintMatches(ctrl(record), query)
    && adtPatternConstraintMatches(adt(record), query)
    && borrowScopeConstraintMatches(bscope(record), query)
    && borrowCheckerConstraintMatches(bchecker(record), query)
    && dataLayoutConstraintMatches(layout(record), query)
    && effectConstraintMatches(effect(record), query)
    && concurrencyModelConstraintMatches(conc(record), query)
    && errorModelConstraintMatches(err(record), query)
    && evaluationModelConstraintMatches(evalm(record), query)
    && hostEnvironmentConstraintMatches(host(record), query)
    && memoryModelConstraintMatches(mem(record), query)
    && metaprogrammingConstraintMatches(meta(record), query)
    && scopeBindingConstraintMatches(scope(record), query)
    && moduleConstraintMatches(mods(record), query)
    && numericSemanticsConstraintMatches(num(record), query)
    && objectModelConstraintMatches(obj(record), query)
    && protocolConstraintMatches(proto(record), query)
    && typeConstraintMatches(types(record), query);
}

function res(record) { return record.resourceTransfer ?? metaConstraint(record, 'resourceTransfer'); }
function own(record) { return res(record).ownershipConstraints ?? {}; }
function life(record) { return record.lifetimeConstraint ?? metaConstraint(record, 'lifetimeConstraint'); }
function ctrl(record) { return record.controlFlowConstraint ?? metaConstraint(record, 'controlFlowConstraint'); }
function adt(record) { return record.adtPatternConstraint ?? metaConstraint(record, 'adtPatternConstraint'); }
function bscope(record) { return record.borrowScopeConstraint ?? metaConstraint(record, 'borrowScopeConstraint'); }
function bchecker(record) { return record.borrowCheckerConstraint ?? metaConstraint(record, 'borrowCheckerConstraint'); }
function layout(record) { return record.dataLayoutConstraint ?? metaConstraint(record, 'dataLayoutConstraint'); }
function effect(record) { return record.effectConstraint ?? metaConstraint(record, 'effectConstraint'); }
function conc(record) { return record.concurrencyModelConstraint ?? metaConstraint(record, 'concurrencyModelConstraint'); }
function err(record) { return record.errorModelConstraint ?? metaConstraint(record, 'errorModelConstraint'); }
function evalm(record) { return record.evaluationModelConstraint ?? metaConstraint(record, 'evaluationModelConstraint'); }
function host(record) { return record.hostEnvironmentConstraint ?? metaConstraint(record, 'hostEnvironmentConstraint'); }
function mem(record) { return record.memoryModelConstraint ?? metaConstraint(record, 'memoryModelConstraint'); }
function meta(record) { return record.metaprogrammingConstraint ?? metaConstraint(record, 'metaprogrammingConstraint'); }
function scope(record) { return record.scopeBindingConstraint ?? metaConstraint(record, 'scopeBindingConstraint'); }
function mods(record) { return record.moduleConstraint ?? metaConstraint(record, 'moduleConstraint'); }
function num(record) { return record.numericSemanticsConstraint ?? metaConstraint(record, 'numericSemanticsConstraint'); }
function obj(record) { return record.objectModelConstraint ?? metaConstraint(record, 'objectModelConstraint'); }
function proto(record) { return record.protocolConstraint ?? metaConstraint(record, 'protocolConstraint'); }
function types(record) { return record.typeConstraint ?? metaConstraint(record, 'typeConstraint'); }
function metaConstraint(record, key) { return record.metadata?.[key] ?? record.translationAdmission?.[key] ?? record.admissionRecord?.metadata?.[key] ?? {}; }
function constraintIndex(prefix, records) {
  return {
    [`${prefix}Statuses`]: uniqueStrings(records.map((r) => r.status)),
    [`${prefix}Actions`]: uniqueStrings(records.map((r) => r.action)),
    [`${prefix}MissingEvidence`]: uniqueStrings(records.flatMap((r) => r.missingEvidence ?? [])),
    [`${prefix}MissingKinds`]: uniqueStrings(records.flatMap((r) => r.missingKinds ?? []))
  };
}
