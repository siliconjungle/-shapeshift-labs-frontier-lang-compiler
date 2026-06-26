import { compactRecord } from './js-ts-safe-merge-context.js';

const passStatuses = new Set(['passed', 'pass', 'ok', 'clean', 'accepted-clean', 'success']);
const qualityGateRerunRoute = Object.freeze({
  id: 'rerun-project-quality-gate',
  lane: 'quality-gates',
  next: 'rerun-failing-quality-gate'
});

function createJsTsProjectMergeQualityGate(input = {}, id = 'js_ts_project_safe_merge') {
  const gates = [
    ...normalizeGates(input.qualityGates),
    ...normalizeGates(input.lintGates, 'lint'),
    ...normalizeGates(input.formatGates, 'format'),
    ...normalizeGates(input.testGates, 'test'),
    ...normalizeGates(input.buildGates, 'build')
  ];
  if (!gates.length) return undefined;
  const conflicts = gates.filter((gate) => !passStatuses.has(gate.status)).map(gateConflict);
  const status = conflicts.length ? 'blocked' : 'passed';
  return {
    kind: 'frontier.lang.jsTsProjectMergeQualityGate',
    version: 1,
    id: `${id}_quality_gate`,
    status,
    gates,
    conflicts,
    evidence: qualityGateEvidence(id, gates),
    decision: qualityGateDecision(status, conflicts),
    summary: {
      gates: gates.length,
      passed: gates.filter((gate) => passStatuses.has(gate.status)).length,
      failed: conflicts.length,
      lint: countCategory(gates, 'lint'),
      format: countCategory(gates, 'format'),
      test: countCategory(gates, 'test'),
      build: countCategory(gates, 'build')
    }
  };
}

function qualityGateEvidence(id, gates) {
  return gates.map((gate) => ({
    id: gate.evidenceId ?? `${id}_${gate.category}_${gate.id}_evidence`,
    kind: `js-ts-project-${gate.category}-gate`,
    status: passStatuses.has(gate.status) ? 'passed' : 'failed',
    summary: passStatuses.has(gate.status)
      ? `Project ${gate.category} gate ${JSON.stringify(gate.id)} passed.`
      : `Project ${gate.category} gate ${JSON.stringify(gate.id)} did not pass.`,
    metadata: compactRecord({
      gateId: gate.id,
      category: gate.category,
      command: gate.command,
      artifactPath: gate.artifactPath,
      admissionAction: passStatuses.has(gate.status) ? 'apply' : 'block',
      nextMissingEvidence: passStatuses.has(gate.status) ? undefined : gateMissingEvidence(gate),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  }));
}

function normalizeGates(value, category) {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries.filter((entry) => entry && typeof entry === 'object').map((entry, index) => compactRecord({
    id: String(entry.id ?? entry.gateId ?? `${category ?? entry.category ?? 'quality'}_${index + 1}`),
    category: String(entry.category ?? category ?? 'quality'),
    status: String(entry.status ?? entry.result ?? 'failed').toLowerCase(),
    command: entry.command,
    artifactPath: entry.artifactPath ?? entry.path,
    evidenceId: entry.evidenceId,
    summary: entry.summary,
    reasonCode: entry.reasonCode
  }));
}

function gateConflict(gate) {
  const code = gate.reasonCode ?? `project-${gate.category}-gate-failed`;
  const nextMissingEvidence = gateMissingEvidence(gate, code);
  return {
    code,
    gateId: 'project-quality-gate',
    message: `Project ${gate.category} gate ${JSON.stringify(gate.id)} did not pass.`,
    sourcePath: gate.artifactPath,
    details: compactRecord({
      reasonCode: code,
      conflictKey: `project-quality-gate#${gate.category}#${gate.id}`,
      gateId: gate.id,
      category: gate.category,
      status: gate.status,
      command: gate.command,
      artifactPath: gate.artifactPath,
      evidenceId: gate.evidenceId,
      admissionAction: 'block',
      requiredEvidence: `${gate.category} gate ${JSON.stringify(gate.id)} passed`,
      nextMissingEvidence
    })
  };
}

function qualityGateDecision(status, conflicts) {
  const reasonCodes = conflicts.map((conflict) => conflict.code).filter(Boolean);
  return compactRecord({
    status,
    action: status === 'passed' ? 'apply' : 'block',
    reviewRequired: status !== 'passed',
    autoApplyCandidate: status === 'passed',
    reasonCodes,
    nextMissingEvidence: conflicts[0]?.details?.nextMissingEvidence,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function gateMissingEvidence(gate, reasonCode = gate.reasonCode ?? `project-${gate.category}-gate-failed`) {
  return compactRecord({
    code: reasonCode,
    kind: 'quality-gate',
    scope: 'quality-gates',
    status: 'missing-or-failed',
    action: 'rerun-gate',
    route: qualityGateRerunRoute,
    routeId: qualityGateRerunRoute.id,
    routeLane: qualityGateRerunRoute.lane,
    routeNext: qualityGateRerunRoute.next,
    gateId: gate.id,
    category: gate.category,
    command: gate.command,
    artifactPath: gate.artifactPath,
    summary: `Provide a passing ${gate.category} gate for ${JSON.stringify(gate.id)} before applying the project merge.`,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function countCategory(gates, category) {
  return gates.filter((gate) => gate.category === category).length;
}

export { createJsTsProjectMergeQualityGate };
