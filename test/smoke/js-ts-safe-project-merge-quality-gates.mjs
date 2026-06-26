import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const baseFiles = { 'src/value.ts': 'export const value = 1;\n' };
const workerFiles = { 'src/value.ts': 'export const value = 1;\nexport const workerValue = value + 1;\n' };

const passedQualityGates = safeMergeJsTsProject({
  id: 'js_ts_project_quality_gates_passed',
  language: 'typescript',
  baseFiles,
  workerFiles,
  headFiles: baseFiles,
  lintGates: { id: 'eslint', status: 'passed', command: 'npm run lint' },
  testGates: { id: 'unit', status: 'passed', command: 'npm test', artifactPath: 'reports/unit.json' }
});
assert.equal(passedQualityGates.status, 'merged');
assert.equal(passedQualityGates.outputQualityGate.status, 'passed');
assert.equal(passedQualityGates.summary.outputQualityGates, 2);
assert.equal(passedQualityGates.summary.outputQualityGateConflicts, 0);
assert.equal(passedQualityGates.outputQualityGate.evidence.length, 2);
assert.equal(passedQualityGates.outputQualityGate.evidence.some((record) => record.kind === 'js-ts-project-test-gate' && record.status === 'passed'), true);
assert.equal(Array.isArray(passedQualityGates.evidence), true);
assert.equal(passedQualityGates.evidence.some((record) => record.kind === 'js-ts-project-safe-merge-summary' && record.status === 'passed'), true);
assert.equal(passedQualityGates.confidence.evidenceIds.includes('js_ts_project_quality_gates_passed_project_merge_evidence'), true);
assert.equal(passedQualityGates.confidence.autoApplyCandidate, true);
assert.equal(passedQualityGates.confidence.recommendedAction, 'review');
assert.equal(passedQualityGates.confidence.autoApplyEvidenceComplete, false);
assert.equal(passedQualityGates.confidence.missingSignals.includes('output-diagnostics-gate-not-run'), true);
assert.equal(passedQualityGates.confidence.missingSignals.includes('project-graph-evidence-not-included'), true);
assert.equal(passedQualityGates.confidence.missingSignals.includes('project-graph-delta-evidence-not-included'), true);
assert.equal(passedQualityGates.confidence.nextMissingEvidence.code, 'output-diagnostics-gate-not-run');
assert.equal(passedQualityGates.confidence.nextMissingEvidence.proofLevel, 'diagnostics-clean');
assert.equal(passedQualityGates.confidence.nextMissingEvidence.routeId, 'run-output-diagnostics');
assert.equal(passedQualityGates.confidence.dimensions.quality, 'passed');
assert.equal(passedQualityGates.confidence.dimensions.semanticEquivalence, 'unknown');
assert.equal(passedQualityGates.confidence.missingEvidenceMatrix.byRoute['run-output-diagnostics'], 1);
assert.equal(passedQualityGates.confidence.missingEvidenceMatrix.byLane['project-output'] >= 1, true);
assert.equal(passedQualityGates.confidence.routingCalibration.nextRouteId, 'run-output-diagnostics');
assert.equal(passedQualityGates.confidence.routingCalibration.nextRouteLane, 'project-output');
assert.equal(passedQualityGates.confidence.routingCalibration.routeWorklist.some((route) => route.routeId === 'run-output-diagnostics' && route.routeLane === 'project-output'), true);
assert.equal(passedQualityGates.confidence.routingCalibration.routeWorklistCount, passedQualityGates.confidence.routingCalibration.routeWorklist.length);
assert.equal(passedQualityGates.confidence.routingCalibration.routeWorklist.every((route) => route.semanticEquivalenceClaim !== true), true);
assert.equal(passedQualityGates.confidence.dimensions.routeId, 'run-output-diagnostics');
assert.equal(passedQualityGates.confidence.semanticEquivalenceClaim, false);
assert.equal(passedQualityGates.summary.evidenceRecords, passedQualityGates.evidence.length);
assert.equal(passedQualityGates.summary.missingSignals, passedQualityGates.confidence.missingSignals.length);
assert.equal(passedQualityGates.summary.nextMissingEvidenceCode, 'output-diagnostics-gate-not-run');
assert.equal(passedQualityGates.summary.nextMissingProofLevel, 'diagnostics-clean');
assert.equal(passedQualityGates.summary.nextMissingEvidenceRouteId, 'run-output-diagnostics');
assert.equal(passedQualityGates.summary.confidenceDimensions.diagnostics, 'missing');
assert.equal(JSON.parse(JSON.stringify(passedQualityGates.confidence)).missingEvidenceMatrix.byRoute['run-output-diagnostics'], 1);
assert.equal(passedQualityGates.summary.proofSourceSpanRoundtripStatus, 'passed');
assert.equal(passedQualityGates.summary.proofDiagnosticsStatus, 'skipped');
assert.equal(passedQualityGates.summary.proofDeclarationOutputStatus, 'skipped');
assert.equal(passedQualityGates.summary.proofFocusedTestStatus, 'passed');
assert.equal(passedQualityGates.summary.proofSemanticEquivalenceStatus, 'unknown');
assert.equal(typeof passedQualityGates.summary.confidenceScore, 'number');
assert.equal(passedQualityGates.proofEvidence.kind, 'frontier.lang.jsTsProjectMergeProofEvidence');
assert.equal(passedQualityGates.proofEvidence.status, 'review-evidence-missing');
assert.equal(passedQualityGates.proofEvidence.semanticEquivalenceClaim, false);
assert.equal(passedQualityGates.proofEvidence.summary.proofClaims, 0);
assert.equal(passedQualityGates.proofEvidence.summary.missingLevels.includes('diagnostics-clean'), true);
assert.equal(passedQualityGates.proofEvidence.summary.nextMissingEvidence.code, 'output-diagnostics-gate-not-run');
assert.equal(passedQualityGates.admission.semanticEquivalenceLevel, 'semantic-equivalence-unknown');
assert.equal(passedQualityGates.admission.proofEvidenceStatus, 'review-evidence-missing');
assert.equal(passedQualityGates.summary.semanticEquivalenceLevel, 'semantic-equivalence-unknown');
assert.equal(proofRecord(passedQualityGates, 'source-span-roundtrip').status, 'passed');
assert.equal(proofRecord(passedQualityGates, 'focused-test-passed').status, 'passed');
assert.equal(proofRecord(passedQualityGates, 'semantic-equivalence-unknown').status, 'unknown');
assert.equal(proofRecord(passedQualityGates, 'semantic-equivalence-unknown').proofClaim, false);

