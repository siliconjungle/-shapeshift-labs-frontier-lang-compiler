import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, uniqueStrings } from './js-ts-safe-merge-context.js';
import { diagnosticsGateMetadata } from './js-ts-safe-project-merge-diagnostics-metadata.js';
import { collectTypeScriptDiagnostics } from './js-ts-safe-project-merge-diagnostics-ts.js';
import {
  collectJsxComponentPropContractsFromFileResults,
  jsxComponentPropContractConflict,
  jsxComponentPropContractEvidence,
  jsxComponentPropContractSummary,
  matchingJsxComponentPropContracts,
  normalizeJsxComponentPropContracts
} from './js-ts-safe-project-merge-jsx-prop-contracts.js';
import {
  describeJsTsProjectCompilerInputs,
  normalizeSuppliedDiagnostics
} from './js-ts-safe-project-merge-ts-program.js';

const projectOutputDiagnosticCode = 'project-output-diagnostic';
const projectOutputSyntaxDiagnosticCode = 'project-output-syntax-diagnostic';
const projectOutputDiagnosticsUnavailableCode = 'project-output-diagnostics-unavailable';
const projectOutputSyntaxDiagnosticsUnavailableCode = 'project-output-syntax-diagnostics-unavailable';

function createJsTsProjectMergeDiagnosticsGate(input = {}, outputFiles = [], id = 'js_ts_project_safe_merge', context = {}) {
  const jsxComponentPropContracts = normalizeJsxComponentPropContracts(
    input.jsxComponentPropContracts
      ?? input.jsxComponentPropContractCandidates
      ?? context.jsxComponentPropContracts
      ?? collectJsxComponentPropContractsFromFileResults(context.fileResults)
  );
  const suppliedDiagnostics = normalizeSuppliedOutputDiagnostics(input);
  const diagnosticsResult = suppliedDiagnostics !== undefined
    ? suppliedDiagnosticsResult(input, suppliedDiagnostics)
    : collectTypeScriptDiagnostics(input, outputFiles);
  const diagnostics = diagnosticsResult?.diagnostics;
  const metadata = diagnosticsGateMetadata(input, diagnosticsResult);
  const syntaxOnly = requiresOutputSyntaxDiagnostics(input) && input.requireOutputDiagnostics !== true && input.outputDiagnostics === undefined;
  if (!diagnostics && input.requireOutputDiagnostics !== true && !requiresOutputSyntaxDiagnostics(input) && !jsxComponentPropContracts.length) return undefined;
  if (!diagnostics) return unavailableGate(input, id, syntaxOnly, metadata, outputFiles, jsxComponentPropContracts);
  const errorDiagnostics = diagnostics.filter((diagnostic) => (
    diagnostic.severity === 'error' && (!syntaxOnly || isSyntaxDiagnostic(diagnostic))
  ));
  const conflicts = errorDiagnostics.map((diagnostic) => diagnosticConflict(input, diagnostic, jsxComponentPropContracts));
  const status = conflicts.length ? 'blocked' : 'passed';
  const core = {
    kind: 'frontier.lang.jsTsProjectMergeDiagnosticsGate',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeDiagnosticsGate.v1',
    id: `${id}_output_diagnostics`,
    status,
    sourcePaths: outputFiles.map((file) => file.sourcePath).filter(Boolean),
    diagnostics,
    conflicts,
    admission: {
      status: status === 'passed' ? 'auto-merge-candidate' : 'blocked',
      action: status === 'passed' ? 'accept-diagnostics' : 'human-review',
      reviewRequired: status !== 'passed',
      autoApplyCandidate: status === 'passed',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(conflicts.map((conflict) => conflict.code))
    },
    summary: diagnosticsSummary(diagnostics, conflicts, jsxComponentPropContracts),
    metadata,
    evidence: [{
      id: `${id}_output_diagnostics_evidence`,
      kind: 'js-ts-project-output-diagnostics',
      status: status === 'passed' ? 'passed' : 'failed',
      summary: status === 'passed'
        ? `Validated ${outputFiles.length} JS/TS output file(s) with no blocking diagnostics.`
        : `Blocked JS/TS project merge on ${conflicts.length} output diagnostic conflict(s).`,
      metadata: {
        diagnostics: diagnostics.length,
        conflicts: conflicts.length,
        diagnosticSource: metadata.diagnosticSource,
        compilerOptions: metadata.compilerOptions,
        compilerOptionSources: metadata.compilerOptionSources,
        projectReferences: metadata.projectReferences,
        projectReferenceCount: metadata.projectReferenceCount,
        jsxComponentPropContractCandidates: jsxComponentPropContracts.length || undefined,
        syntaxOnly,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      }
    }, ...jsxComponentPropContractEvidence(id, status, diagnostics, conflicts, metadata.diagnosticSource, jsxComponentPropContracts)]
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function suppliedDiagnosticsResult(input, diagnostics) {
  return {
    diagnostics,
    metadata: {
      ...describeJsTsProjectCompilerInputs(input),
      diagnosticSource: diagnosticSource(input),
      hasTypescriptCompilerApi: Boolean(input.typescript ?? input.ts ?? input.typescriptModule)
    }
  };
}

function unavailableGate(input, id, syntaxOnly = false, metadata = {}, outputFiles = [], jsxComponentPropContracts = []) {
  const code = syntaxOnly ? projectOutputSyntaxDiagnosticsUnavailableCode : projectOutputDiagnosticsUnavailableCode;
  const diagnosticConflict = {
    code,
    gateId: 'project-output-diagnostics',
    message: syntaxOnly
      ? 'Project output syntax diagnostics are required but no TypeScript compiler API or supplied syntax diagnostics were provided.'
      : 'Project output diagnostics are required but no TypeScript compiler API or supplied diagnostics were provided.',
    details: { required: input.requireOutputDiagnostics === true, syntaxRequired: requiresOutputSyntaxDiagnostics(input) }
  };
  const conflicts = [
    ...(input.requireOutputDiagnostics === true || requiresOutputSyntaxDiagnostics(input) ? [diagnosticConflict] : []),
    ...(jsxComponentPropContracts.length ? [jsxComponentPropContractConflict(jsxComponentPropContracts)] : [])
  ];
  const gateConflicts = conflicts.length ? conflicts : [diagnosticConflict];
  const core = {
    kind: 'frontier.lang.jsTsProjectMergeDiagnosticsGate',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeDiagnosticsGate.v1',
    id: `${id}_output_diagnostics`,
    status: 'blocked',
    sourcePaths: outputFiles.map((file) => file.sourcePath).filter(Boolean),
    diagnostics: [],
    conflicts: gateConflicts,
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(gateConflicts.map((conflict) => conflict.code))
    },
    summary: diagnosticsSummary([], gateConflicts, jsxComponentPropContracts),
    metadata,
    evidence: [{
      id: `${id}_output_diagnostics_evidence`,
      kind: 'js-ts-project-output-diagnostics',
      status: 'failed',
      summary: gateConflicts.map((conflict) => conflict.message).join(' '),
      metadata: {
        diagnostics: 0,
        conflicts: gateConflicts.length,
        diagnosticSource: 'missing',
        compilerOptions: metadata.compilerOptions,
        compilerOptionSources: metadata.compilerOptionSources,
        projectReferences: metadata.projectReferences,
        projectReferenceCount: metadata.projectReferenceCount,
        jsxComponentPropContractCandidates: jsxComponentPropContracts.length || undefined,
        syntaxOnly
      }
    }, ...jsxComponentPropContractEvidence(id, 'blocked', [], gateConflicts, 'missing', jsxComponentPropContracts)]
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function diagnosticConflict(input, diagnostic, jsxComponentPropContracts = []) {
  const syntax = isSyntaxDiagnostic(diagnostic);
  const matchingContracts = matchingJsxComponentPropContracts(diagnostic, jsxComponentPropContracts);
  return compactRecord({
    code: syntax ? projectOutputSyntaxDiagnosticCode : projectOutputDiagnosticCode,
    gateId: 'project-output-diagnostics',
    message: `${syntax ? 'Project output syntax diagnostic' : 'Project output diagnostic'} ${diagnostic.code}: ${diagnostic.message}`,
    sourcePath: diagnostic.sourcePath,
    details: {
      diagnostic,
      syntax,
      projectRoot: input.projectRoot,
      jsxComponentPropContracts: matchingContracts.length ? matchingContracts : undefined
    }
  });
}

function diagnosticsSummary(diagnostics, conflicts, jsxComponentPropContracts = []) {
  const bySeverity = {};
  const bySource = {};
  const byPhase = {};
  for (const diagnostic of diagnostics) {
    bySeverity[diagnostic.severity] = (bySeverity[diagnostic.severity] ?? 0) + 1;
    bySource[diagnostic.source ?? 'unknown'] = (bySource[diagnostic.source ?? 'unknown'] ?? 0) + 1;
    byPhase[diagnostic.phase ?? 'unknown'] = (byPhase[diagnostic.phase ?? 'unknown'] ?? 0) + 1;
  }
  return {
    diagnostics: diagnostics.length,
    conflicts: conflicts.length,
    errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
    warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length,
    syntaxErrors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error' && isSyntaxDiagnostic(diagnostic)).length,
    bySeverity,
    bySource,
    byPhase,
    ...jsxComponentPropContractSummary(jsxComponentPropContracts)
  };
}

function normalizeSuppliedOutputDiagnostics(input) {
  const hasOutputDiagnostics = Object.hasOwn(input, 'outputDiagnostics');
  const hasOutputSyntaxDiagnostics = Object.hasOwn(input, 'outputSyntaxDiagnostics')
    || Object.hasOwn(input, 'mergedOutputSyntaxDiagnostics')
    || input.syntaxDiagnostics?.output !== undefined
    || input.syntaxDiagnostics?.merged !== undefined;
  if (!hasOutputDiagnostics && !hasOutputSyntaxDiagnostics) return undefined;
  return [
    ...normalizeSuppliedDiagnosticsWithPhase(input.outputDiagnostics, undefined),
    ...normalizeSuppliedDiagnosticsWithPhase(input.outputSyntaxDiagnostics, 'syntax'),
    ...normalizeSuppliedDiagnosticsWithPhase(input.mergedOutputSyntaxDiagnostics, 'syntax'),
    ...normalizeSuppliedDiagnosticsWithPhase(input.syntaxDiagnostics?.output, 'syntax'),
    ...normalizeSuppliedDiagnosticsWithPhase(input.syntaxDiagnostics?.merged, 'syntax')
  ];
}

function normalizeSuppliedDiagnosticsWithPhase(value, fallbackPhase) {
  if (value === undefined) return [];
  const rawDiagnostics = Array.isArray(value) ? value : [value].filter(Boolean);
  const normalized = normalizeSuppliedDiagnostics(value);
  return normalized.map((diagnostic, index) => withDiagnosticPhase(diagnostic, suppliedDiagnosticPhase(rawDiagnostics[index], fallbackPhase)));
}

function withDiagnosticPhase(diagnostic, phase) {
  const normalizedPhase = normalizeDiagnosticPhase(phase);
  const syntax = diagnostic.syntax === true || normalizedPhase === 'syntax' || isSyntaxDiagnostic(diagnostic);
  return compactRecord({
    ...diagnostic,
    phase: normalizedPhase,
    syntax: syntax ? true : undefined
  });
}

function suppliedDiagnosticPhase(diagnostic, fallbackPhase) {
  return diagnostic?.phase
    ?? diagnostic?.diagnosticPhase
    ?? diagnostic?.kind
    ?? diagnostic?.type
    ?? (diagnostic?.syntax === true ? 'syntax' : undefined)
    ?? fallbackPhase;
}

function requiresOutputSyntaxDiagnostics(input) {
  return input.requireOutputSyntaxDiagnostics === true
    || input.requireOutputSyntaxGate === true
    || input.requireMergedOutputSyntaxDiagnostics === true
    || input.requireSyntaxGate === true;
}

function isSyntaxDiagnostic(diagnostic) {
  if (diagnostic.syntax === true) return true;
  const text = [
    diagnostic.phase,
    diagnostic.kind,
    diagnostic.category,
    diagnostic.type,
    diagnostic.source,
    diagnostic.ruleId,
    diagnostic.name,
    diagnostic.code
  ].filter(Boolean).join(' ').toLowerCase();
  return /\bsyntax\b|\bsyntactic\b|\bparse\b|\bparser\b/.test(text) || isTypeScriptSyntaxDiagnosticCode(diagnostic.code);
}

function isTypeScriptSyntaxDiagnosticCode(code) {
  const match = /^TS(\d+)$/.exec(String(code ?? ''));
  if (!match) return false;
  const numeric = Number(match[1]);
  return numeric >= 1000 && numeric < 2000;
}

function normalizeDiagnosticPhase(value) {
  if (typeof value !== 'string') return undefined;
  const lowered = value.toLowerCase();
  if (lowered.includes('syntax') || lowered.includes('syntactic') || lowered.includes('parse')) return 'syntax';
  if (lowered.includes('semantic') || lowered.includes('type')) return 'semantic';
  return value;
}

function diagnosticSource(input) {
  if (input.outputDiagnostics !== undefined && (input.outputSyntaxDiagnostics !== undefined || input.mergedOutputSyntaxDiagnostics !== undefined)) {
    return 'supplied-mixed';
  }
  if (input.outputDiagnostics !== undefined) return 'supplied';
  if (input.outputSyntaxDiagnostics !== undefined || input.mergedOutputSyntaxDiagnostics !== undefined || input.syntaxDiagnostics) return 'supplied-syntax';
  return 'typescript-compiler-api';
}

export { createJsTsProjectMergeDiagnosticsGate };
