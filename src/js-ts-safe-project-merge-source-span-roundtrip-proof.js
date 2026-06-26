import { createParserTriviaExactnessRecord } from './native-source-preservation-ownership.js';

function sourceSpanRoundtripEvidence(id, fileResults, level, legacyLevel) {
  const outputFiles = fileResults.filter((file) => typeof file.outputSourceText === 'string');
  const changedOutputFiles = outputFiles.filter((file) => !hashMatchesBase(file));
  const changedSourceResults = changedOutputFiles.filter((file) => file.result);
  const facts = changedSourceResults.map(sourceSpanRoundtripFacts);
  const failed = facts.filter((fact) => fact.status === 'failed');
  const missing = facts.filter((fact) => fact.status === 'missing');
  const admissionBlockingFailed = failed.filter((fact) => fact.roundtripProofAdmissionBlocker);
  const requiredMissing = missing.filter((fact) => fact.roundtripProofRequired);
  const parserTriviaExactness = parserTriviaExactnessSummary(facts);
  const changedWithoutSourceResults = changedOutputFiles.filter((file) => !file.result && sourceSpanRoundtripRequired(file)).length;
  const status = admissionBlockingFailed.length ? 'failed'
    : changedWithoutSourceResults || requiredMissing.length ? 'skipped'
      : changedOutputFiles.length ? 'passed' : 'skipped';
  const missingSignal = status === 'skipped' && changedOutputFiles.length > 0 ? 'source-span-roundtrip-evidence-not-produced' : undefined;
  return evidenceRecord({
    id,
    suffix: 'source_span_roundtrip',
    level,
    status,
    scope: 'source-files',
    summary: summaryFor(status, facts, changedOutputFiles),
    metadata: {
      legacyProofLevel: legacyLevel,
      outputFiles: outputFiles.length,
      changedOutputFiles: changedOutputFiles.length,
      changedSourceResults: changedSourceResults.length,
      passedSourceResults: facts.filter((fact) => fact.status === 'passed').length,
      failedSourceResults: failed.length,
      admissionBlockingFailedSourceResults: admissionBlockingFailed.length,
      sourceSpanRoundtripAdmissionBlockerSourcePaths: admissionBlockingFailed.map((fact) => fact.sourcePath),
      missingSourceResults: missing.length + Math.max(0, changedWithoutSourceResults),
      missingRequiredSourceResults: requiredMissing.length + Math.max(0, changedWithoutSourceResults),
      semanticReplayVerifiedFiles: facts.filter((fact) => fact.semanticArtifactsStatus === 'verified').length,
      sourceSpanOperations: sumBy(facts, (fact) => fact.sourceSpanOperations),
      projectionEdits: sumBy(facts, (fact) => fact.projectionEdits),
      spanLinkedProjectionEdits: sumBy(facts, (fact) => fact.spanLinkedProjectionEdits),
      replayVerifiedFiles: facts.filter((fact) => fact.replayOutputMatchesMerged).length,
      parserTriviaExactnessStatus: parserTriviaExactness.status,
      exactParserTriviaFiles: parserTriviaExactness.exact,
      approximateParserTriviaFiles: parserTriviaExactness.approximate,
      blockedParserTriviaFiles: parserTriviaExactness.blocked,
      parserTriviaExactnessReasonCodes: parserTriviaExactness.reasonCodes,
      parserTriviaExactnessBlockReasonCodes: parserTriviaExactness.blockReasonCodes,
      missingSignal,
      nextAction: missingSignal ? 'Supply verified semantic artifacts with source spans, projected edits, and clean replay output for every changed source file.' : undefined
    }
  });
}

function sourceSpanRoundtripFacts(file) {
  const artifacts = file.semanticArtifacts ?? file.result?.semanticArtifacts;
  const operations = Array.isArray(artifacts?.script?.operations) ? artifacts.script.operations : [];
  const projectionEdits = Array.isArray(artifacts?.projection?.edits) ? artifacts.projection.edits : [];
  const sourceSpanOperations = operations.filter(operationHasSourceSpan).length;
  const spanLinkedProjectionEdits = projectionEdits.filter(editHasSourceSpan).length;
  const gatesPassed = (file.result?.gates ?? []).every((gate) => gate.status === 'passed');
  const projectedSourceMatchesMerged = artifacts?.summary?.projectedSourceMatchesMerged === true;
  const replayOutputMatchesMerged = artifacts?.summary?.replayOutputMatchesMerged === true;
  const parserTriviaExactness = parserTriviaExactnessForFile(file, artifacts);
  const roundtripProofRequired = sourceSpanRoundtripRequired(file);
  const status = parserTriviaExactness.status === 'blocked' || file.result?.status !== 'merged' || artifacts?.status === 'blocked'
    ? 'failed'
    : !artifacts || artifacts.status !== 'verified' || !gatesPassed || !projectedSourceMatchesMerged || !replayOutputMatchesMerged || !sourceSpanOperations || !spanLinkedProjectionEdits
      ? 'missing'
      : 'passed';
  return {
    sourcePath: file.sourcePath,
    status,
    semanticArtifactsStatus: artifacts?.status,
    gatesPassed,
    operations: operations.length,
    sourceSpanOperations,
    projectionEdits: projectionEdits.length,
    spanLinkedProjectionEdits,
    roundtripProofRequired,
    roundtripProofAdmissionBlocker: roundtripProofRequired && status === 'failed',
    projectedSourceMatchesMerged,
    replayOutputMatchesMerged,
    parserTriviaExactnessStatus: parserTriviaExactness.status,
    exactParserTrivia: parserTriviaExactness.exactParserTrivia,
    parserTriviaExactnessReasonCodes: parserTriviaExactness.reasonCodes,
    parserTriviaExactnessBlockReasonCodes: parserTriviaExactness.blockReasonCodes
  };
}

