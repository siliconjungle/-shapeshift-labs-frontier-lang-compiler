import { idFragment, normalizeSemanticMergeReadiness, uniqueStrings } from './native-import-utils.js';
import { classDefaults, JsTsSemanticConflictSidecarClasses, orderedChangeKinds, parserLedgerLossPattern, unsupportedSyntaxPattern } from './js-ts-semantic-conflict-sidecar-constants.js';
import { affectedFromEntries, normalizeAffected, normalizeChange, normalizeDeclaration, sameChangeRegion } from './js-ts-semantic-conflict-sidecar-normalize.js';
import { array, changePairs, compactRecord, duplicateGroups, firstString, isDeleteChange, isInsertChange, isModifyChange, lossReasonCodes, lossText, normalizeRisk, normalizeSeverity, strings } from './js-ts-semantic-conflict-sidecar-utils.js';

export function explicitSidecars(input, context) {
  return [
    ...array(input.conflicts),
    ...array(input.sidecars),
    ...array(input.conflictSidecars)
  ]
    .filter((record) => JsTsSemanticConflictSidecarClasses.includes(record?.class))
    .map((record) => conflictSidecar(record.class, record, context));
}

export function sameRegionSidecars(changes, context) {
  const records = [];
  for (const [left, right] of changePairs(changes)) {
    if (!sameChangeRegion(left, right)) continue;
    records.push(conflictSidecar('same-region', {
      id: `js_ts_conflict_${idFragment(left.id)}_${idFragment(right.id)}_same_region`,
      affected: affectedFromEntries([left, right], context),
      reasonCodes: ['same-region-concurrent-edit', ...left.reasonCodes, ...right.reasonCodes],
      metadata: { leftChangeId: left.id, rightChangeId: right.id, leftChangeKind: left.changeKind, rightChangeKind: right.changeKind }
    }, context));
  }
  return records;
}

export function deleteModifySidecars(changes, context) {
  const records = [];
  for (const [left, right] of changePairs(changes)) {
    if (!sameChangeRegion(left, right)) continue;
    if (!(isDeleteChange(left) && isModifyChange(right)) && !(isDeleteChange(right) && isModifyChange(left))) continue;
    const deleted = isDeleteChange(left) ? left : right;
    const modified = deleted === left ? right : left;
    records.push(conflictSidecar('delete-modify', {
      id: `js_ts_conflict_${idFragment(deleted.id)}_${idFragment(modified.id)}_delete_modify`,
      affected: affectedFromEntries([deleted, modified], context),
      reasonCodes: ['delete-modify-same-region', ...deleted.reasonCodes, ...modified.reasonCodes],
      metadata: { deletedChangeId: deleted.id, modifiedChangeId: modified.id, deletedChangeKind: deleted.changeKind, modifiedChangeKind: modified.changeKind }
    }, context));
  }
  return records;
}

export function duplicateDeclarationSidecars(input, changes, context) {
  const declarations = [
    ...array(input.declarations),
    ...array(input.exports).map((entry) => ({ ...entry, exported: true })),
    ...array(input.members).map((entry) => ({ ...entry, member: true })),
    ...array(input.symbols),
    ...changes.filter((change) => isInsertChange(change) && (change.memberName || change.exportName || change.symbolName))
  ].map((entry, index) => normalizeDeclaration(entry, index, context)).filter((entry) => entry.name);
  return [
    ...duplicateGroups(declarations.filter((entry) => entry.exported), (entry) => [entry.sourcePath, entry.name].join('|'))
      .map((group) => duplicateRecord('duplicate-export', group, context)),
    ...duplicateGroups(declarations.filter((entry) => entry.member || entry.containerKey), (entry) => [entry.sourcePath, entry.containerKey, entry.name].join('|'))
      .map((group) => duplicateRecord('duplicate-member', group, context))
  ];
}

export function orderedListSidecars(input, changes, context) {
  const explicitLists = array(input.orderedLists).flatMap((list, listIndex) =>
    array(list.changes ?? list.operations ?? list.edits).map((change, changeIndex) => normalizeChange({
      ...change,
      listKey: change.listKey ?? list.key ?? list.id,
      orderedListKey: change.orderedListKey ?? list.key ?? list.id,
      sourcePath: change.sourcePath ?? list.sourcePath,
      sourceSpan: change.sourceSpan ?? list.sourceSpan,
      id: change.id ?? `${list.id ?? list.key ?? 'ordered_list'}_${changeIndex}`,
      side: change.side ?? change.author ?? `list_${listIndex}`
    }, context, `ordered_list_${listIndex}_${changeIndex}`))
  );
  const orderedChanges = [...changes, ...explicitLists].filter((change) =>
    change.listKey && orderedChangeKinds.test(change.changeKind)
  );
  const groups = duplicateGroups(orderedChanges, (change) => [
    change.sourcePath,
    change.listKey,
    firstString(change.index, change.position, change.orderKey, change.beforeKey, change.afterKey, change.anchorKey)
  ].join('|'));
  return groups.map((group) => conflictSidecar('ordered-list-conflict', {
    id: `js_ts_conflict_${idFragment(group[0].listKey)}_${idFragment(firstString(group[0].index, group[0].position, group[0].orderKey, 'position'))}_ordered_list`,
    affected: affectedFromEntries(group, context),
    reasonCodes: ['ordered-list-concurrent-position', ...group.flatMap((entry) => entry.reasonCodes)],
    metadata: {
      listKey: group[0].listKey,
      position: firstString(group[0].index, group[0].position, group[0].orderKey, group[0].beforeKey, group[0].afterKey),
      changeIds: group.map((entry) => entry.id)
    }
  }, context));
}

