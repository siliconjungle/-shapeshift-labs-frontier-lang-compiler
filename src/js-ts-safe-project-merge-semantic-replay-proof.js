import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  boundedCurrentHeadAggregateRoute,
  boundedCurrentHeadRouteForFact,
  boundedCurrentHeadRouteReasonCodes,
  replayAppliedOperations
} from './js-ts-safe-project-merge-semantic-replay-proof-routes.js';
import {
  semanticReplayMissingSignal,
  semanticReplayNextAction,
  semanticReplayNextMissingEvidence
} from './js-ts-safe-project-merge-semantic-replay-routes.js';

function semanticEditReplayCleanEvidence(id, fileResults, level) {
  const rawFacts = fileResults
    .map(semanticReplayFact)
    .filter((fact) => fact.semanticArtifacts && fact.changedOrBlocked);
  const facts = rawFacts.map((fact) => {
    const boundedRouteReasonCodes = fact.status === 'passed'
      ? boundedCurrentHeadRouteReasonCodes(fact, level)
      : [];
    const checkedFact = boundedRouteReasonCodes.length
      ? { ...fact, reasonCodes: uniqueStrings([...fact.reasonCodes, ...boundedRouteReasonCodes]) }
      : fact;
    const boundedAdmissionRoute = boundedCurrentHeadRouteForFact(checkedFact, level);
    return checkedFact.status === 'passed' && !boundedAdmissionRoute
      ? {
          ...checkedFact,
          status: 'missing',
          reasonCodes: uniqueStrings([
            ...checkedFact.reasonCodes,
            'semantic-edit-replay-current-head-proof-missing'
          ]),
          boundedAdmissionRoute
        }
      : { ...checkedFact, boundedAdmissionRoute };
  });
  const failed = facts.filter((fact) => fact.status === 'failed');
  const missing = facts.filter((fact) => fact.status === 'missing');
  const stale = facts.filter((fact) => fact.sourceBindingStatus === 'stale');
  const status = failed.length ? 'failed' : missing.length ? 'skipped' : facts.length ? 'passed' : 'skipped';
  const boundedAdmissionRoutes = facts
    .map((fact) => fact.boundedAdmissionRoute)
    .filter(Boolean);
  const boundedAdmissionRoute = status === 'passed' && boundedAdmissionRoutes.length === facts.length
    ? boundedCurrentHeadAggregateRoute(boundedAdmissionRoutes, level)
    : undefined;
  const missingSignal = semanticReplayMissingSignal(status, facts, failed, stale);
  const nextMissingEvidence = missingSignal ? semanticReplayNextMissingEvidence({
    status,
    level,
    failed,
    missing,
    stale,
    missingSignal
  }) : undefined;
  return evidenceRecord({
    id,
    suffix: 'semantic_edit_replay_clean',
    level,
    status,
    scope: 'source-files',
    summary: semanticReplaySummary(status, facts, failed, missing),
    metadata: {
      semanticArtifactFiles: facts.length,
      replayIds: uniqueStrings(facts.map((fact) => fact.replayId)),
      replayStatuses: uniqueStrings(facts.map((fact) => fact.replayStatus)),
      replayDiagnosticCategories: uniqueStrings(facts.flatMap((fact) => fact.diagnosticCategories)),
      reasonCodes: uniqueStrings(facts.flatMap((fact) => fact.reasonCodes)),
      conflictKeys: uniqueStrings(facts.map((fact) => fact.conflictKey)),
      sourcePaths: uniqueStrings(facts.map((fact) => fact.sourcePath)),
      appliedOperationIds: uniqueStrings(facts.flatMap((fact) => fact.appliedOperations)),
      outputBindingStatuses: uniqueStrings(facts.map((fact) => fact.outputBindingStatus)),
      expectedOutputHashes: uniqueStrings(facts.map((fact) => fact.expectedOutputHash)),
      projectionOutputHashes: uniqueStrings(facts.map((fact) => fact.projectionOutputHash)),
      replayOutputHashes: uniqueStrings(facts.map((fact) => fact.replayOutputHash)),
      outputBindingFailures: facts.filter((fact) => fact.outputBindingStatus === 'failed').length,
      missingOutputBindings: facts.filter((fact) => fact.outputBindingStatus === 'missing').length,
      sourceBindingStatuses: uniqueStrings(facts.map((fact) => fact.sourceBindingStatus)),
      expectedCurrentHashes: uniqueStrings(facts.map((fact) => fact.expectedCurrentHash)),
      replayCurrentHashes: uniqueStrings(facts.map((fact) => fact.replayCurrentHash)),
      replaySourcePaths: uniqueStrings(facts.map((fact) => fact.replaySourcePath)),
      sourceBindingFailures: facts.filter((fact) => fact.sourceBindingStatus === 'failed' || fact.sourceBindingStatus === 'stale').length,
      missingSourceBindings: facts.filter((fact) => fact.sourceBindingStatus === 'missing').length,
      staleReplayFiles: stale.length,
      rerunRouteIds: uniqueStrings(facts.map((fact) => fact.rerunRouteId)),
      proofRouteIds: uniqueStrings(facts.map((fact) => fact.proofRouteId)),
      boundedAdmissionRouteIds: uniqueStrings(boundedAdmissionRoutes.map((route) => route.routeId)),
      currentHeadCommutationProofs: boundedAdmissionRoutes.length,
      boundedAdmissionRoute,
      acceptedCleanReplays: facts.filter((fact) => fact.replayStatus === 'accepted-clean').length,
      alreadyAppliedChecks: facts.filter((fact) => fact.alreadyAppliedReplayStatus === 'already-applied').length,
      failedReplayFiles: failed.length,
      missingReplayFiles: missing.length,
      missingSignal,
      nextAction: semanticReplayNextAction(nextMissingEvidence, missingSignal),
      nextMissingEvidence
    }
  });
}

