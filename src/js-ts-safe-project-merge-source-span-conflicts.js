import { compactRecord } from './js-ts-safe-merge-context.js';

function projectSourceSpanDeltaConflicts(projectGraphDelta) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return [];
  const ownershipBlockers = projectSourceOwnershipBlockerConflicts(projectGraphDelta);
  const base = sourceSpanRecordsByIdentityKey(baseGraph.sourceSpanRecords);
  const worker = sourceSpanRecordsByIdentityKey(workerGraph.sourceSpanRecords);
  const head = sourceSpanRecordsByIdentityKey(headGraph.sourceSpanRecords);
  const output = sourceSpanRecordsByIdentityKey(outputGraph?.sourceSpanRecords);
  const keys = uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]);
  const deltaConflicts = keys.flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [sourceSpanFingerprint(baseRecord), sourceSpanFingerprint(workerRecord), sourceSpanFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [sourceSpanConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
  return [...ownershipBlockers, ...deltaConflicts];
}

function sourceSpanConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-source-span-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed source span ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-source-span-delta-conflict',
      conflictKey: `project-graph-delta#source-span#${identityKey}`,
      identityKey,
      sourcePath,
      base: sourceSpanDetails(baseRecord),
      worker: sourceSpanDetails(workerRecord),
      head: sourceSpanDetails(headRecord),
      output: sourceSpanDetails(outputRecord)
    })
  };
}

function sourceSpanRecordsByIdentityKey(records = []) {
  const result = new Map();
  for (const record of records ?? []) {
    if (!isTrackedSourceSpan(record)) continue;
    const key = sourceSpanIdentityKey(record);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

function isTrackedSourceSpan(record) {
  return record?.directive || record?.protected || record?.role === 'comment' || isCommentKind(record?.kind) || record?.kind === 'source-map-comment' || record?.kind === 'shebang';
}

function sourceSpanIdentityKey(record) {
  return record?.identityKey
    ?? record?.ownershipAnchorKey
    ?? record?.stableId
    ?? stableKey(['source-span', record?.sourcePath, record?.role, record?.kind, sourceSpanIdentityAnchor(record)]);
}

function sourceSpanFingerprint(record) {
  return record ? stableKey([
    record.stableHash,
    record.textHash,
    record.textLength,
    record.directive,
    record.protected,
    record.trivia,
    record.ownershipAnchorKey,
    record.ownershipAnchorStatus,
    record.parserTriviaExactnessStatus,
    ...(record.parserTriviaExactnessBlockReasonCodes ?? []),
    record.parserTriviaOwnershipStatus,
    record.parserTriviaOwnershipRelation,
    ...(record.parserTriviaOwnershipBlockReasonCodes ?? []),
    record.sourceMapGeneratedBoundaryStatus,
    record.sourceMapGeneratedBoundaryOwnershipStatus,
    ...(record.sourceMapGeneratedBoundaryOwnershipKeys ?? []),
    ...(record.sourceMapGeneratedBoundaryBlockReasonCodes ?? []),
    generatedBoundaryPositionFingerprint(record)
  ]) : undefined;
}

function sourceSpanDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    stableId: record.stableId,
    key: sourceSpanIdentityKey(record),
    identityKey: record.identityKey,
    role: record.role,
    kind: record.kind,
    ordinal: record.ordinal,
    identityOccurrence: record.identityOccurrence,
    startLine: record.sourceSpan?.startLine,
    startColumn: record.sourceSpan?.startColumn,
    textHash: record.textHash,
    stableHash: record.stableHash,
    signatureHash: record.signatureHash,
    ownershipAnchorKey: record.ownershipAnchorKey,
    ownershipAnchorHash: record.ownershipAnchorHash,
    ownershipAnchorStatus: record.ownershipAnchorStatus,
    ownershipBlockReasonCodes: record.ownershipBlockReasonCodes,
    parserEvidence: record.parserEvidence,
    losslessCst: record.losslessCst,
    parserTriviaExactnessStatus: record.parserTriviaExactnessStatus,
    exactParserTrivia: record.exactParserTrivia,
    parserTriviaExactnessReasonCodes: record.parserTriviaExactnessReasonCodes,
    parserTriviaExactnessBlockReasonCodes: record.parserTriviaExactnessBlockReasonCodes,
    parserTriviaOwnershipStatus: record.parserTriviaOwnershipStatus,
    parserTriviaOwnershipRelation: record.parserTriviaOwnershipRelation,
    parserTriviaOwnershipReasonCodes: record.parserTriviaOwnershipReasonCodes,
    parserTriviaOwnershipBlockReasonCodes: record.parserTriviaOwnershipBlockReasonCodes,
    ...sourceMapGeneratedBoundaryDetails(record),
    generatedBoundaryPositionKey: generatedBoundaryPositionFingerprint(record),
    sourceHash: record.sourceHash,
    start: record.start,
    end: record.end,
    directive: record.directive,
    protected: record.protected,
    trivia: record.trivia
  });
}

