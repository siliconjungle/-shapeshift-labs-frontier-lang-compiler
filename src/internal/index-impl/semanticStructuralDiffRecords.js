import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';

function semanticStructuralEdit(input) {
  const actions = structuralEditActions(input);
  const structuralKind = structuralEditKind(actions);
  const record = compactRecord({
    id: `semantic_structural_edit_${idFragment(input.operationId)}`,
    kind: 'frontier.lang.semanticStructuralEdit',
    version: 1,
    algorithm: 'frontier.semantic-edit-structural-diff.v1',
    runtimeNeutral: true,
    operationId: input.operationId,
    structuralKind,
    actions,
    operationKind: input.kind,
    changeKind: input.changeKind,
    anchorKey: input.anchor?.key,
    conflictKey: input.anchor?.conflictKey,
    regionKind: input.anchor?.regionKind,
    sourcePath: input.anchor?.sourcePath,
    symbolName: input.anchor?.symbolName,
    symbolKind: input.anchor?.symbolKind,
    from: structuralSpanLocation(input.spans?.base),
    to: structuralSpanLocation(input.spans?.worker),
    head: structuralSpanLocation(input.spans?.head),
    baseTextHash: input.hashes?.baseTextHash,
    workerTextHash: input.hashes?.workerTextHash,
    headTextHash: input.hashes?.headTextHash,
    beforeSignatureHash: input.hashes?.beforeSignatureHash,
    afterSignatureHash: input.hashes?.afterSignatureHash,
    status: input.status,
    reviewRequired: true,
    confidence: input.confidence,
    reasonCodes: uniqueStrings([
      ...(input.reasonCodes ?? []),
      'structural-diff-review-required',
      'replay-required-for-safety'
    ]),
    reanchor: input.reanchor,
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  });
  return { ...record, hash: hashSemanticValue(record) };
}

function semanticStructuralDiff(input) {
  const edits = (input.operations ?? []).map((operation) => operation.structuralEdit).filter(Boolean);
  const summary = summarizeStructuralEdits(edits);
  const core = {
    kind: 'frontier.lang.semanticStructuralDiff',
    version: 1,
    schema: 'frontier.lang.semanticStructuralDiff.v1',
    id: input.input.structuralDiffId ?? `semantic_structural_diff_${idFragment(input.input.id ?? input.sourcePath ?? 'semantic_edit')}`,
    algorithm: 'frontier.semantic-edit-structural-diff.v1',
    runtimeNeutral: true,
    language: input.language,
    sourcePath: input.sourcePath,
    workerChangeSetId: input.workerChangeSet.id,
    headChangeSetId: input.headChangeSet?.id,
    edits,
    summary,
    admission: {
      status: 'review-required',
      action: 'run-replay-and-diagnostics',
      reviewRequired: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: ['structural-diff-review-required', 'replay-required-for-safety']
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      note: 'Structural edit records classify AST/CST-neutral anchor movement and content changes; source replay diagnostics still decide safety.'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function structuralEditActions(input) {
  if (input.changeKind === 'added') return ['insert'];
  if (input.changeKind === 'removed') return ['delete'];
  const actions = [];
  if (structuralSpanMoved(input.spans?.base, input.spans?.worker) || input.reanchor?.toAnchorKey) actions.push('move');
  if (structuralContentChanged(input.hashes)) actions.push('update');
  return actions.length ? actions : ['update'];
}

function structuralEditKind(actions) {
  if (actions.includes('move') && actions.includes('update')) return 'move-update';
  return actions[0] ?? 'update';
}

function structuralContentChanged(hashes) {
  return Boolean(
    hashes?.baseTextHash && hashes?.workerTextHash && hashes.baseTextHash !== hashes.workerTextHash
    || hashes?.beforeSignatureHash && hashes?.afterSignatureHash && hashes.beforeSignatureHash !== hashes.afterSignatureHash
  );
}

function structuralSpanMoved(left, right) {
  if (!left || !right) return false;
  return (left.path && right.path && left.path !== right.path)
    || left.startLine !== right.startLine
    || left.startColumn !== right.startColumn
    || left.endLine !== right.endLine
    || left.endColumn !== right.endColumn;
}

function structuralSpanLocation(span) {
  return span ? compactRecord({
    path: span.path,
    startLine: span.startLine,
    startColumn: span.startColumn,
    endLine: span.endLine,
    endColumn: span.endColumn
  }) : undefined;
}

function summarizeStructuralEdits(edits) {
  const byKind = countBy(edits.map((edit) => edit.structuralKind));
  const byAction = countBy(edits.flatMap((edit) => edit.actions ?? []));
  return {
    edits: edits.length,
    byKind,
    byAction,
    moves: byAction.move ?? 0,
    updates: byAction.update ?? 0,
    inserts: byAction.insert ?? 0,
    deletes: byAction.delete ?? 0,
    moveUpdates: byKind['move-update'] ?? 0,
    reviewRequired: edits.length > 0,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function countBy(values) {
  const result = {};
  for (const value of values.filter(Boolean)) result[value] = (result[value] ?? 0) + 1;
  return result;
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}

export { semanticStructuralDiff, semanticStructuralEdit };