export function parserLedgerLossSidecars(input, context) {
  const losses = [
    ...array(input.parserLosses),
    ...array(input.ledgerLosses),
    ...array(input.losses),
    ...array(input.diagnostics)
  ].filter((entry) => parserLedgerLossPattern.test(lossText(entry)) || entry?.kind === 'parser-ledger-loss');
  if (!losses.length) return [];
  return [conflictSidecar('parser-ledger-loss', {
    id: `js_ts_conflict_${idFragment(context.sourcePath ?? context.language ?? 'source')}_parser_ledger_loss`,
    severity: losses.some((entry) => entry.severity === 'error' || entry.status === 'failed') ? 'error' : undefined,
    affected: affectedFromEntries(losses, context),
    reasonCodes: ['parser-or-ledger-loss', ...losses.flatMap(lossReasonCodes)],
    metadata: { lossIds: uniqueStrings(losses.map((entry) => entry.id)), lossKinds: uniqueStrings(losses.map((entry) => entry.kind ?? entry.code)) }
  }, context)];
}

export function staleSourceHashSidecars(input, context) {
  if (!context.expectedSourceHash || !context.currentSourceHash) return [];
  if (context.expectedSourceHash === context.currentSourceHash && input.staleSourceHash !== true) return [];
  return [conflictSidecar('stale-source-hash', {
    id: `js_ts_conflict_${idFragment(context.sourcePath ?? context.language ?? 'source')}_stale_source_hash`,
    affected: affectedFromEntries([{ sourcePath: context.sourcePath, sourceHash: context.currentSourceHash, key: context.sourcePath }], context),
    reasonCodes: ['stale-source-hash', 'expected-source-hash-mismatch'],
    metadata: { expectedSourceHash: context.expectedSourceHash, currentSourceHash: context.currentSourceHash }
  }, context)];
}

export function unsupportedSyntaxSidecars(input, context) {
  const entries = [
    ...array(input.unsupportedSyntax),
    ...array(input.syntaxUnsupported),
    ...array(input.syntaxLosses),
    ...array(input.losses).filter((entry) => unsupportedSyntaxPattern.test(lossText(entry)))
  ];
  if (!entries.length) return [];
  return entries.map((entry, index) => conflictSidecar('unsupported-syntax', {
    id: entry.id ?? `js_ts_conflict_${idFragment(context.sourcePath ?? context.language ?? 'source')}_${index + 1}_unsupported_syntax`,
    affected: affectedFromEntries([entry], context),
    reasonCodes: ['unsupported-js-ts-syntax', ...lossReasonCodes(entry)],
    metadata: compactRecord({
      syntaxKind: entry.kind ?? entry.syntaxKind,
      parser: entry.parser,
      message: entry.message ?? entry.summary
    })
  }, context));
}

export function duplicateRecord(conflictClass, group, context) {
  return conflictSidecar(conflictClass, {
    id: `js_ts_conflict_${idFragment(group[0].sourcePath ?? context.sourcePath ?? 'source')}_${idFragment(group[0].containerKey ?? 'export')}_${idFragment(group[0].name)}_${conflictClass.replace(/-/g, '_')}`,
    affected: affectedFromEntries(group, context),
    reasonCodes: [conflictClass === 'duplicate-member' ? 'duplicate-member-name' : 'duplicate-export-name'],
    metadata: {
      duplicateName: group[0].name,
      containerKey: group[0].containerKey,
      declarationIds: group.map((entry) => entry.id)
    }
  }, context);
}

export function conflictSidecar(conflictClass, input, context) {
  const defaults = classDefaults[conflictClass] ?? classDefaults['same-region'];
  const affected = normalizeAffected(input.affected ?? input, context);
  const reasonCodes = uniqueStrings([
    ...defaults.reasonCodes,
    ...strings(input.reasonCode),
    ...strings(input.reasonCodes)
  ]);
  const severity = normalizeSeverity(input.severity) ?? defaults.severity;
  const risk = normalizeRisk(input.risk) ?? defaults.risk;
  const readiness = normalizeSemanticMergeReadiness(input.readiness) ?? defaults.readiness;
  const suggestedOutcome = input.suggestedOutcome ?? input.outcome ?? defaults.suggestedOutcome;
  const id = input.id ?? `js_ts_conflict_${idFragment(conflictClass)}_${idFragment([
    ...affected.keys,
    ...affected.sourcePaths,
    ...reasonCodes
  ].join('_'))}`;
  return {
    kind: 'frontier.lang.jsTsSemanticMergeConflictSidecar',
    version: 1,
    schema: 'frontier.lang.jsTsSemanticMergeConflictSidecar.v1',
    id,
    class: conflictClass,
    severity,
    risk,
    readiness,
    affected,
    reasonCodes,
    suggestedOutcome,
    explanation: {
      class: conflictClass,
      severity,
      risk,
      affected,
      reasonCodes,
      suggestedOutcome
    },
    metadata: compactRecord(input.metadata)
  };
}
