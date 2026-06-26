import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { missingEvidenceRouteForSignal } from './js-ts-safe-project-merge-missing-evidence.js';
import { semanticEditReplayCleanEvidence } from './js-ts-safe-project-merge-semantic-replay-proof.js';
import { ExternalSemanticEquivalenceLevel, semanticEquivalenceExternalEvidence } from './js-ts-safe-project-merge-semantic-equivalence-proof.js';
import { sourceSpanRoundtripEvidence } from './js-ts-safe-project-merge-source-span-roundtrip-proof.js';
import { unsupportedJsTsSurfaceEvidence } from './js-ts-safe-project-merge-unsupported-surfaces.js';

const JsTsProjectMergeProofLevels = Object.freeze({
  syntaxIdentity: 'syntax-identity',
  sourceSpanRoundtrip: 'source-span-roundtrip',
  semanticEditReplayClean: 'semantic-edit-replay-clean',
  parserRoundtrip: 'parser-roundtrip',
  diagnosticsClean: 'diagnostics-clean',
  declarationOutputStable: 'declaration-output-stable',
  focusedTestPassed: 'focused-test-passed',
  unsupportedJsTsSurfaceReview: 'unsupported-js-ts-surface-review',
  semanticEquivalenceExternal: ExternalSemanticEquivalenceLevel,
  semanticEquivalenceUnknown: 'semantic-equivalence-unknown'
});

