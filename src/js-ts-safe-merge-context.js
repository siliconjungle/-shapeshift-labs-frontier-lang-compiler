import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds, JsTsSafeMergeStatuses, jsTsSafeMergeGateOrder } from './js-ts-safe-merge-constants.js';

export function createMergeContext(input) {
  return {
    id: String(input.id ?? 'js_ts_safe_merge'),
    sourcePath: input.sourcePath,
    language: input.language ?? 'typescript',
    deferReExportIdentityConflictsToProjectGraph: input.deferReExportIdentityConflictsToProjectGraph === true,
    deferTopLevelRenamePublicExportContractToProjectGraph: input.deferTopLevelRenamePublicExportContractToProjectGraph === true,
    conflicts: [],
    blockedGateIds: new Set(),
    gateReasonCodes: new Map()
  };
}

export function blockedResult(context, ledgers = {}) {
  const reasonCodes = uniqueStrings(context.conflicts.map((conflict) => conflict.code));
  return {
    kind: 'frontier.lang.jsTsSafeMerge',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMerge.v1',
    id: context.id,
    status: JsTsSafeMergeStatuses.blocked,
    sourcePath: context.sourcePath,
    language: context.language,
    conflicts: context.conflicts,
    gates: gatesFor(context),
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: {
      importSpecifierAdditions: 0,
      importDeclarationAdditions: 0,
      topLevelDeclarationAdditions: 0,
      changedExistingDeclarations: context.conflicts.filter((conflict) => conflict.code === JsTsSafeMergeConflictCodes.changedExistingDeclaration).length,
      conflicts: context.conflicts.length,
      gatesPassed: gatesFor(context).filter((gate) => gate.status === 'passed').length
    },
    metadata: {
      ledgers: compactRecord({
        base: ledgerSummary(ledgers.base),
        worker: ledgerSummary(ledgers.worker),
        head: ledgerSummary(ledgers.head),
        merged: ledgerSummary(ledgers.merged)
      })
    }
  };
}

export function addConflict(context, conflict) {
  const gateId = conflict.gateId ?? JsTsSafeMergeGateIds.parseLedger;
  const record = {
    code: conflict.code,
    gateId,
    message: conflict.message,
    side: conflict.side,
    sourcePath: context.sourcePath,
    details: compactRecord(conflict.details)
  };
  context.conflicts.push(record);
  context.blockedGateIds.add(gateId);
  const gateReasonCodes = context.gateReasonCodes.get(gateId) ?? [];
  gateReasonCodes.push(conflict.code);
  context.gateReasonCodes.set(gateId, uniqueStrings(gateReasonCodes));
}

export function gatesFor(context) {
  let blockedSeen = false;
  return jsTsSafeMergeGateOrder.map((id) => {
    const blocked = context.blockedGateIds.has(id);
    const status = blocked ? 'blocked' : blockedSeen ? 'skipped' : 'passed';
    if (blocked) blockedSeen = true;
    return {
      id,
      status,
      reasonCodes: context.gateReasonCodes.get(id) ?? []
    };
  });
}

export function sameStatementText(left, right) {
  return normalizeLineEndings(String(left ?? '').trim(), '\n') === normalizeLineEndings(String(right ?? '').trim(), '\n');
}

export function normalizeLineEndings(text, lineEnding) {
  return String(text ?? '').replace(/\r\n?/g, '\n').replace(/\n/g, lineEnding);
}

export function detectLineEnding(text) {
  return String(text ?? '').includes('\r\n') ? '\r\n' : '\n';
}

export function arraysEqual(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}

export function compactRecord(record) {
  return Object.fromEntries(Object.entries(record ?? {}).filter(([, value]) => value !== undefined));
}

export function ledgerSummary(ledger) {
  if (!ledger) return undefined;
  return {
    label: ledger.label,
    entries: ledger.entries.length,
    imports: ledger.entries.filter((entry) => entry.kind === 'import').length,
    declarations: ledger.entries.filter((entry) => entry.kind === 'declaration').length,
    exports: ledger.entries.filter((entry) => entry.kind === 'export').length
  };
}
