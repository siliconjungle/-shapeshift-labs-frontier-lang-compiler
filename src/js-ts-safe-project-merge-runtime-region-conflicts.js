import { compactRecord } from './js-ts-safe-merge-context.js';
import { runtimeOrderEvidenceBinding } from './internal/index-impl/runtimeOrderEvidenceBinding.js';
import { runtimeOrderReasonCodes } from './internal/index-impl/semanticEditRuntimeOrderReasons.js';

function projectRuntimeRegionDeltaConflicts(projectGraphDelta, options = {}) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return [];
  const base = runtimeRecordsByIdentityKey(baseGraph.runtimeRegionRecords);
  const worker = runtimeRecordsByIdentityKey(workerGraph.runtimeRegionRecords);
  const head = runtimeRecordsByIdentityKey(headGraph.runtimeRegionRecords);
  const output = runtimeRecordsByIdentityKey(outputGraph?.runtimeRegionRecords);
  return uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [runtimeFingerprint(baseRecord), runtimeFingerprint(workerRecord), runtimeFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    const explicitEvidence = projectRuntimeOrderEvidenceBinding(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey), options);
    if (explicitEvidence.passed) return [];
    return [projectRuntimeRegionDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey), explicitEvidence)];
  });
}

function projectRuntimeRegionDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord, explicitEvidence) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-public-runtime-region-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed public runtime region ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-runtime-region-delta-conflict',
      conflictKey: `project-graph-delta#runtime-region#${identityKey}`,
      identityKey,
      sourcePath,
      reasonCodes: runtimeConflictReasonCodes(baseRecord, workerRecord, headRecord, outputRecord, explicitEvidence),
      explicitRuntimeOrderEvidence: explicitEvidenceDetails(explicitEvidence),
      base: runtimeDetails(baseRecord),
      worker: runtimeDetails(workerRecord),
      head: runtimeDetails(headRecord),
      output: runtimeDetails(outputRecord)
    })
  };
}

function projectRuntimeOrderEvidenceBinding(identityKey, baseRecord, workerRecord, headRecord, outputRecord, options) {
  return runtimeOrderEvidenceBinding({
    scriptInput: {
      runtimeOrderEvidence: runtimeOrderEvidenceCandidates(options),
      evidence: options.evidence
    },
    region: outputRecord ?? workerRecord ?? headRecord ?? baseRecord,
    baseSymbol: baseRecord,
    workerSymbol: workerRecord,
    headSymbol: headRecord,
    anchorKey: workerRecord?.key ?? headRecord?.key ?? baseRecord?.key ?? identityKey,
    context: {
      workerChangeSet: {
        sourcePath: workerRecord?.sourcePath ?? baseRecord?.sourcePath,
        beforeHash: baseRecord?.sourceHash,
        afterHash: workerRecord?.sourceHash
      },
      headChangeSet: {
        sourcePath: headRecord?.sourcePath ?? baseRecord?.sourcePath,
        afterHash: headRecord?.sourceHash
      }
    }
  });
}

function runtimeOrderEvidenceCandidates(options) {
  return [
    ...array(options.runtimeOrderEvidence),
    ...array(options.projectRuntimeOrderEvidence),
    ...array(options.metadata?.runtimeOrderEvidence)
  ];
}

function runtimeRecordsByIdentityKey(records = []) {
  const result = new Map();
  for (const record of records) {
    if (!record?.publicContract) continue;
    const key = runtimeIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function runtimeIdentityKey(record) {
  return stableKey(['runtime-region', record?.sourcePath, record?.symbolName, record?.regionKind, record?.runtimeKind, record?.ordinal]);
}

function runtimeFingerprint(record) { return record ? stableKey([record.signatureHash, record.regionKind, record.runtimeKind]) : undefined; }
function runtimeDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    symbolName: record.symbolName,
    symbolKind: record.symbolKind,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    runtimeKinds: record.runtimeKinds,
    line: record.line,
    ordinal: record.ordinal,
    spanKind: record.spanKind,
    runtimeOrderEvidence: record.runtimeOrderEvidence,
    reasonCodes: runtimeRecordReasonCodes(record),
    signatureHash: record.signatureHash,
    sourceHash: record.sourceHash
  });
}

function runtimeConflictReasonCodes(...records) {
  const explicitEvidence = records.find((record) => record?.reasonCodes);
  const runtimeRecords = records.filter((record) => !record?.reasonCodes);
  return uniqueStrings([
    'project-public-runtime-region-delta-conflict',
    ...(explicitEvidence?.reasonCodes ?? []),
    ...runtimeRecords.flatMap(runtimeRecordReasonCodes)
  ]);
}

function explicitEvidenceDetails(evidence) {
  if (!evidence?.reasonCodes?.length) return undefined;
  return {
    status: 'failed',
    reasonCodes: evidence.reasonCodes,
    evidenceIds: evidence.evidenceIds
  };
}

function runtimeRecordReasonCodes(record) {
  if (!record) return [];
  return runtimeOrderReasonCodes({
    region: {
      ...record,
      metadata: {
        factKinds: record.runtimeKinds ?? (record.runtimeKind ? [record.runtimeKind] : undefined),
        runtimeOrderEvidence: record.runtimeOrderEvidence,
        subjectName: record.symbolName
      }
    }
  });
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }

export { projectRuntimeRegionDeltaConflicts };