function parserTriviaExactnessForFile(file, artifacts) {
  return createParserTriviaExactnessRecord(
    file.parserTriviaExactness
      ?? file.parserTriviaEvidence
      ?? file.metadata?.parserTriviaExactness
      ?? file.result?.metadata?.parserTriviaExactness
      ?? artifacts?.metadata?.parserTriviaExactness,
    {
      sourcePath: file.sourcePath,
      sourceHash: file.outputHash,
      parserEvidence: artifacts?.metadata?.parserEvidence
    }
  );
}

function parserTriviaExactnessSummary(facts) {
  const exact = facts.filter((fact) => fact.parserTriviaExactnessStatus === 'exact').length;
  const blocked = facts.filter((fact) => fact.parserTriviaExactnessStatus === 'blocked').length;
  const approximate = facts.filter((fact) => fact.parserTriviaExactnessStatus === 'approximate').length;
  const reasonCodes = uniqueStrings(facts.flatMap((fact) => fact.parserTriviaExactnessReasonCodes ?? []));
  const blockReasonCodes = uniqueStrings(facts.flatMap((fact) => fact.parserTriviaExactnessBlockReasonCodes ?? []));
  return {
    status: blocked ? 'blocked' : exact && exact === facts.length ? 'exact' : facts.length ? 'approximate' : 'absent',
    exact,
    approximate,
    blocked,
    reasonCodes,
    blockReasonCodes
  };
}

function summaryFor(status, facts, changedOutputFiles) {
  if (status === 'passed') return `Verified source-span projection and replay roundtrip evidence for ${facts.filter((fact) => fact.status === 'passed').length} changed source file(s).`;
  if (status === 'failed') return `Source-span projection or replay roundtrip evidence failed for ${facts.filter((fact) => fact.status === 'failed').length} changed source file(s).`;
  return changedOutputFiles.length
    ? 'Changed project output is missing source-span projection or replay roundtrip evidence.'
    : 'No changed source output required source-span roundtrip evidence.';
}

function evidenceRecord(input) {
  return {
    id: `${input.id}_proof_${input.suffix}`,
    kind: 'js-ts-project-merge-proof-evidence',
    level: input.level,
    status: input.status,
    scope: input.scope,
    claimKind: 'evidence',
    evidenceOnly: true,
    proofClaim: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    summary: input.summary,
    metadata: compactRecord({ ...(input.metadata ?? {}), proofClaim: false, autoMergeClaim: false, semanticEquivalenceClaim: false })
  };
}

function operationHasSourceSpan(operation) {
  return isSpan(operation?.anchor?.sourceSpan) || isSpan(operation?.spans?.worker) || isSpan(operation?.spans?.head) || isSpan(operation?.spans?.base);
}
function editHasSourceSpan(edit) {
  return Number.isFinite(edit?.workerStart) && Number.isFinite(edit?.workerEnd)
    || Number.isFinite(edit?.headStart) && Number.isFinite(edit?.headEnd)
    || Number.isFinite(edit?.start) && Number.isFinite(edit?.end);
}
function hashMatchesBase(file) { return Boolean(file.baseHash) && file.outputHash === file.baseHash; }
function sourceSpanRoundtripRequired(file) { return !preservesSingleChangedInput(file); }
function preservesSingleChangedInput(file) {
  const workerChanged = file.workerHash !== file.baseHash;
  const headChanged = file.headHash !== file.baseHash;
  if (workerChanged && !headChanged && file.outputHash === file.workerHash) return true;
  if (headChanged && !workerChanged && file.outputHash === file.headHash) return true;
  return workerChanged && headChanged && file.workerHash === file.headHash && file.outputHash === file.workerHash;
}
function isSpan(value) { return isOffsetSpan(value) || isLineColumnSpan(value); }
function isOffsetSpan(value) { return Number.isFinite(value?.start) && Number.isFinite(value?.end); }
function isLineColumnSpan(value) {
  return Number.isFinite(value?.startLine) && Number.isFinite(value?.endLine)
    && Number.isFinite(value?.startColumn) && Number.isFinite(value?.endColumn);
}
function sumBy(values, valueFor) { return values.reduce((total, value) => total + Number(valueFor(value) ?? 0), 0); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { sourceSpanRoundtripEvidence };
