export const JsTsSafeMergeStatuses = Object.freeze({
  merged: 'merged',
  blocked: 'blocked'
});

export const JsTsSafeMergeGateIds = Object.freeze({
  parseLedger: 'parse-ledger',
  preserveBaseOrder: 'preserve-base-order',
  stableExistingDeclarations: 'stable-existing-declarations',
  independentImportSpecifiers: 'independent-import-specifiers',
  independentTopLevelDeclarations: 'independent-top-level-declarations',
  uniqueNames: 'unique-names',
  resolvedInsertionAnchors: 'resolved-insertion-anchors'
});

export const JsTsSafeMergeConflictCodes = Object.freeze({
  invalidInput: 'invalid-input',
  parserLedgerLoss: 'parser-ledger-loss',
  sideEffectImportReorder: 'side-effect-import-reorder',
  topLevelOrderChanged: 'top-level-order-changed',
  changedExistingDeclaration: 'changed-existing-declaration',
  importShapeChanged: 'import-shape-changed',
  importSpecifierRemoved: 'import-specifier-removed',
  importSpecifierReordered: 'import-specifier-reordered',
  importFormattingChanged: 'import-formatting-changed',
  newImportDeclaration: 'new-import-declaration',
  duplicateName: 'duplicate-name',
  ambiguousInsertionPoint: 'ambiguous-insertion-point',
  insertionAnchorMissing: 'insertion-anchor-missing'
});

import { analyzeVariantLedger, validateIndependentAdditions } from './js-ts-safe-merge-analyze.js';
import { addConflict, blockedResult, compactRecord, createMergeContext, gatesFor } from './js-ts-safe-merge-context.js';
import { indexBaseLedger, scanJsTsTopLevelLedger, validateLedgerUniqueness } from './js-ts-safe-merge-ledger.js';
import { applySourceMergePlan, createSourceMergePlan } from './js-ts-safe-merge-plan.js';

const gateOrder = Object.freeze([
  JsTsSafeMergeGateIds.parseLedger,
  JsTsSafeMergeGateIds.preserveBaseOrder,
  JsTsSafeMergeGateIds.stableExistingDeclarations,
  JsTsSafeMergeGateIds.independentImportSpecifiers,
  JsTsSafeMergeGateIds.independentTopLevelDeclarations,
  JsTsSafeMergeGateIds.uniqueNames,
  JsTsSafeMergeGateIds.resolvedInsertionAnchors
]);

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

  return {
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
      topLevelDeclarationAdditions: mergePlan.topLevelDeclarationAdditions,
      changedExistingDeclarations: 0,
      conflicts: 0,
      gatesPassed: gateOrder.length
    },
    metadata: compactRecord({
      workerChangeSetId: input.workerChangeSetId,
      headChangeSetId: input.headChangeSetId,
      baseHash: input.baseHash,
      workerHash: input.workerHash,
      headHash: input.headHash
    })
  };
}
