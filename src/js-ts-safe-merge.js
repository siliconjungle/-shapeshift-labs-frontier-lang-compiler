import { analyzeVariantLedger, validateIndependentAdditions } from './js-ts-safe-merge-analyze.js';
import { addConflict, blockedResult, compactRecord, createMergeContext, gatesFor } from './js-ts-safe-merge-context.js';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  JsTsSafeMergeStatuses,
  jsTsSafeMergeGateOrder
} from './js-ts-safe-merge-constants.js';
import { indexBaseLedger, scanJsTsTopLevelLedger, validateLedgerUniqueness } from './js-ts-safe-merge-ledger.js';
import { applySourceMergePlan, createSourceMergePlan } from './js-ts-safe-merge-plan.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';

export { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds, JsTsSafeMergeStatuses };

const mergedOutputSyntaxDiagnosticCode = 'merged-output-syntax-diagnostic';
const mergedOutputSyntaxDiagnosticsUnavailableCode = 'merged-output-syntax-diagnostics-unavailable';

export function safeMergeJsTsImportsAndDeclarations(input = {}) {
  const context = createMergeContext(input);
  const baseSourceText = input.baseSourceText;
  const workerSourceText = input.workerSourceText;
  const headSourceText = input.headSourceText;

  if (typeof baseSourceText !== 'string' || typeof workerSourceText !== 'string' || typeof headSourceText !== 'string') {
    addConflict(context, {
      code: JsTsSafeMergeConflictCodes.invalidInput,
      gateId: JsTsSafeMergeGateIds.parseLedger,
      message: 'baseSourceText, workerSourceText, and headSourceText must be strings.',
      details: {
        baseSourceText: typeof baseSourceText,
        workerSourceText: typeof workerSourceText,
        headSourceText: typeof headSourceText
      }
    });
    return blockedResult(context);
  }

  validateStaleSourceHashes(input, context);
  validateSourceLedgerSpans(input, context);
  if (context.conflicts.length) return blockedResult(context);

  const base = scanJsTsTopLevelLedger(baseSourceText, 'base', context);
  const worker = scanJsTsTopLevelLedger(workerSourceText, 'worker', context);
  const head = scanJsTsTopLevelLedger(headSourceText, 'head', context);
  if (context.conflicts.length) return blockedResult(context, { base, worker, head });

  validateLedgerUniqueness(base, context);
  validateLedgerUniqueness(worker, context);
  validateLedgerUniqueness(head, context);
  if (context.conflicts.length) return blockedResult(context, { base, worker, head });

  const baseIndex = indexBaseLedger(base, context);
  if (context.conflicts.length) return blockedResult(context, { base, worker, head });

  const workerPlan = analyzeVariantLedger(base, worker, baseIndex, 'worker', context);
  const headPlan = analyzeVariantLedger(base, head, baseIndex, 'head', context);
  validateIndependentAdditions(base, workerPlan, headPlan, context);
  if (context.conflicts.length) return blockedResult(context, { base, worker, head });

  const mergePlan = createSourceMergePlan(base, worker, head, workerPlan, headPlan, context);
  if (context.conflicts.length) return blockedResult(context, { base, worker, head });

  const mergedSourceText = applySourceMergePlan(headSourceText, mergePlan);
  const merged = scanJsTsTopLevelLedger(mergedSourceText, 'merged', context);
  if (!context.conflicts.length) validateLedgerUniqueness(merged, context);
  if (!context.conflicts.length) validateMergedOutputSyntaxGate(input, context);
  if (context.conflicts.length) return blockedResult(context, { base, worker, head, merged });

  const result = {
    kind: 'frontier.lang.jsTsSafeMerge',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMerge.v1',
    id: context.id,
    status: JsTsSafeMergeStatuses.merged,
    sourcePath: context.sourcePath,
    language: context.language,
    mergedSourceText,
    outputSourceText: mergedSourceText,
    conflicts: [],
    gates: gatesFor(context),
    admission: {
      status: 'auto-merge-candidate',
      action: 'apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    summary: {
      importSpecifierAdditions: mergePlan.importSpecifierAdditions,
      importDeclarationAdditions: mergePlan.importDeclarationAdditions,
      topLevelDeclarationAdditions: mergePlan.topLevelDeclarationAdditions,
      changedExistingDeclarations: 0,
      conflicts: 0,
      gatesPassed: jsTsSafeMergeGateOrder.length
    },
    metadata: compactRecord({
      workerChangeSetId: input.workerChangeSetId,
      headChangeSetId: input.headChangeSetId,
      baseHash: input.baseHash,
      workerHash: input.workerHash,
      headHash: input.headHash,
      expectedSourceHash: input.expectedSourceHash,
      currentSourceHash: input.currentSourceHash
    })
  };
  return {
    ...result,
    semanticArtifacts: createJsTsSafeMergeSemanticArtifacts(input, result)
  };
}

