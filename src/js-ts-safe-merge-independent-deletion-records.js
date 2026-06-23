import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from './native-import-utils.js';

function independentTopLevelDeletionOperation(input) {
  const entry = input.deletionPlan.deletedEntry;
  const name = entry.names?.[0] ?? entry.key;
  const symbolKind = entry.declarationInfo?.declarationKind ?? 'declaration';
  const anchorKey = `source#${input.sourcePath}#declaration#${name}`;
  const operation = {
    id: input.operationId,
    kind: 'jsTsRemoveTopLevelDeclaration',
    changeKind: 'removed',
    anchor: {
      key: anchorKey,
      conflictKey: `declaration:${entry.key}`,
      regionId: anchorKey,
      regionKind: 'declaration',
      granularity: 'js-ts-ledger-entry',
      language: input.language,
      sourcePath: input.sourcePath,
      symbolId: anchorKey,
      symbolName: name,
      symbolKind,
      sourceSpan: { start: input.deletionPlan.headEntry.start, end: input.deletionPlan.headEntry.end }
    },
    spans: {
      base: { start: entry.start, end: entry.end },
      head: { start: input.deletionPlan.headEntry.start, end: input.deletionPlan.headEntry.end }
    },
    hashes: {
      baseSourceHash: input.input.baseHash,
      workerSourceHash: input.input.workerHash,
      headSourceHash: input.input.headHash,
      baseTextHash: hashSemanticValue(entry.text),
      headTextHash: hashSemanticValue(input.deletionPlan.headEntry.text),
      workerTextHash: hashSemanticValue('')
    },
    status: 'portable',
    readiness: 'ready',
    confidence: 1,
    reasonCodes: ['head-anchor-matches-base', 'independent-top-level-deletion'],
    evidenceIds: [`evidence_${idFragment(input.id)}_independent_top_level_deletion`],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      ledgerKey: entry.key,
      exported: false
    }
  };
  return { ...operation, operationContentHash: hashSemanticValue(operation) };
}