const decoratorRouteCalibration = safeMergeJsTsProject({
  id: 'js_ts_project_decorator_route_calibration',
  language: 'typescript',
  baseFiles: { 'src/decorated.ts': '@sealed\nexport class Service {}\n' },
  workerFiles: { 'src/decorated.ts': '@sealed\nexport class Service {}\n' },
  headFiles: { 'src/decorated.ts': '@sealed\nexport class Service {}\n' }
});
assert.equal(decoratorRouteCalibration.proofEvidence.summary.unsupportedSurfaceProofGapRouteIds.includes('prove-decorator-runtime-execution-equivalence'), true);
assert.equal(decoratorRouteCalibration.proofEvidence.summary.unsupportedSurfaceProofGapRouteCounts['prove-decorator-runtime-execution-equivalence'] > 0, true);
assert.equal(decoratorRouteCalibration.confidence.routingCalibration.byRoute['prove-decorator-runtime-execution-equivalence'] > 0, true);
assert.equal(decoratorRouteCalibration.confidence.routingCalibration.nextFocusedProofGapRouteId, 'prove-decorator-runtime-execution-equivalence');
assert.equal(decoratorRouteCalibration.confidence.routingCalibration.nextFocusedProofGapRouteLane, 'decorator-runtime-boundaries');
const decoratorRuntimeRoute = decoratorRouteCalibration.confidence.routingCalibration.routeWorklist.find((route) => route.routeId === 'prove-decorator-runtime-execution-equivalence');
assert.ok(decoratorRuntimeRoute);
assert.equal(decoratorRuntimeRoute.routeLane, 'decorator-runtime-boundaries');
assert.equal(decoratorRuntimeRoute.focusedProofGapCount > 0, true);
assert.equal(decoratorRuntimeRoute.count, decoratorRouteCalibration.confidence.routingCalibration.byRoute['prove-decorator-runtime-execution-equivalence']);
assert.equal(decoratorRouteCalibration.confidence.dimensions.focusedProofGapRoute, 'prove-decorator-runtime-execution-equivalence');