function validateStaleSourceHashes(input, context) {
  for (const pair of [
    ['expectedSourceHash', 'currentSourceHash', 'head'],
    ['expectedHeadHash', 'headHash', 'head'],
    ['expectedBaseHash', 'baseHash', 'base'],
    ['expectedWorkerHash', 'workerHash', 'worker']
  ]) {
    const [expectedField, currentField, side] = pair;
    const expected = input[expectedField];
    const current = input[currentField];
    if (typeof expected !== 'string' || typeof current !== 'string' || expected === current) continue;
    addConflict(context, {
      code: JsTsSafeMergeConflictCodes.staleSourceHash,
      gateId: JsTsSafeMergeGateIds.parseLedger,
      side,
      message: `${side} source hash is stale for safe merge anchors.`,
      details: { expectedField, currentField, expected, current }
    });
  }
}

function validateSourceLedgerSpans(input, context) {
  if (!input.requireSourceLedgerSpans && !input.sourceLedgers && !input.sourceLedger) return;
  for (const side of ['base', 'worker', 'head']) {
    const ledger = sourceLedgerForSide(input, side);
    if (!ledger) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.missingSourceLedgerSpan,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side,
        message: `${side} source is missing source ledger span evidence.`,
        details: { side, missing: 'source-ledger' }
      });
      continue;
    }
    const spans = Array.isArray(ledger.spans) ? ledger.spans : Array.isArray(ledger.entries) ? ledger.entries : [];
    if (!spans.length) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.missingSourceLedgerSpan,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side,
        message: `${side} source ledger does not include span entries.`,
        details: { side, missing: 'spans' }
      });
      continue;
    }
    const missingIndex = spans.findIndex((entry) => !hasLedgerSpan(entry));
    if (missingIndex >= 0) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.missingSourceLedgerSpan,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side,
        message: `${side} source ledger contains an entry without a source span.`,
        details: { side, index: missingIndex, id: spans[missingIndex]?.id, kind: spans[missingIndex]?.kind }
      });
    }
  }
}

function sourceLedgerForSide(input, side) {
  return input.sourceLedgers?.[side]
    ?? input[`${side}SourceLedger`]
    ?? (input.sourceLedgerSide === side ? input.sourceLedger : undefined);
}

function hasLedgerSpan(entry) {
  const span = entry?.span ?? entry?.sourceSpan;
  if (!span) return false;
  const hasOffsets = Number.isFinite(span.start) && Number.isFinite(span.end);
  const hasLines = Number.isFinite(span.startLine) && Number.isFinite(span.endLine);
  return hasOffsets || hasLines;
}