function independentTopLevelDeletionScript(input) {
  const core = {
    kind: 'frontier.lang.semanticEditScript',
    version: 1,
    schema: 'frontier.lang.semanticEditScript.v1',
    id: `${input.id}_semantic_edit`,
    stableId: `semantic_edit_script_${idFragment([input.id, input.operation.operationContentHash].join(':'))}`,
    language: input.language,
    sourcePath: input.sourcePath,
    baseHash: input.input.baseHash,
    workerHash: input.input.workerHash,
    headHash: input.input.headHash,
    operations: [input.operation],
    summary: {
      operations: 1,
      byStatus: { portable: 1 },
      byKind: { jsTsRemoveTopLevelDeclaration: 1 },
      portable: 1,
      alreadyApplied: 0,
      needsPort: 0,
      conflicts: 0,
      stale: 0,
      blocked: 0,
      candidates: 0,
      autoMergeCandidates: 1,
      operationContentHashes: [input.operation.operationContentHash]
    },
    admission: {
      status: 'auto-merge-candidate',
      action: 'run-gates-and-apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: input.operation.reasonCodes,
      conflictKeys: [input.operation.anchor.conflictKey],
      evidenceIds: input.operation.evidenceIds
    },
    evidence: [{
      id: `evidence_${idFragment(input.id)}_independent_top_level_deletion_script`,
      kind: 'semantic-edit-script',
      status: 'passed',
      path: input.sourcePath,
      summary: 'Created independent top-level deletion script with 1 operation.',
      metadata: {
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      }
    }],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'independent-top-level-deletion-fallback'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function independentTopLevelDeletionProjection(input) {
  const editContentHash = hashSemanticValue({
    operationId: input.operation.id,
    deletedText: input.deletionPlan.deletedText,
    replacementText: ''
  });
  const edit = {
    operationId: input.operation.id,
    status: 'applied',
    kind: input.operation.kind,
    editKind: 'delete',
    changeKind: 'removed',
    anchorKey: input.operation.anchor.key,
    conflictKey: input.operation.anchor.conflictKey,
    regionId: input.operation.anchor.regionId,
    regionKind: input.operation.anchor.regionKind,
    sourcePath: input.sourcePath,
    symbolId: input.operation.anchor.symbolId,
    symbolName: input.operation.anchor.symbolName,
    symbolKind: input.operation.anchor.symbolKind,
    operationContentHash: input.operation.operationContentHash,
    editContentHash,
    headStart: input.deletionPlan.edit.start,
    headEnd: input.deletionPlan.edit.end,
    editOrder: 0,
    deletedBytes: input.deletionPlan.deletedText.length,
    replacementBytes: 0,
    deletedTextHash: hashSemanticValue(input.deletionPlan.deletedText),
    replacementTextHash: hashSemanticValue(''),
    deletedTextLineEndingStableHash: lineEndingStableTextHash(input.deletionPlan.deletedText),
    replacementTextLineEndingStableHash: lineEndingStableTextHash(''),
    replacementText: ''
  };
  const core = {
    kind: 'frontier.lang.semanticEditProjection',
    version: 1,
    id: `${input.id}_semantic_edit_projection`,
    scriptId: input.script.id,
    status: 'projected',
    sourcePath: input.sourcePath,
    language: input.language,
    baseHash: input.input.baseHash,
    workerHash: input.input.workerHash,
    headHash: input.input.headHash,
    projectedHash: hashSemanticValue(input.deletionPlan.mergedSourceText),
    appliedOperations: [input.operation.id],
    skippedOperations: [],
    edits: [edit],
    sourceText: input.deletionPlan.mergedSourceText,
    admission: {
      status: 'auto-merge-candidate',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'independent-top-level-deletion-fallback'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function independentTopLevelDeletionReplay(input) {
  const applied = input.editStatus === 'applied';
  const edit = {
    operationId: input.operation.id,
    editKind: 'delete',
    editOrder: 0,
    sourcePath: input.sourcePath,
    symbolName: input.operation.anchor.symbolName,
    symbolKind: input.operation.anchor.symbolKind,
    status: input.editStatus,
    start: applied ? input.deletionPlan.edit.start : undefined,
    end: applied ? input.deletionPlan.edit.end : undefined,
    replacementBytes: 0,
    replacementText: '',
    reasonCodes: input.reasonCodes
  };
  const core = {
    kind: 'frontier.lang.semanticEditReplay',
    version: 1,
    schema: 'frontier.lang.semanticEditReplay.v1',
    id: input.id,
    projectionId: input.projection.id,
    scriptId: input.projection.scriptId,
    sourcePath: input.sourcePath,
    language: input.language,
    currentHash: hashSemanticValue(input.currentSourceText),
    projectedHash: input.projection.projectedHash,
    outputHash: hashSemanticValue(input.outputSourceText),
    status: input.status,
    edits: [edit],
    appliedOperations: applied ? [input.operation.id] : [],
    skippedOperations: applied ? [] : [input.operation.id],
    admission: {
      status: input.status,
      action: applied ? 'apply' : 'skip',
      reviewRequired: false,
      autoApplyCandidate: applied,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    outputSourceText: input.outputSourceText,
    summary: {
      edits: 1,
      applied: applied ? 1 : 0,
      alreadyApplied: applied ? 0 : 1,
      conflicts: 0,
      stale: 0,
      blocked: 0,
      reasonCodes: []
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'independent-top-level-deletion-fallback'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function lineEndingStableTextHash(value) {
  const normalized = lineEndingStableText(value);
  return normalized === undefined ? undefined : hashSemanticValue(normalized);
}

function lineEndingStableText(value) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.length > 1 && normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
}

export {
  independentTopLevelDeletionOperation,
  independentTopLevelDeletionProjection,
  independentTopLevelDeletionReplay,
  independentTopLevelDeletionScript
};
