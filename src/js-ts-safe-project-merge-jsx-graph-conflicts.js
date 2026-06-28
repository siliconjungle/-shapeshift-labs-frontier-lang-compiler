import { compactRecord } from './js-ts-safe-merge-context.js';
import { jsxHookEffectSourceProofAssessment } from './js-ts-safe-project-merge-jsx-hook-effect-proof.js';
import { jsxRenderReturnBranchProofAssessment } from './js-ts-safe-project-merge-jsx-render-branch-proof.js';
import { jsxRenderReturnCollectionProofAssessment } from './js-ts-safe-project-merge-jsx-render-collection-proof.js';
import {
  hasRenderRisk,
  jsxChildOrderDetails,
  jsxChildOrderFingerprint,
  jsxChildOrderIdentityKey,
  jsxPropDetails,
  jsxPropFingerprint,
  jsxPropIdentityKey,
  jsxPropLabel,
  jsxRenderRiskDetails,
  jsxRenderRiskFingerprint,
  jsxRenderRiskIdentityKey,
  jsxRenderRiskReasonCodes
} from './js-ts-safe-project-merge-jsx-graph-conflict-details.js';
function projectJsxPropDeltaConflicts(projectGraphDelta) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return [];
  const base = publicJsxProps(baseGraph.jsxPropRecords);
  const worker = publicJsxProps(workerGraph.jsxPropRecords);
  const head = publicJsxProps(headGraph.jsxPropRecords);
  const output = publicJsxProps(outputGraph?.jsxPropRecords);
  return uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [jsxPropFingerprint(baseRecord), jsxPropFingerprint(workerRecord), jsxPropFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [projectJsxPropDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
}
function projectJsxRenderRiskDeltaConflicts(projectGraphDelta, options = {}) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return [];
  const base = publicJsxRenderRisks(baseGraph.jsxElementRecords);
  const worker = publicJsxRenderRisks(workerGraph.jsxElementRecords);
  const head = publicJsxRenderRisks(headGraph.jsxElementRecords);
  const output = publicJsxRenderRisks(outputGraph?.jsxElementRecords);
  return uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [jsxRenderRiskFingerprint(baseRecord), jsxRenderRiskFingerprint(workerRecord), jsxRenderRiskFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    const outputRecord = output.get(identityKey);
    const branchProof = jsxRenderReturnBranchProofAssessment({ identityKey, baseRecord, workerRecord, headRecord, outputRecord }, options);
    if (branchProof?.status === 'passed') return [];
    const hookEffectProof = jsxHookEffectSourceProofAssessment({ identityKey, baseRecord, workerRecord, headRecord, outputRecord }, options);
    if (hookEffectProof?.status === 'passed') return [];
    const collectionProof = jsxRenderReturnCollectionProofAssessment({ identityKey, baseRecord, workerRecord, headRecord, outputRecord }, options);
    if (collectionProof?.status === 'passed') return [];
    return [projectJsxRenderRiskDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord, branchProof, hookEffectProof, collectionProof)];
  });
}
function projectJsxChildOrderDeltaConflicts(projectGraphDelta) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return [];
  const base = publicJsxChildOrders(baseGraph.jsxElementRecords);
  const worker = publicJsxChildOrders(workerGraph.jsxElementRecords);
  const head = publicJsxChildOrders(headGraph.jsxElementRecords);
  const output = publicJsxChildOrders(outputGraph?.jsxElementRecords);
  return uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [jsxChildOrderFingerprint(baseRecord), jsxChildOrderFingerprint(workerRecord), jsxChildOrderFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [projectJsxChildOrderDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
}
function projectJsxPropDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  const label = jsxPropLabel(workerRecord ?? headRecord ?? baseRecord);
  return {
    code: 'project-jsx-public-prop-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed JSX public ${label} ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-jsx-public-prop-delta-conflict',
      conflictKey: `project-graph-delta#jsx-prop#${identityKey}`,
      identityKey,
      sourcePath,
      base: jsxPropDetails(baseRecord),
      worker: jsxPropDetails(workerRecord),
      head: jsxPropDetails(headRecord),
      output: jsxPropDetails(outputRecord)
    })
  };
}
function projectJsxChildOrderDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-jsx-public-child-order-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed JSX keyed child order evidence ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-jsx-public-child-order-delta-conflict',
      conflictKey: `project-graph-delta#jsx-child-order#${identityKey}`,
      identityKey,
      sourcePath,
      base: jsxChildOrderDetails(baseRecord),
      worker: jsxChildOrderDetails(workerRecord),
      head: jsxChildOrderDetails(headRecord),
      output: jsxChildOrderDetails(outputRecord)
    })
  };
}
function projectJsxRenderRiskDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord, branchProof, hookEffectProof, collectionProof) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-jsx-public-render-risk-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed JSX public render-semantics evidence ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-jsx-public-render-risk-delta-conflict',
      reasonCodes: uniqueStrings([...jsxRenderRiskReasonCodes(baseRecord, workerRecord, headRecord, outputRecord), ...(branchProof?.reasonCodes ?? []), ...(hookEffectProof?.reasonCodes ?? []), ...(collectionProof?.reasonCodes ?? [])]),
      conflictKey: `project-graph-delta#jsx-render-risk#${identityKey}`,
      identityKey,
      sourcePath,
      routeId: branchProof?.routeId ?? hookEffectProof?.routeId ?? collectionProof?.routeId,
      routeLane: branchProof?.routeLane ?? hookEffectProof?.routeLane ?? collectionProof?.routeLane,
      routeNext: branchProof?.routeNext ?? hookEffectProof?.routeNext ?? collectionProof?.routeNext,
      base: jsxRenderRiskDetails(baseRecord),
      worker: jsxRenderRiskDetails(workerRecord),
      head: jsxRenderRiskDetails(headRecord),
      output: jsxRenderRiskDetails(outputRecord),
      jsxRenderReturnBranchProof: branchProof?.record,
      jsxHookEffectSourceProof: hookEffectProof?.record,
      jsxRenderReturnCollectionProof: collectionProof?.record,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false
    })
  };
}
function publicJsxProps(records = []) {
  const result = new Map();
  for (const record of records) {
    if (!record?.publicContract) continue;
    const key = jsxPropIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}
function publicJsxRenderRisks(records = []) {
  const result = new Map();
  for (const record of records ?? []) {
    if (!record?.publicContract || !hasRenderRisk(record)) continue;
    const key = jsxRenderRiskIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}
function publicJsxChildOrders(records = []) {
  const result = new Map();
  for (const record of records ?? []) {
    if (!record?.publicContract || !record?.keyPropValue) continue;
    const key = jsxChildOrderIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { projectJsxChildOrderDeltaConflicts, projectJsxPropDeltaConflicts, projectJsxRenderRiskDeltaConflicts };