const globalAugmentationRouteCalibration = safeMergeJsTsProject({
  id: 'js_ts_project_global_augmentation_route_calibration',
  language: 'typescript',
  baseFiles: { 'src/window-contract.ts': 'declare global { interface Window { appVersion: string; } }\nexport {};\n' },
  workerFiles: { 'src/window-contract.ts': 'declare global { interface Window { appVersion: string; } }\nexport {};\n' },
  headFiles: { 'src/window-contract.ts': 'declare global { interface Window { appVersion: string; } }\nexport {};\n' }
});
assert.equal(globalAugmentationRouteCalibration.proofEvidence.summary.unsupportedSurfaceProofGapRouteIds.includes('prove-global-augmentation-compatibility'), true);
assert.equal(globalAugmentationRouteCalibration.confidence.routingCalibration.byRoute['prove-global-augmentation-compatibility'] > 0, true);
const globalAugmentationRoute = globalAugmentationRouteCalibration.confidence.routingCalibration.routeWorklist.find((route) => route.routeId === 'prove-global-augmentation-compatibility');
assert.ok(globalAugmentationRoute);
assert.equal(globalAugmentationRoute.routeLane, 'module-runtime-global-augmentation');
assert.equal(globalAugmentationRoute.semanticEquivalenceClaim === true, false);

const cleanProofGates = safeMergeJsTsProject({
  id: 'js_ts_project_proof_evidence_clean_gates',
  language: 'typescript',
  baseFiles,
  workerFiles,
  headFiles: baseFiles,
  requireOutputDiagnostics: true,
  outputDiagnostics: [],
  outputDeclarations: {
    'src/value.d.ts': 'export declare const value: number;\nexport declare const workerValue: number;\n'
  },
  testGates: { id: 'proof-fixture', status: 'passed', command: 'node test/smoke/js-ts-safe-project-merge-quality-gates.mjs' }
});
assert.equal(cleanProofGates.status, 'merged');
assert.equal(proofRecord(cleanProofGates, 'diagnostics-clean').status, 'passed');
assert.equal(proofRecord(cleanProofGates, 'declaration-output-stable').status, 'passed');
assert.equal(cleanProofGates.proofEvidence.records.every((record) => record.semanticEquivalenceClaim === false), true);
assert.equal(cleanProofGates.proofEvidence.summary.missingLevels.includes('diagnostics-clean'), false);
assert.equal(cleanProofGates.proofEvidence.summary.missingLevels.includes('declaration-output-stable'), false);
assert.equal(cleanProofGates.proofEvidence.summary.missingLevels.includes('focused-test-passed'), false);
assert.equal(cleanProofGates.proofEvidence.summary.missingLevels.includes('semantic-equivalence-unknown'), true);
assert.equal(cleanProofGates.summary.proofSourceSpanRoundtripStatus, 'passed');
assert.equal(cleanProofGates.summary.proofDiagnosticsStatus, 'passed');
assert.equal(cleanProofGates.summary.proofDeclarationOutputStatus, 'passed');
assert.equal(cleanProofGates.summary.proofFocusedTestStatus, 'passed');
assert.equal(cleanProofGates.summary.proofSemanticEquivalenceStatus, 'unknown');

const syntaxIdentityProject = safeMergeJsTsProject({
  id: 'js_ts_project_proof_evidence_syntax_identity',
  language: 'typescript',
  baseFiles,
  workerFiles: baseFiles,
  headFiles: baseFiles
});
assert.equal(syntaxIdentityProject.status, 'merged');
assert.equal(proofRecord(syntaxIdentityProject, 'syntax-identity').status, 'passed');
assert.equal(proofRecord(syntaxIdentityProject, 'source-span-roundtrip').status, 'skipped');
assert.equal(syntaxIdentityProject.summary.proofSourceSpanRoundtripStatus, 'skipped');

