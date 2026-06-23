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