function createJsTsProjectMergeProofEvidence(input = {}) {
  const id = String(input.id ?? 'js_ts_project_safe_merge');
  const records = [
    syntaxIdentityEvidence(id, input.fileResults ?? []),
    sourceSpanRoundtripEvidence(id, input.fileResults ?? [], JsTsProjectMergeProofLevels.sourceSpanRoundtrip, JsTsProjectMergeProofLevels.parserRoundtrip),
    semanticEditReplayCleanEvidence(id, input.fileResults ?? [], JsTsProjectMergeProofLevels.semanticEditReplayClean),
    diagnosticsCleanEvidence(id, input.outputDiagnosticsGate),
    declarationOutputStableEvidence(id, input.outputDeclarationGate),
    focusedTestPassedEvidence(id, input.outputQualityGate),
    unsupportedJsTsSurfaceEvidence(id, input.files ?? [], input.fileResults ?? []),
    semanticEquivalenceExternalEvidence(id, input),
    semanticEquivalenceExternalEvidence(id, input)?.status === 'passed' ? undefined : semanticEquivalenceUnknownEvidence(id)
  ].filter(Boolean);
  const summary = proofEvidenceSummary(records);
  const core = {
    kind: 'frontier.lang.jsTsProjectMergeProofEvidence',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeProofEvidence.v1',
    id: `${id}_proof_evidence`,
    status: summary.failed ? 'failed-evidence' : summary.missingLevels.length ? 'review-evidence-missing' : 'evidence-only',
    semanticEquivalenceLevel: summary.semanticEquivalenceLevel,
    autoMergeClaim: false,
    semanticEquivalenceClaim: summary.semanticEquivalenceClaim,
    records,
    summary,
    metadata: {
      evidenceOnly: true,
      proofClaims: summary.proofClaims,
      note: summary.semanticEquivalenceClaim ? 'External semantic equivalence proof is source/output/gate-bound; autoMergeClaim remains false.' : 'JS/TS project merge proof levels record bounded admission evidence only; executable semantic equivalence remains unknown.',
      missingLevels: summary.missingLevels,
      missingSignals: summary.missingSignals,
      nextMissingEvidence: summary.nextMissingEvidence,
      nextMissingSignal: summary.nextMissingSignal,
      autoMergeClaim: false,
      semanticEquivalenceClaim: summary.semanticEquivalenceClaim
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function syntaxIdentityEvidence(id, fileResults) {
  const outputFiles = fileResults.filter((file) => typeof file.outputSourceText === 'string');
  const changedFiles = outputFiles.filter((file) => !hashMatchesAnyInput(file));
  const allInputHashes = outputFiles.filter((file) => hashMatchesAnyInput(file)).length;
  const status = outputFiles.length && allInputHashes === outputFiles.length ? 'passed' : 'skipped';
  return evidenceRecord({
    id,
    suffix: 'syntax_identity',
    level: JsTsProjectMergeProofLevels.syntaxIdentity,
    status,
    scope: 'project-source',
    summary: status === 'passed'
      ? `All ${outputFiles.length} output file(s) are byte-identical to an input side.`
      : 'Project output changed source text, so syntax identity evidence is not asserted.',
    metadata: {
      outputFiles: outputFiles.length,
      syntaxIdentityFiles: allInputHashes,
      changedOutputFiles: changedFiles.length
    }
  });
}

function diagnosticsCleanEvidence(id, gate) {
  if (!gate) {
    return evidenceRecord({
      id,
      suffix: 'diagnostics_clean',
      level: JsTsProjectMergeProofLevels.diagnosticsClean,
      status: 'skipped',
      scope: 'project-output',
      summary: 'No output diagnostics gate was provided.',
      metadata: {
        diagnosticsGate: 'absent',
        missingSignal: 'output-diagnostics-gate-not-run',
        nextAction: 'Run or supply output diagnostics before treating project output as evidence-complete.'
      }
    });
  }
  const status = gate.status === 'passed' ? 'passed' : 'failed';
  return evidenceRecord({
    id,
    suffix: 'diagnostics_clean',
    level: JsTsProjectMergeProofLevels.diagnosticsClean,
    status,
    scope: 'project-output',
    summary: status === 'passed'
      ? `Output diagnostics gate passed with ${gate.summary?.diagnostics ?? gate.diagnostics?.length ?? 0} diagnostic record(s).`
      : `Output diagnostics gate did not pass: ${gate.conflicts?.length ?? 0} conflict(s).`,
    metadata: {
      gateId: gate.id,
      diagnostics: gate.summary?.diagnostics ?? gate.diagnostics?.length,
      conflicts: gate.summary?.conflicts ?? gate.conflicts?.length,
      diagnosticSource: gate.metadata?.diagnosticSource
    }
  });
}

function declarationOutputStableEvidence(id, gate) {
  if (!gate) {
    return evidenceRecord({
      id,
      suffix: 'declaration_output_stable',
      level: JsTsProjectMergeProofLevels.declarationOutputStable,
      status: 'skipped',
      scope: 'project-output',
      summary: 'No declaration output gate was provided.',
      metadata: {
        declarationGate: 'absent',
        missingSignal: 'declaration-gate-not-run',
        nextAction: 'Run or supply declaration output evidence before applying public API-sensitive project output.'
      }
    });
  }
  const status = gate.status === 'passed' ? 'passed' : gate.status === 'skipped' ? 'skipped' : 'failed';
  return evidenceRecord({
    id,
    suffix: 'declaration_output_stable',
    level: JsTsProjectMergeProofLevels.declarationOutputStable,
    status,
    scope: 'project-output',
    summary: status === 'passed'
      ? `Declaration output gate passed with ${gate.summary?.declarationFiles ?? gate.declarationFiles?.length ?? 0} declaration file(s).`
      : status === 'failed'
        ? `Declaration output gate did not pass: ${gate.conflicts?.length ?? 0} conflict(s).`
        : 'Declaration output gate was skipped.',
    metadata: {
      gateId: gate.id,
      declarationFiles: gate.summary?.declarationFiles ?? gate.declarationFiles?.length,
      declarationBytes: gate.summary?.declarationBytes,
      conflicts: gate.summary?.conflicts ?? gate.conflicts?.length
    }
  });
}

function focusedTestPassedEvidence(id, gate) {
  const testGates = (gate?.gates ?? []).filter((entry) => entry.category === 'test');
  if (!testGates.length) {
    return evidenceRecord({
      id,
      suffix: 'focused_test_passed',
      level: JsTsProjectMergeProofLevels.focusedTestPassed,
      status: 'skipped',
      scope: 'quality-gates',
      summary: 'No focused test quality gate was supplied.',
      metadata: {
        testGates: 0,
        missingSignal: 'focused-test-gate-not-run',
        nextAction: 'Attach at least one passing focused test gate for the changed project behavior.'
      }
    });
  }
  const failed = testGates.filter((entry) => !isPassStatus(entry.status));
  const status = failed.length ? 'failed' : 'passed';
  return evidenceRecord({
    id,
    suffix: 'focused_test_passed',
    level: JsTsProjectMergeProofLevels.focusedTestPassed,
    status,
    scope: 'quality-gates',
    summary: status === 'passed'
      ? `Focused test evidence passed for ${testGates.length} gate(s).`
      : `Focused test evidence failed for ${failed.length} gate(s).`,
    metadata: {
      testGates: testGates.length,
      failedTestGates: failed.length,
      evidenceIds: testGates.map((entry) => entry.evidenceId).filter(Boolean),
      commands: testGates.map((entry) => entry.command).filter(Boolean)
    }
  });
}
function semanticEquivalenceUnknownEvidence(id) {
  return evidenceRecord({
    id,
    suffix: 'semantic_equivalence_unknown',
    level: JsTsProjectMergeProofLevels.semanticEquivalenceUnknown,
    status: 'unknown',
    scope: 'project',
    claimKind: 'semantic-equivalence-upper-bound',
    summary: 'No universal semantic equivalence proof is claimed for JS/TS project merge admission.',
    metadata: {
      executableSemanticEquivalence: 'unknown',
      requiresHumanOrExternalProof: true,
      missingSignal: 'semantic-equivalence-proof-not-available',
      nextAction: 'Keep semanticEquivalenceClaim false unless a human or external verifier supplies an executable equivalence proof.'
    }
  });
}

function evidenceRecord(input) {
  return {
    id: `${input.id}_proof_${input.suffix}`,
    kind: 'js-ts-project-merge-proof-evidence',
    level: input.level,
    status: input.status,
    scope: input.scope,
    claimKind: input.claimKind ?? 'evidence',
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

function proofEvidenceSummary(records) {
  const counts = countBy(records, (record) => record.status);
  const missingRecords = records.filter(isMissingProofRecord);
  const missingEvidence = missingRecords.map(proofMissingEvidence);
  const levelStatuses = Object.fromEntries(records.map((record) => [record.level, record.status]));
  const recordIdsByLevel = Object.fromEntries(records.map((record) => [record.level, record.id]));
  const missingSignals = uniqueStrings(missingEvidence.map((item) => item.code));
  const unsupportedSurfaces = records.flatMap((record) => record.metadata?.surfaceEvidence ?? []);
  const unsupportedSurfaceProofGaps = unsupportedSurfaces.map((surface) => surface.remainingProofGap).filter((gap) => gap?.routeId);
  return {
    records: records.length,
    passed: counts.passed ?? 0,
    failed: counts.failed ?? 0,
    skipped: counts.skipped ?? 0,
    unknown: counts.unknown ?? 0,
    evidenceLevels: records.map((record) => record.level),
    passedLevels: records.filter((record) => record.status === 'passed').map((record) => record.level),
    failedLevels: records.filter((record) => record.status === 'failed').map((record) => record.level),
    skippedLevels: records.filter((record) => record.status === 'skipped').map((record) => record.level),
    unknownLevels: records.filter((record) => record.status === 'unknown').map((record) => record.level),
    levelStatuses,
    recordIdsByLevel,
    missingLevels: uniqueStrings(missingRecords.map((record) => record.level)),
    missingSignals,
    unsupportedSurfaceEvidenceCount: unsupportedSurfaces.length,
    unsupportedSurfaceKinds: uniqueStrings(unsupportedSurfaces.map((surface) => surface.kind)),
    unsupportedSurfaceReasonCodes: uniqueStrings(unsupportedSurfaces.map((surface) => surface.reasonCode)),
    unsupportedSurfaceProofGapRouteIds: uniqueStrings(unsupportedSurfaceProofGaps.map((gap) => gap.routeId)),
    unsupportedSurfaceProofGapRouteLanes: uniqueStrings(unsupportedSurfaceProofGaps.map((gap) => gap.routeLane)),
    unsupportedSurfaceProofGapRouteCounts: countPresent(unsupportedSurfaceProofGaps, (gap) => gap.routeId), unsupportedSurfaceProofGapRouteLaneCounts: countPresent(unsupportedSurfaceProofGaps, (gap) => gap.routeLane),
    nextUnsupportedSurfaceProofGapRouteId: unsupportedSurfaceProofGaps[0]?.routeId, nextUnsupportedSurfaceProofGapRouteLane: unsupportedSurfaceProofGaps[0]?.routeLane, nextUnsupportedSurfaceProofGapCode: unsupportedSurfaceProofGaps[0]?.code,
    missingEvidence,
    nextMissingEvidence: missingEvidence[0],
    nextMissingSignal: missingEvidence[0]?.code,
    semanticEquivalenceLevel: levelStatuses[ExternalSemanticEquivalenceLevel] === 'passed' ? ExternalSemanticEquivalenceLevel : JsTsProjectMergeProofLevels.semanticEquivalenceUnknown,
    semanticEquivalenceClaim: levelStatuses[ExternalSemanticEquivalenceLevel] === 'passed',
    semanticEquivalenceUnknown: levelStatuses[ExternalSemanticEquivalenceLevel] !== 'passed',
    evidenceOnly: true,
    proofClaims: records.filter((record) => record.proofClaim === true || record.semanticEquivalenceClaim === true).length
  };
}

function isMissingProofRecord(record) {
  return Boolean(record?.metadata?.missingSignal);
}

function proofMissingEvidence(record) {
  const route = missingEvidenceRouteForSignal(record.metadata?.missingSignal);
  return compactRecord({
    code: record.metadata?.missingSignal,
    kind: 'proof-level',
    scope: record.scope,
    status: record.status === 'unknown' ? 'unknown' : 'missing',
    proofLevel: record.level,
    action: 'review',
    route,
    routeId: route?.id,
    routeLane: route?.lane,
    routeNext: route?.next,
    evidenceId: record.id,
    summary: record.summary,
    nextAction: record.metadata?.nextAction,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function hashMatchesAnyInput(file) {
  return [file.baseHash, file.workerHash, file.headHash].filter(Boolean).includes(file.outputHash);
}

function isPassStatus(value) {
  return ['passed', 'pass', 'ok', 'clean', 'accepted-clean', 'success'].includes(String(value ?? '').toLowerCase());
}

function countBy(values, keyFor) {
  const result = {};
  for (const value of values) {
    const key = keyFor(value);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function countPresent(values, keyFor) { const result = {}; for (const value of values) { const key = keyFor(value); if (typeof key === 'string' && key.length) result[key] = (result[key] ?? 0) + 1; } return result; }

function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { JsTsProjectMergeProofLevels, createJsTsProjectMergeProofEvidence };
