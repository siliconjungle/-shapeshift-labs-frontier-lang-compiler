import { compactRecord } from './js-ts-safe-merge-context.js';
import {
  scopeDetails,
  scopeFingerprint,
  scopeReferenceDetails,
  scopeReferenceFingerprint
} from './js-ts-safe-project-merge-scope-use-def-details.js';

const ScopeReferenceBlockedFallbackReason = 'project-public-scope-reference-blocked-evidence';
const ScopeBindingBlockedFallbackReason = 'project-public-scope-use-def-blocked-evidence';

function projectScopeUseDefDeltaConflicts(projectGraphDelta) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  const ambiguousOutputConflicts = projectScopeUseDefAmbiguousEvidenceConflicts(outputGraph);
  if (!baseGraph || !workerGraph || !headGraph) return ambiguousOutputConflicts;
  const base = publicScopeBindings(baseGraph.scopeBindingRecords);
  const worker = publicScopeBindings(workerGraph.scopeBindingRecords);
  const head = publicScopeBindings(headGraph.scopeBindingRecords);
  const output = publicScopeBindings(outputGraph?.scopeBindingRecords);
  const referenceDeltaConflicts = projectScopeReferenceDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph);
  const deltaConflicts = uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [scopeFingerprint(baseRecord), scopeFingerprint(workerRecord), scopeFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [projectScopeUseDefDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
  return [...ambiguousOutputConflicts, ...referenceDeltaConflicts, ...deltaConflicts];
}

function projectScopeUseDefDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-public-scope-use-def-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed public scope/use-def binding ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-use-def-delta-conflict',
      conflictKey: `project-graph-delta#scope-use-def#${identityKey}`,
      identityKey,
      sourcePath,
      base: scopeDetails(baseRecord),
      worker: scopeDetails(workerRecord),
      head: scopeDetails(headRecord),
      output: scopeDetails(outputRecord)
    })
  };
}

function publicScopeBindings(records = []) {
  const result = new Map();
  for (const record of records) {
    if (!record?.publicContract) continue;
    const key = scopeIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function projectScopeUseDefAmbiguousEvidenceConflicts(graph) {
  const bindingConflicts = [...publicScopeBindings(graph?.scopeBindingRecords).entries()]
    .map(([identityKey, record]) => [identityKey, record, scopeBindingAmbiguousReasonCodes(record)])
    .filter(([, , reasonCodes]) => reasonCodes.length)
    .map(([identityKey, record, reasonCodes]) => projectScopeUseDefAmbiguousEvidenceConflict(identityKey, record, reasonCodes));
  const referenceConflicts = [...publicScopeReferences(graph?.scopeReferenceRecords).entries()]
    .map(([identityKey, record]) => [identityKey, record, scopeReferenceAmbiguousReasonCodes(record)])
    .filter(([, , reasonCodes]) => reasonCodes.length)
    .map(([identityKey, record, reasonCodes]) => projectScopeReferenceAmbiguousEvidenceConflict(identityKey, record, reasonCodes));
  return [...bindingConflicts, ...referenceConflicts];
}

function projectScopeUseDefAmbiguousEvidenceConflict(identityKey, record, reasonCodes) {
  return {
    code: 'project-public-scope-use-def-ambiguous-evidence',
    gateId: 'project-graph-delta',
    message: `Output public scope/use-def binding ${JSON.stringify(identityKey)} has unsupported or ambiguous use-def evidence.`,
    sourcePath: record.sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-use-def-ambiguous-evidence',
      conflictKey: `project-graph-delta#scope-use-def-ambiguous#${identityKey}`,
      identityKey,
      sourcePath: record.sourcePath,
      reasonCodes,
      output: scopeDetails(record)
    })
  };
}

function scopeBindingAmbiguousReasonCodes(record) {
  return uniqueStrings([
    ...statusReasonCodes(record?.scopeUseDefStatus, record?.scopeUseDefReasonCodes, ScopeBindingBlockedFallbackReason),
    ...statusReasonCodes(record?.aliasResolutionStatus, record?.aliasResolutionReasonCodes, ScopeBindingBlockedFallbackReason)
  ]);
}

function scopeIdentityKey(record) {
  return stableKey(['scope-binding', record?.sourcePath, record?.publicOwnerName, record?.name, record?.bindingKind, record?.namespaces?.join('|'), record?.ordinal]);
}

function projectScopeReferenceDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph) {
  const base = publicScopeReferences(baseGraph.scopeReferenceRecords);
  const worker = publicScopeReferences(workerGraph.scopeReferenceRecords);
  const head = publicScopeReferences(headGraph.scopeReferenceRecords);
  const output = publicScopeReferences(outputGraph?.scopeReferenceRecords);
  return uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [scopeReferenceFingerprint(baseRecord), scopeReferenceFingerprint(workerRecord), scopeReferenceFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [projectScopeReferenceDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
}

function projectScopeReferenceDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-public-scope-reference-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed public scope/use-def reference ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-reference-delta-conflict',
      conflictKey: `project-graph-delta#scope-reference#${identityKey}`,
      identityKey,
      sourcePath,
      base: scopeReferenceDetails(baseRecord),
      worker: scopeReferenceDetails(workerRecord),
      head: scopeReferenceDetails(headRecord),
      output: scopeReferenceDetails(outputRecord)
    })
  };
}

function projectScopeReferenceAmbiguousEvidenceConflict(identityKey, record, reasonCodes) {
  return {
    code: 'project-public-scope-reference-ambiguous-evidence',
    gateId: 'project-graph-delta',
    message: `Output public scope/use-def reference ${JSON.stringify(identityKey)} has unsupported or ambiguous evidence.`,
    sourcePath: record.sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-reference-ambiguous-evidence',
      conflictKey: `project-graph-delta#scope-reference-ambiguous#${identityKey}`,
      identityKey,
      sourcePath: record.sourcePath,
      reasonCodes,
      output: scopeReferenceDetails(record)
    })
  };
}

function scopeReferenceAmbiguousReasonCodes(record) {
  return uniqueStrings([
    ...statusReasonCodes(record?.status, record?.reasonCodes, ScopeReferenceBlockedFallbackReason),
    ...statusReasonCodes(record?.aliasResolutionStatus, record?.aliasResolutionReasonCodes, ScopeReferenceBlockedFallbackReason),
    ...statusReasonCodes(record?.compilerReferenceStatus, record?.compilerReferenceReasonCodes, ScopeReferenceBlockedFallbackReason)
  ]);
}

function statusReasonCodes(status, reasonCodes, fallbackReasonCode) {
  if (status !== 'blocked' && status !== 'unresolved') return [];
  return reasonCodes?.length ? reasonCodes : [fallbackReasonCode];
}

function publicScopeReferences(records = []) {
  const result = new Map();
  for (const record of records) {
    if (!record?.publicContract) continue;
    const key = scopeReferenceIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function scopeReferenceIdentityKey(record) {
  return stableKey(['scope-reference', record?.sourcePath, record?.publicOwnerName, record?.bindingName ?? record?.name, record?.namespace, record?.ordinal ?? record?.start]);
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { projectScopeUseDefDeltaConflicts };