function generatedBoundaryPositionFingerprint(record) {
  if (record?.kind !== 'source-map-comment' && record?.ownershipAnchor?.anchorKind !== 'generated-source-boundary') return undefined;
  const span = record.sourceSpan;
  return stableKey(['generated-boundary-position', span?.startLine, span?.startColumn, span?.endLine, span?.endColumn]);
}

function sourceMapGeneratedBoundaryDetails(record) {
  return compactRecord({
    sourceMapGeneratedBoundaryStatus: record.sourceMapGeneratedBoundaryStatus,
    sourceMapGeneratedBoundaryReadiness: record.sourceMapGeneratedBoundaryReadiness,
    sourceMapGeneratedBoundaryAction: record.sourceMapGeneratedBoundaryAction,
    sourceMapGeneratedBoundaryReviewRequired: record.sourceMapGeneratedBoundaryReviewRequired,
    sourceMapGeneratedBoundaryExactBoundary: record.sourceMapGeneratedBoundaryExactBoundary,
    sourceMapGeneratedBoundaryOwnershipStatus: record.sourceMapGeneratedBoundaryOwnershipStatus,
    sourceMapGeneratedBoundaryOwnershipKeys: record.sourceMapGeneratedBoundaryOwnershipKeys,
    sourceMapGeneratedBoundaryReasonCodes: record.sourceMapGeneratedBoundaryReasonCodes,
    sourceMapGeneratedBoundaryBlockReasonCodes: record.sourceMapGeneratedBoundaryBlockReasonCodes,
    sourceMapGeneratedBoundaryMissingInvariant: record.sourceMapGeneratedBoundaryMissingInvariant,
    sourceMapRecordCount: record.sourceMapRecordCount,
    sourceMapMappingCount: record.sourceMapMappingCount,
    sourceMapIds: record.sourceMapIds,
    sourceMapMappingIds: record.sourceMapMappingIds
  });
}

function projectSourceOwnershipBlockerConflicts(projectGraphDelta) {
  return uniqueSourceOwnershipBlockers([
    ['base', projectGraphDelta?.stages?.base?.projectSymbolGraph],
    ['worker', projectGraphDelta?.stages?.worker?.projectSymbolGraph],
    ['head', projectGraphDelta?.stages?.head?.projectSymbolGraph],
    ['output', projectGraphDelta?.stages?.output?.projectSymbolGraph]
  ].flatMap(([stage, graph]) => [
    ...sourceFileOwnershipBlockers(stage, graph?.sourceFileRecords),
    ...sourceSpanOwnershipBlockers(stage, graph?.sourceSpanRecords),
    ...sourceMapGeneratedBoundaryBlockers(stage, graph?.sourceFileRecords, graph?.sourceSpanRecords)
  ]));
}

function sourceFileOwnershipBlockers(stage, records = []) {
  return (records ?? [])
    .filter((record) => record?.triviaOwnershipStatus === 'blocked' || (record?.triviaOwnershipBlockReasonCodes ?? []).length)
    .map((record) => ({
      code: 'project-source-trivia-ownership-blocked',
      gateId: 'project-graph-delta',
      message: `Project ${stage} source ${JSON.stringify(record.sourcePath ?? 'unknown')} lacks deterministic trivia ownership evidence.`,
      sourcePath: record.sourcePath,
      details: compactRecord({
        reasonCode: 'project-source-trivia-ownership-blocked',
        conflictKey: `project-graph-delta#source-trivia-ownership#${stage}#${record.sourcePath ?? record.id}`,
        stage,
        sourcePath: record.sourcePath,
        sourceHash: record.sourceHash,
        triviaOwnershipStatus: record.triviaOwnershipStatus,
        triviaOwnershipReasonCodes: record.triviaOwnershipReasonCodes,
        triviaOwnershipBlockReasonCodes: record.triviaOwnershipBlockReasonCodes,
        parserEvidence: record.parserEvidence,
        losslessCst: record.losslessCst,
        parserTriviaExactnessStatus: record.parserTriviaExactnessStatus,
        exactParserTrivia: record.exactParserTrivia,
        parserTriviaExactnessReasonCodes: record.parserTriviaExactnessReasonCodes,
        parserTriviaExactnessBlockReasonCodes: record.parserTriviaExactnessBlockReasonCodes,
        parserTriviaOwnershipStatus: record.parserTriviaOwnershipStatus,
        parserTriviaOwnershipRelation: record.parserTriviaOwnershipRelation,
        parserTriviaOwnershipReasonCodes: record.parserTriviaOwnershipReasonCodes,
        parserTriviaOwnershipBlockReasonCodes: record.parserTriviaOwnershipBlockReasonCodes,
        ...sourceMapGeneratedBoundaryDetails(record),
        roundtripHash: record.roundtripHash
      })
    }));
}

