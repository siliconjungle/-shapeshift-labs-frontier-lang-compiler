import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

function syntheticFile(file, context, sourceText, operation) {
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'merged',
    operation,
    outputSourceText: sourceText,
    outputHash: hashText(sourceText),
    baseHash: hashText(file.baseSourceText),
    workerHash: hashText(file.workerSourceText),
    headHash: hashText(file.headSourceText),
    conflicts: [],
    admission: admittedSyntheticAdmission(operation),
    summary: { conflicts: 0, synthetic: true },
    conflictKeys: [`source#${file.sourcePath}`]
  });
}

function blockedFile(file, context, reasonCode) {
  const conflict = {
    code: reasonCode,
    gateId: 'project-file-presence',
    message: `Project file cannot be safely merged: ${reasonCode}.`,
    sourcePath: file.sourcePath,
    details: { sourcePath: file.sourcePath }
  };
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: 'blocked-file-presence',
    conflicts: [conflict],
    admission: blockedAdmission(reasonCode),
    summary: { conflicts: 1, synthetic: true },
    conflictKeys: [`source#${file.sourcePath ?? 'unknown'}`]
  });
}

function policyForFile(input, sourcePath) {
  if (input.policyByPath?.[sourcePath]) return input.policyByPath[sourcePath];
  if (input.mergePolicyByPath?.[sourcePath]) return input.mergePolicyByPath[sourcePath];
  return input.policy ?? input.mergePolicy;
}

function sourceLedgersForFile(input, sourcePath) {
  const byPath = input.sourceLedgersByPath?.[sourcePath] ?? input.sourceLedgers?.[sourcePath];
  return byPath ?? (input.sourceLedgers?.base || input.sourceLedgers?.worker || input.sourceLedgers?.head ? input.sourceLedgers : undefined);
}

function admittedSyntheticAdmission(operation) {
  return {
    status: 'auto-merge-candidate',
    action: operation === 'head-only' ? 'preserve-head' : 'apply',
    reviewRequired: false,
    autoApplyCandidate: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: []
  };
}

function blockedAdmission(reasonCode) {
  return {
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: [reasonCode]
  };
}

function hashText(text) { return typeof text === 'string' ? hashSemanticValue(text) : undefined; }
function safeId(value) { return String(value ?? 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'file'; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { blockedFile, hashText, policyForFile, safeId, sourceLedgersForFile, syntheticFile, uniqueStrings };
