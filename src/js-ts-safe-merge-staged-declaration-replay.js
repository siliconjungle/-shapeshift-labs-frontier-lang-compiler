import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from './native-import-utils.js';

function createStagedDeclarationProjection(input) {
  const replay = input.stagedFallback.declarationReplay;
  const reasonCodes = uniqueStrings(replay.reasonCodes);
  const blocked = reasonCodes.length > 0;
  const sourceText = blocked ? undefined : replay.outputSourceText;
  const edits = blocked ? [] : replay.edits.map((edit, index) => stagedDeclarationProjectionEdit(edit, index, input));
  const core = {
    kind: 'frontier.lang.semanticEditProjection',
    version: 1,
    id: `${input.id}_semantic_edit_projection`,
    scriptId: input.script.id,
    status: blocked ? 'blocked' : 'projected',
    sourcePath: input.sourcePath,
    language: input.language,
    baseHash: input.script.baseHash,
    workerHash: input.script.workerHash,
    headHash: input.script.headHash,
    projectedHash: sourceText === undefined ? undefined : hashSemanticValue(sourceText),
    appliedOperations: edits.map((edit) => edit.operationId),
    skippedOperations: blocked ? (input.script.operations ?? []).map((operation) => operation.id) : [],
    edits,
    sourceText,
    admission: {
      status: blocked ? 'blocked' : 'auto-merge-candidate',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-staged-declaration-replay',
      ...input.stagedFallback.metadata
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function stagedDeclarationProjectionEdit(edit, index, input) {
  const operationId = `staged_declaration_replay_${idFragment([input.id, edit.key, index].join(':'))}`;
  const replacementText = edit.replacementText;
  const deletedText = edit.currentText;
  return {
    operationId,
    status: 'applied',
    kind: 'replaceDeclaration',
    editKind: 'replace',
    changeKind: 'modified',
    anchorKey: edit.key,
    conflictKey: `declaration:${edit.key}`,
    regionKind: 'declaration',
    sourcePath: input.sourcePath,
    symbolName: edit.names?.[0],
    symbolKind: edit.declarationKind,
    editContentHash: hashSemanticValue({ operationId, replacementText, deletedText }),
    headStart: edit.start,
    headEnd: edit.end,
    editOrder: index,
    deletedBytes: deletedText.length,
    replacementBytes: replacementText.length,
    deletedTextHash: hashSemanticValue(deletedText),
    replacementTextHash: hashSemanticValue(replacementText),
    replacementText
  };
}

function createStagedDeclarationReplayRecord(input) {
  const projectionReady = input.projection.status === 'projected';
  const outputSourceText = projectionReady ? input.projection.sourceText : undefined;
  const edits = projectionReady ? input.projection.edits.map((edit) => ({
    operationId: edit.operationId,
    editKind: edit.editKind,
    editOrder: edit.editOrder,
    sourcePath: edit.sourcePath,
    symbolName: edit.symbolName,
    symbolKind: edit.symbolKind,
    status: 'applied',
    start: edit.headStart,
    end: edit.headEnd,
    replacementBytes: edit.replacementBytes,
    replacementText: edit.replacementText,
    reasonCodes: ['staged-declaration-replay']
  })) : [];
  const status = projectionReady ? 'accepted-clean' : 'blocked';
  const reasonCodes = projectionReady ? [] : input.projection.admission.reasonCodes;
  const core = {
    kind: 'frontier.lang.semanticEditReplay',
    version: 1,
    schema: 'frontier.lang.semanticEditReplay.v1',
    id: `${input.id}_semantic_edit_replay`,
    projectionId: input.projection.id,
    scriptId: input.projection.scriptId,
    sourcePath: input.sourcePath,
    language: input.language,
    currentHash: hashSemanticValue(input.replayCurrentSourceText),
    projectedHash: input.projection.projectedHash,
    outputHash: outputSourceText === undefined ? undefined : hashSemanticValue(outputSourceText),
    status,
    edits,
    appliedOperations: edits.map((edit) => edit.operationId),
    skippedOperations: [],
    admission: {
      status,
      action: projectionReady ? 'apply' : 'block',
      reviewRequired: !projectionReady,
      autoApplyCandidate: projectionReady,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    outputSourceText,
    summary: {
      edits: edits.length,
      applied: edits.length,
      alreadyApplied: 0,
      conflicts: 0,
      stale: 0,
      blocked: projectionReady ? 0 : 1,
      reasonCodes
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-staged-declaration-replay',
      ...input.stagedFallback.metadata
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function createStagedDeclarationAlreadyAppliedReplay(input) {
  const projectionReady = input.projection.status === 'projected';
  const edits = projectionReady ? input.projection.edits.map((edit) => ({
    operationId: edit.operationId,
    editKind: edit.editKind,
    editOrder: edit.editOrder,
    sourcePath: edit.sourcePath,
    symbolName: edit.symbolName,
    symbolKind: edit.symbolKind,
    status: 'already-applied',
    start: edit.headStart,
    end: edit.headStart + edit.replacementBytes,
    replacementBytes: edit.replacementBytes,
    replacementText: edit.replacementText,
    reasonCodes: ['staged-declaration-already-applied']
  })) : [];
  const status = projectionReady ? 'already-applied' : 'blocked';
  const reasonCodes = projectionReady ? [] : input.projection.admission.reasonCodes;
  const core = {
    kind: 'frontier.lang.semanticEditReplay',
    version: 1,
    schema: 'frontier.lang.semanticEditReplay.v1',
    id: `${input.id}_semantic_edit_already_applied`,
    projectionId: input.projection.id,
    scriptId: input.projection.scriptId,
    sourcePath: input.sourcePath,
    language: input.language,
    currentHash: input.projection.projectedHash,
    projectedHash: input.projection.projectedHash,
    outputHash: input.projection.projectedHash,
    status,
    edits,
    appliedOperations: [],
    skippedOperations: edits.map((edit) => edit.operationId),
    admission: {
      status,
      action: projectionReady ? 'skip' : 'block',
      reviewRequired: !projectionReady,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    outputSourceText: input.projection.sourceText,
    summary: {
      edits: edits.length,
      applied: 0,
      alreadyApplied: edits.length,
      conflicts: 0,
      stale: 0,
      blocked: projectionReady ? 0 : 1,
      reasonCodes
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-staged-declaration-replay'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

export {
  createStagedDeclarationAlreadyAppliedReplay,
  createStagedDeclarationProjection,
  createStagedDeclarationReplayRecord
};