function semanticReplayFact(file) {
  const artifacts = file.semanticArtifacts ?? file.result?.semanticArtifacts;
  const replay = artifacts?.replay;
  const alreadyAppliedReplay = artifacts?.alreadyAppliedReplay;
  const outputBinding = semanticReplayOutputBinding(file, artifacts, replay);
  const sourceBinding = semanticReplaySourceBinding(file, artifacts, replay);
  const proofRoute = replay?.admission?.proofRoute ?? replay?.metadata?.proofRoute;
  const appliedOperations = replayAppliedOperations(replay);
  const reasonCodes = uniqueStrings([
    ...(artifacts?.admission?.reasonCodes ?? []),
    ...(replay?.admission?.reasonCodes ?? []),
    ...(replay?.summary?.reasonCodes ?? []),
    ...(replay?.diagnostics ?? []).map((diagnostic) => diagnostic.code),
    ...outputBinding.reasonCodes,
    ...sourceBinding.reasonCodes
  ]);
  const diagnosticCategories = uniqueStrings((replay?.diagnostics ?? []).map((diagnostic) => diagnostic.category));
  const replayClean = replay?.status === 'accepted-clean'
    && replay?.outputSourceText === (artifacts?.projection?.sourceText ?? file.outputSourceText);
  const alreadyAppliedClean = alreadyAppliedReplay?.status === 'already-applied';
  const failed = artifacts?.status === 'blocked'
    || ['blocked', 'conflict', 'stale', 'needs-port'].includes(String(replay?.status))
    || outputBinding.status === 'failed'
    || sourceBinding.status === 'failed'
    || sourceBinding.status === 'stale'
    || (replay?.diagnostics ?? []).some((diagnostic) => diagnostic.severity === 'error');
  const missing = Boolean(artifacts) && (!replay || !alreadyAppliedReplay || !replayClean || !alreadyAppliedClean || outputBinding.status === 'missing' || sourceBinding.status === 'missing') && !failed;
  return {
    sourcePath: file.sourcePath,
    semanticArtifacts: Boolean(artifacts),
    changedOrBlocked: file.status !== 'merged' || !file.baseHash || file.outputHash !== file.baseHash,
    status: failed ? 'failed' : missing ? 'missing' : replayClean && alreadyAppliedClean ? 'passed' : 'missing',
    replayId: replay?.id,
    replayStatus: replay?.status,
    alreadyAppliedReplayStatus: alreadyAppliedReplay?.status,
    diagnosticCategories,
    reasonCodes,
    outputBindingStatus: outputBinding.status,
    expectedOutputHash: outputBinding.expectedOutputHash,
    projectionOutputHash: outputBinding.projectionOutputHash,
    replayOutputHash: outputBinding.replayOutputHash,
    sourceBindingStatus: sourceBinding.status,
    expectedCurrentHash: sourceBinding.expectedCurrentHash,
    replayCurrentHash: sourceBinding.replayCurrentHash,
    replaySourcePath: sourceBinding.replaySourcePath,
    appliedOperations,
    rerunRouteId: sourceBinding.rerunRouteId,
    proofRoute,
    proofRouteId: proofRoute?.routeId,
    conflictKey: file.conflictKeys?.[0]
  };
}