function validateMergedOutputSyntaxGate(input, context) {
  const diagnostics = normalizeMergedOutputSyntaxDiagnostics(input, context.sourcePath);
  if (!diagnostics) {
    if (requiresMergedOutputSyntaxDiagnostics(input)) {
      addConflict(context, {
        code: mergedOutputSyntaxDiagnosticsUnavailableCode,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side: 'merged',
        message: 'Merged JS/TS output syntax diagnostics are required but were not provided.',
        details: { required: true, diagnosticSource: 'missing' }
      });
    }
    return;
  }
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity !== 'error' || !isSyntaxDiagnostic(diagnostic)) continue;
    addConflict(context, {
      code: mergedOutputSyntaxDiagnosticCode,
      gateId: JsTsSafeMergeGateIds.parseLedger,
      side: 'merged',
      message: `Merged JS/TS output syntax diagnostic ${diagnostic.code}: ${diagnostic.message}`,
      details: { diagnostic }
    });
  }
}

function requiresMergedOutputSyntaxDiagnostics(input) {
  return input.requireMergedOutputSyntaxDiagnostics === true
    || input.requireOutputSyntaxDiagnostics === true
    || input.requireOutputSyntaxGate === true
    || input.requireSyntaxGate === true;
}

function normalizeMergedOutputSyntaxDiagnostics(input, sourcePath) {
  const values = [
    input.mergedOutputSyntaxDiagnostics,
    input.outputSyntaxDiagnostics,
    input.syntaxDiagnostics?.merged,
    input.syntaxDiagnostics?.output,
    input.outputDiagnostics
  ];
  if (!values.some((value) => value !== undefined)) return undefined;
  const expectedPath = normalizeDiagnosticPath(sourcePath);
  const diagnostics = values
    .flatMap((value) => normalizeDiagnosticList(value))
    .filter((diagnostic) => {
      const diagnosticPath = normalizeDiagnosticPath(diagnostic.sourcePath);
      return !expectedPath || !diagnosticPath || expectedPath === diagnosticPath;
    });
  return diagnostics;
}

function normalizeDiagnosticList(value) {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value].filter(Boolean);
  return values.map((diagnostic, index) => compactRecord({
    id: diagnostic.id ?? `diagnostic_${index + 1}`,
    source: diagnostic.source ?? diagnostic.tool ?? diagnostic.name,
    code: String(diagnostic.code ?? diagnostic.diagnosticCode ?? diagnostic.name ?? 'syntax-diagnostic'),
    severity: normalizeDiagnosticSeverity(diagnostic.severity ?? diagnostic.category),
    message: String(diagnostic.message ?? diagnostic.messageText ?? ''),
    sourcePath: normalizeDiagnosticPath(diagnostic.sourcePath ?? diagnostic.fileName ?? diagnostic.file?.fileName),
    start: numberOrUndefined(diagnostic.start),
    end: numberOrUndefined(diagnostic.end),
    line: numberOrUndefined(diagnostic.line),
    column: numberOrUndefined(diagnostic.column),
    phase: normalizeDiagnosticPhase(diagnostic.phase ?? diagnostic.diagnosticPhase ?? diagnostic.kind ?? diagnostic.type),
    syntax: diagnostic.syntax === true ? true : undefined
  }));
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

function normalizeDiagnosticSeverity(value) {
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered.includes('error')) return 'error';
    if (lowered.includes('warn')) return 'warning';
    if (lowered.includes('suggest')) return 'suggestion';
    if (lowered.includes('message')) return 'message';
  }
  if (value === 1) return 'error';
  if (value === 0) return 'warning';
  if (value === 2) return 'suggestion';
  if (value === 3) return 'message';
  return 'error';
}

function normalizeDiagnosticPhase(value) {
  if (typeof value !== 'string') return undefined;
  const lowered = value.toLowerCase();
  if (lowered.includes('syntax') || lowered.includes('syntactic') || lowered.includes('parse')) return 'syntax';
  if (lowered.includes('semantic') || lowered.includes('type')) return 'semantic';
  return value;
}

function normalizeDiagnosticPath(value) {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).replace(/\\/g, '/').replace(/\/+/g, '/');
  const parts = [];
  for (const part of raw.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..' && parts.length) parts.pop();
    else if (part !== '..') parts.push(part);
  }
  return parts.join('/');
}

function numberOrUndefined(value) {
  return Number.isFinite(value) ? value : undefined;
}