const failedLintGate = safeMergeJsTsProject({
  id: 'js_ts_project_lint_gate_failed',
  language: 'typescript',
  baseFiles,
  workerFiles,
  headFiles: baseFiles,
  lintGates: { id: 'eslint', status: 'failed', command: 'npm run lint', artifactPath: 'reports/lint.json' }
});
assert.equal(failedLintGate.status, 'blocked');
assert.equal(failedLintGate.outputQualityGate.status, 'blocked');
assert.equal(failedLintGate.outputQualityGate.decision.action, 'block');
assert.equal(failedLintGate.outputQualityGate.decision.nextMissingEvidence.code, 'project-lint-gate-failed');
assert.equal(failedLintGate.outputQualityGate.decision.nextMissingEvidence.routeId, 'rerun-project-quality-gate');
assert.equal(failedLintGate.outputQualityGate.decision.nextMissingEvidence.autoMergeClaim, false);
assert.equal(failedLintGate.outputQualityGate.decision.nextMissingEvidence.semanticEquivalenceClaim, false);
assert.equal(failedLintGate.summary.outputQualityGateConflicts, 1);
assert.equal(failedLintGate.admission.reasonCodes.includes('project-lint-gate-failed'), true);
assert.equal(failedLintGate.conflicts[0].details.artifactPath, 'reports/lint.json');
assert.equal(failedLintGate.conflicts[0].details.nextMissingEvidence.action, 'rerun-gate');
assert.equal(failedLintGate.evidence.some((record) => record.kind === 'js-ts-project-safe-merge-summary' && record.status === 'failed'), true);
assert.equal(failedLintGate.confidence.level, 'blocked');
assert.equal(failedLintGate.confidence.recommendedAction, 'rerun');
assert.equal(failedLintGate.confidence.nextMissingEvidence.code, 'project-lint-gate-failed');
assert.equal(failedLintGate.confidence.nextMissingEvidence.action, 'rerun-gate');
assert.equal(failedLintGate.confidence.nextMissingEvidence.routeId, 'rerun-project-quality-gate');
assert.equal(failedLintGate.confidence.routingCalibration.nextRouteWork.routeId, 'rerun-project-quality-gate');
assert.equal(failedLintGate.confidence.routingCalibration.nextRouteWork.action, 'rerun-gate');
assert.equal(failedLintGate.confidence.routingCalibration.routeWorklist[0].routeId, 'rerun-project-quality-gate');
assert.equal(failedLintGate.summary.nextMissingEvidenceCode, 'project-lint-gate-failed');
assert.equal(failedLintGate.summary.nextMissingEvidenceAction, 'rerun-gate');
assert.equal(failedLintGate.summary.nextMissingEvidenceRouteId, 'rerun-project-quality-gate');
assert.equal(failedLintGate.summary.missingEvidenceMatrix.byAction['rerun-gate'], 1);
assert.equal(failedLintGate.confidence.reviewRequired, true);
assert.equal(failedLintGate.summary.failedEvidenceRecords > 0, true);

const failedTestGate = safeMergeJsTsProject({
  id: 'js_ts_project_test_gate_failed',
  language: 'typescript',
  baseFiles,
  workerFiles,
  headFiles: baseFiles,
  testGates: { id: 'unit', status: 'failed', reasonCode: 'project-unit-test-gate-failed' }
});
assert.equal(failedTestGate.status, 'blocked');
assert.equal(failedTestGate.admission.reasonCodes.includes('project-unit-test-gate-failed'), true);
assert.equal(proofRecord(failedTestGate, 'focused-test-passed').status, 'failed');
assert.equal(failedTestGate.confidence.recommendedAction, 'rerun');
assert.equal(failedTestGate.confidence.nextMissingEvidence.code, 'project-unit-test-gate-failed');

function proofRecord(result, level) {
  const record = result.proofEvidence.records.find((entry) => entry.level === level);
  assert.ok(record, `missing proof evidence level ${level}`);
  return record;
}