function semanticReplaySummary(status, facts, failed, missing) {
  if (status === 'passed') return `Verified clean semantic edit replay evidence for ${facts.length} source file(s).`;
  if (status === 'failed' && failed.some((fact) => fact.sourceBindingStatus === 'stale')) {
    return `Semantic edit replay proof was stale for ${failed.filter((fact) => fact.sourceBindingStatus === 'stale').length} source file(s).`;
  }
  if (status === 'failed' && failed.some((fact) => fact.sourceBindingStatus === 'failed')) {
    return `Semantic edit replay source binding failed for ${failed.filter((fact) => fact.sourceBindingStatus === 'failed').length} source file(s).`;
  }
  if (status === 'failed' && failed.some((fact) => fact.outputBindingStatus === 'failed')) {
    return `Semantic edit replay output binding failed for ${failed.filter((fact) => fact.outputBindingStatus === 'failed').length} source file(s).`;
  }
  if (status === 'failed') return `Semantic edit replay diagnostics failed for ${failed.length} source file(s).`;
  return facts.length
    ? `Semantic edit artifacts are missing clean replay evidence for ${missing.length} source file(s).`
    : 'No semantic edit artifacts were available for replay-clean proof evidence.';
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
    metadata: compactRecord({
      ...(input.metadata ?? {}),
      proofClaim: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function semanticReplayOutputBinding(file, artifacts, replay) {
  const expectedOutputSourceText = firstString(file.outputSourceText, file.result?.outputSourceText, file.result?.mergedSourceText);
  const expectedOutputHash = firstString(
    file.outputHash,
    file.result?.outputHash,
    typeof expectedOutputSourceText === 'string' ? hashSemanticValue(expectedOutputSourceText) : undefined
  );
  const projectionOutputSourceText = firstString(artifacts?.projection?.sourceText);
  const projectionOutputHash = firstString(
    artifacts?.projection?.outputHash,
    artifacts?.projection?.projectedHash,
    typeof projectionOutputSourceText === 'string' ? hashSemanticValue(projectionOutputSourceText) : undefined
  );
  const replayOutputSourceText = firstString(replay?.outputSourceText);
  const replayOutputHash = firstString(
    replay?.outputHash,
    typeof replayOutputSourceText === 'string' ? hashSemanticValue(replayOutputSourceText) : undefined
  );
  const reasonCodes = [];
  if (typeof expectedOutputSourceText !== 'string' && typeof expectedOutputHash !== 'string') {
    reasonCodes.push('semantic-edit-output-binding-missing');
  }
  if (typeof projectionOutputSourceText !== 'string' && typeof projectionOutputHash !== 'string') {
    reasonCodes.push('semantic-edit-projection-output-binding-missing');
  }
  if (typeof replayOutputSourceText !== 'string' && typeof replayOutputHash !== 'string') {
    reasonCodes.push('semantic-edit-replay-output-binding-missing');
  }
  if (typeof expectedOutputSourceText === 'string' && typeof projectionOutputSourceText === 'string' && expectedOutputSourceText !== projectionOutputSourceText) {
    reasonCodes.push('semantic-edit-projection-output-source-mismatch');
  }
  if (typeof expectedOutputHash === 'string' && typeof projectionOutputHash === 'string' && expectedOutputHash !== projectionOutputHash) {
    reasonCodes.push('semantic-edit-projection-output-hash-mismatch');
  }
  if (typeof expectedOutputSourceText === 'string' && typeof replayOutputSourceText === 'string' && expectedOutputSourceText !== replayOutputSourceText) {
    reasonCodes.push('semantic-edit-replay-output-source-mismatch');
  }
  if (typeof expectedOutputHash === 'string' && typeof replayOutputHash === 'string' && expectedOutputHash !== replayOutputHash) {
    reasonCodes.push('semantic-edit-replay-output-hash-mismatch');
  }
  if (typeof projectionOutputSourceText === 'string' && typeof replayOutputSourceText === 'string' && projectionOutputSourceText !== replayOutputSourceText) {
    reasonCodes.push('semantic-edit-replay-projection-output-source-mismatch');
  }
  if (typeof projectionOutputHash === 'string' && typeof replayOutputHash === 'string' && projectionOutputHash !== replayOutputHash) {
    reasonCodes.push('semantic-edit-replay-projection-output-hash-mismatch');
  }
  const mismatch = reasonCodes.some((code) => code.endsWith('-mismatch'));
  return compactRecord({
    status: mismatch ? 'failed' : reasonCodes.length ? 'missing' : 'bound',
    reasonCodes: uniqueStrings(reasonCodes),
    expectedOutputHash,
    projectionOutputHash,
    replayOutputHash
  });
}

function semanticReplaySourceBinding(file, artifacts, replay) {
  const expectedCurrentSourceText = firstString(
    file.currentSourceText,
    file.headSourceText,
    file.result?.currentSourceText,
    file.result?.headSourceText
  );
  const expectedCurrentHash = firstString(
    file.currentHash,
    file.headHash,
    file.result?.currentHash,
    file.result?.headHash,
    typeof expectedCurrentSourceText === 'string' ? hashSemanticValue(expectedCurrentSourceText) : undefined
  );
  const replayCurrentHash = firstString(
    replay?.currentHash,
    replay?.metadata?.currentHash,
    replay?.metadata?.observedCurrentHash,
    artifacts?.replayCurrentHash
  );
  const replaySourcePath = firstString(replay?.sourcePath, artifacts?.projection?.sourcePath);
  const reasonCodes = [];
  if (typeof file.sourcePath === 'string' && typeof replaySourcePath === 'string' && file.sourcePath !== replaySourcePath) {
    reasonCodes.push('semantic-edit-replay-source-path-mismatch');
  }
  if (typeof expectedCurrentHash === 'string') {
    if (typeof replayCurrentHash !== 'string') reasonCodes.push('semantic-edit-replay-current-source-hash-missing');
    else if (expectedCurrentHash !== replayCurrentHash) reasonCodes.push('semantic-edit-replay-current-source-hash-mismatch');
  }
  const pathMismatch = reasonCodes.includes('semantic-edit-replay-source-path-mismatch');
  const hashMismatch = reasonCodes.includes('semantic-edit-replay-current-source-hash-mismatch');
  const hashMissing = reasonCodes.includes('semantic-edit-replay-current-source-hash-missing');
  return compactRecord({
    status: pathMismatch ? 'failed' : hashMismatch ? 'stale' : hashMissing ? 'missing' : typeof expectedCurrentHash === 'string' ? 'bound' : undefined,
    reasonCodes: uniqueStrings(reasonCodes),
    expectedCurrentHash,
    replayCurrentHash,
    replaySourcePath,
    rerunRouteId: hashMismatch ? 'rerun-semantic-edit-replay-current-head' : undefined
  });
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string');
}

export { semanticEditReplayCleanEvidence };
