import { JsTsSafeMergeConflictCodes } from './js-ts-safe-merge-constants.js';
import { createMergeContext, sameStatementText } from './js-ts-safe-merge-context.js';
import { scanJsTsTopLevelLedger, validateLedgerUniqueness } from './js-ts-safe-merge-ledger.js';
import { uniqueStrings } from './native-import-utils.js';

const supportedRenameDeclarationKinds = new Set(['function', 'class', 'type']);

function analyzeTopLevelRenameAdmission(input, topLevelResult) {
  const originalReasonCodes = topLevelResult?.admission?.reasonCodes ?? [];
  if (!originalReasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged)) return undefined;
  if (typeof input.baseSourceText !== 'string'
    || typeof input.workerSourceText !== 'string'
    || typeof input.headSourceText !== 'string') {
    return undefined;
  }

  const context = createMergeContext(input);
  const base = scanJsTsTopLevelLedger(input.baseSourceText, 'base', context);
  const worker = scanJsTsTopLevelLedger(input.workerSourceText, 'worker', context);
  const head = scanJsTsTopLevelLedger(input.headSourceText, 'head', context);
  if (!context.conflicts.length) {
    validateLedgerUniqueness(base, context);
    validateLedgerUniqueness(worker, context);
    validateLedgerUniqueness(head, context);
  }
  if (context.conflicts.length) return undefined;

  const candidate = topLevelRenameCandidate(base, worker, head);
  if (!candidate) return undefined;

  const publicContractReasonCodes = publicContractRenameReasonCodes(base, worker, head, candidate);
  if (publicContractReasonCodes.length) {
    return {
      status: 'blocked',
      reasonCodes: publicContractReasonCodes,
      summary: candidateSummary(candidate, publicContractReasonCodes),
      ledgers: { base, worker, head }
    };
  }

  return {
    status: 'candidate',
    reasonCodes: ['top-level-rename-source-shape-matches'],
    summary: candidateSummary(candidate, ['top-level-rename-source-shape-matches']),
    ledgers: { base, worker, head }
  };
}

function topLevelRenameCandidate(base, worker, head) {
  const baseByKey = entriesByKey(base.entries);
  const workerByKey = entriesByKey(worker.entries);
  const baseKeys = base.entries.map((entry) => entry.key);
  const missingBaseDeclarations = base.entries
    .filter((entry) => !workerByKey.has(entry.key))
    .filter(isSupportedRenameDeclaration);
  const addedWorkerDeclarations = worker.entries
    .filter((entry) => !baseByKey.has(entry.key))
    .filter(isSupportedRenameDeclaration);

  if (missingBaseDeclarations.length !== 1 || addedWorkerDeclarations.length !== 1) return undefined;
  const fromEntry = missingBaseDeclarations[0];
  const toEntry = addedWorkerDeclarations[0];
  const fromName = fromEntry.names?.[0];
  const toName = toEntry.names?.[0];
  if (!fromName || !toName || fromName === toName) return undefined;
  if (fromEntry.declarationInfo?.declarationKind !== toEntry.declarationInfo?.declarationKind) return undefined;
  if (!sameStatementText(renameDeclarationText(fromEntry.text, fromEntry.declarationInfo.declarationKind, fromName, toName), toEntry.text)) {
    return undefined;
  }

  const workerProjectedBaseKeys = worker.entries.map((entry) => entry.key === toEntry.key ? fromEntry.key : entry.key);
  if (!sameStringList(workerProjectedBaseKeys, baseKeys)) return undefined;
  const headProjectedBaseKeys = head.entries
    .filter((entry) => baseByKey.has(entry.key))
    .map((entry) => entry.key);
  if (!sameStringList(headProjectedBaseKeys, baseKeys)) return undefined;
  if (head.entries.length !== base.entries.length) return undefined;

  return {
    fromEntry,
    toEntry,
    fromName,
    toName,
    declarationKind: fromEntry.declarationInfo.declarationKind
  };
}

function isSupportedRenameDeclaration(entry) {
  return entry?.kind === 'declaration'
    && entry.names?.length === 1
    && supportedRenameDeclarationKinds.has(entry.declarationInfo?.declarationKind)
    && !entry.declarationInfo.defaultExport
    && !/^\s*(?:export\s+)?declare\b/.test(entry.text ?? '');
}

function publicContractRenameReasonCodes(base, worker, head, candidate) {
  const directExport = candidate.fromEntry.declarationInfo?.exported === true
    || candidate.toEntry.declarationInfo?.exported === true;
  const exportListMention = [base, worker, head]
    .some((ledger) => ledger.entries
      .some((entry) => entry.kind === 'export' && mentionsName(entry.text, candidate.fromName, candidate.toName)));
  return directExport || exportListMention
    ? [JsTsSafeMergeConflictCodes.topLevelRenamePublicExportContract]
    : [];
}

function mentionsName(text, ...names) {
  return names.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`).test(text ?? ''));
}

function renameDeclarationText(text, declarationKind, fromName, toName) {
  if (typeof text !== 'string') return undefined;
  const escaped = escapeRegExp(fromName);
  const replacement = `$1${toName}`;
  if (declarationKind === 'function') {
    return text.replace(new RegExp(`^((?:export\\s+)?(?:async\\s+)?function\\*?\\s+)${escaped}\\b`), replacement);
  }
  if (declarationKind === 'class') {
    return text.replace(new RegExp(`^((?:export\\s+)?(?:abstract\\s+)?class\\s+)${escaped}\\b`), replacement);
  }
  if (declarationKind === 'type') {
    return text.replace(new RegExp(`^((?:export\\s+)?type\\s+)${escaped}\\b`), replacement);
  }
  return undefined;
}

function candidateSummary(candidate, reasonCodes) {
  return {
    fromName: candidate.fromName,
    toName: candidate.toName,
    declarationKind: candidate.declarationKind,
    exported: candidate.fromEntry.declarationInfo?.exported === true || candidate.toEntry.declarationInfo?.exported === true,
    reasonCodes: uniqueStrings(reasonCodes)
  };
}

function entriesByKey(entries) {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function sameStringList(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { analyzeTopLevelRenameAdmission };