function sourceSpanOwnershipBlockers(stage, records = []) {
  return (records ?? [])
    .filter((record) => record?.ownershipAnchorStatus === 'blocked' || (record?.ownershipBlockReasonCodes ?? []).length)
    .map((record) => ({
      code: 'project-source-span-ownership-blocked',
      gateId: 'project-graph-delta',
      message: `Project ${stage} source span ${JSON.stringify(sourceSpanIdentityKey(record) ?? record.id ?? 'unknown')} lacks deterministic ownership evidence.`,
      sourcePath: record.sourcePath,
      details: compactRecord({
        reasonCode: 'project-source-span-ownership-blocked',
        conflictKey: `project-graph-delta#source-span-ownership#${stage}#${sourceSpanIdentityKey(record) ?? record.id}`,
        stage,
        identityKey: sourceSpanIdentityKey(record),
        sourcePath: record.sourcePath,
        role: record.role,
        kind: record.kind,
        ownershipAnchorStatus: record.ownershipAnchorStatus,
        ownershipAnchorKey: record.ownershipAnchorKey,
        ownershipAnchorHash: record.ownershipAnchorHash,
        ownershipBlockReasonCodes: record.ownershipBlockReasonCodes,
        parserEvidence: record.parserEvidence,
        losslessCst: record.losslessCst,
        parserTriviaExactnessStatus: record.parserTriviaExactnessStatus,
        exactParserTrivia: record.exactParserTrivia,
        parserTriviaExactnessReasonCodes: record.parserTriviaExactnessReasonCodes,
        parserTriviaExactnessBlockReasonCodes: record.parserTriviaExactnessBlockReasonCodes,
        ...sourceMapGeneratedBoundaryDetails(record),
        roundtripHash: record.roundtripHash
      })
    }));
}

function sourceMapGeneratedBoundaryBlockers(stage, fileRecords = [], spanRecords = []) {
  return [
    ...(fileRecords ?? [])
      .filter(hasBlockedSourceMapGeneratedBoundary)
      .map((record) => sourceMapGeneratedBoundaryBlocker(stage, record, 'source-file')),
    ...(spanRecords ?? [])
      .filter((record) => record?.kind === 'source-map-comment' || record?.ownershipAnchor?.anchorKind === 'generated-source-boundary')
      .filter(hasBlockedSourceMapGeneratedBoundary)
      .map((record) => sourceMapGeneratedBoundaryBlocker(stage, record, 'source-span'))
  ];
}

function hasBlockedSourceMapGeneratedBoundary(record) {
  return record?.sourceMapGeneratedBoundaryStatus === 'blocked'
    || record?.sourceMapGeneratedBoundaryOwnershipStatus === 'blocked'
    || (record?.sourceMapGeneratedBoundaryBlockReasonCodes ?? []).length > 0;
}

function sourceMapGeneratedBoundaryBlocker(stage, record, recordKind) {
  const identityKey = recordKind === 'source-span' ? sourceSpanIdentityKey(record) : record.sourcePath ?? record.id;
  return {
    code: 'project-generated-source-boundary-ownership-blocked',
    gateId: 'project-graph-delta',
    message: `Project ${stage} generated source boundary ${JSON.stringify(identityKey ?? 'unknown')} lacks deterministic source-map ownership evidence.`,
    sourcePath: record.sourcePath,
    details: compactRecord({
      reasonCode: 'project-generated-source-boundary-ownership-blocked',
      conflictKey: `project-graph-delta#generated-source-boundary-ownership#${stage}#${recordKind}#${identityKey ?? record.id}`,
      stage,
      recordKind,
      identityKey,
      sourcePath: record.sourcePath,
      role: record.role,
      kind: record.kind,
      sourceHash: record.sourceHash,
      ...sourceMapGeneratedBoundaryDetails(record),
      roundtripHash: record.roundtripHash
    })
  };
}

function uniqueSourceOwnershipBlockers(conflicts) {
  const seen = new Set();
  return conflicts.filter((conflict) => {
    const key = conflict.details?.conflictKey ?? JSON.stringify(conflict);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceSpanIdentityAnchor(record) {
  if (record?.directive) {
    if (record.kind === 'runtime-directive') return 'runtime-directive-prologue';
    if (record.kind === 'source-map-comment') return 'source-map-comment';
    if (record.kind === 'typescript-reference') return 'typescript-reference';
    return record.textHash ?? record.kind ?? 'directive';
  }
  if (record?.kind === 'source-map-comment') return 'source-map-comment';
  if (record?.protected) return stableKey(['protected', record.textHash ?? record.kind]);
  if (record?.trivia || record?.role === 'comment') return stableKey(['trivia', record.textHash ?? record.kind]);
  return record?.textHash ?? record?.kind ?? record?.role;
}

function isCommentKind(kind) {
  return kind === 'comment' || kind === 'jsdoc-comment' || kind === 'block-comment';
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { projectSourceSpanDeltaConflicts };
