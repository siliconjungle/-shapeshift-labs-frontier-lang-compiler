import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { createSemanticEditScript } from './internal/index-impl/semanticEditScripts.js';
import { projectSemanticEditScriptToSource } from './internal/index-impl/projectSemanticEditScriptToSource.js';
import { replaySemanticEditProjection } from './internal/index-impl/replaySemanticEditProjection.js';
import { JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { independentTopLevelDeletionFallbackResult } from './js-ts-safe-merge-independent-deletion-fallback.js';
import { normalizeAlreadyAppliedDeleteReplay } from './js-ts-safe-merge-semantic-edit-already-applied.js';
import { blockedSemanticEditArtifacts, semanticEditArtifacts } from './js-ts-safe-merge-semantic-edit-artifacts.js';
import {
  semanticFallbackCandidates,
  semanticFallbackChangedExistingDeclarations,
  semanticFallbackConflictCode,
  semanticFallbackPhase,
  shouldTrySemanticEditFallback
} from './js-ts-safe-merge-semantic-edit-fallback-utils.js';
import { semanticEditGates } from './js-ts-safe-merge-semantic-edit-gates.js';
import {
  createStagedDeclarationAlreadyAppliedReplay,
  createStagedDeclarationProjection,
  createStagedDeclarationReplayRecord
} from './js-ts-safe-merge-staged-declaration-replay.js';
import { createStagedTopLevelSemanticFallback } from './js-ts-safe-merge-staged-top-level-fallback.js';
import { createSourceShapeSemanticFallbackResult } from './js-ts-safe-merge-source-shape-fallbacks.js';
import { analyzeTopLevelRenameAdmission } from './js-ts-safe-merge-top-level-rename-fallback.js';
import { topLevelRenameBlockedResult } from './js-ts-safe-merge-top-level-rename-result.js';

function semanticEditFallbackResult(input, topLevelResult) {
  const independentDeletionResult = independentTopLevelDeletionFallbackResult(input, topLevelResult);
  if (independentDeletionResult) return independentDeletionResult;
  const topLevelRenameAdmission = analyzeTopLevelRenameAdmission(input, topLevelResult);
  if (topLevelRenameAdmission?.status === 'blocked') {
    if (shouldDeferTopLevelRenamePublicContract(input, topLevelRenameAdmission)) {
      const deferredAdmission = deferredTopLevelRenameAdmission(topLevelRenameAdmission);
      const artifacts = createSemanticEditFallbackArtifacts(input, topLevelResult);
      if (artifacts.status !== 'verified') {
        return semanticEditFallbackBlockedResult(input, topLevelResult, artifacts, deferredAdmission);
      }
      return semanticEditFallbackMergedResult(input, topLevelResult, undefined, artifacts, deferredAdmission);
    }
    return topLevelRenameBlockedResult(input, topLevelResult, topLevelRenameAdmission);
  }
  if (topLevelRenameAdmission?.status === 'candidate') {
    const artifacts = createSemanticEditFallbackArtifacts(input, topLevelResult);
    if (artifacts.status !== 'verified') {
      return semanticEditFallbackBlockedResult(input, topLevelResult, artifacts, topLevelRenameAdmission);
    }
    return semanticEditFallbackMergedResult(input, topLevelResult, undefined, artifacts, topLevelRenameAdmission);
  }
  if (!shouldTrySemanticEditFallback(topLevelResult)) return topLevelResult;
  const stagedFallback = createStagedTopLevelSemanticFallback(input, topLevelResult);
  const candidates = semanticFallbackCandidates(stagedFallback);
  let selectedFallback = candidates[0];
  let artifacts = createSemanticEditFallbackArtifacts(input, topLevelResult, selectedFallback);
  for (const candidate of candidates.slice(1)) {
    if (artifacts.status === 'verified') break;
    const nextArtifacts = createSemanticEditFallbackArtifacts(input, topLevelResult, candidate);
    if (nextArtifacts.status === 'verified') selectedFallback = candidate;
    artifacts = nextArtifacts.status === 'verified' ? nextArtifacts : artifacts;
  }
  if (artifacts.status !== 'verified') {
    const sourceShapeResult = createSourceShapeSemanticFallbackResult(input, topLevelResult, stagedFallback);
    if (sourceShapeResult) return sourceShapeResult;
    return semanticEditFallbackBlockedResult(input, topLevelResult, artifacts);
  }
  return semanticEditFallbackMergedResult(input, topLevelResult, selectedFallback, artifacts);
}

function semanticEditFallbackMergedResult(input, topLevelResult, selectedFallback, artifacts, topLevelRenameAdmission) {
  const resultBase = selectedFallback?.stagedTopLevelResult ?? topLevelResult;
  const mergedSourceText = artifacts.projection.sourceText;
  const gates = semanticEditGates(artifacts);
  return {
    ...resultBase,
    id: String(input.id ?? resultBase.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.merged,
    mergedSourceText,
    outputSourceText: mergedSourceText,
    conflicts: [],
    gates,
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
      ...resultBase.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, resultBase, selectedFallback),
      conflicts: 0,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.script.summary.operations,
      semanticEditAppliedOperations: artifacts.replay.summary.applied,
      semanticEditReplayStatus: artifacts.replay.status,
      topLevelDeclarationRenames: topLevelRenameAdmission ? 1 : resultBase.summary?.topLevelDeclarationRenames,
      composedPhases: 2
    },
    metadata: {
      ...resultBase.metadata,
      composed: {
        phase: topLevelRenameAdmission ? 'top-level-rename-semantic-edit-fallback' : semanticFallbackPhase(selectedFallback),
        phases: topLevelRenameAdmission
          ? ['top-level-rename-admission', 'semantic-edit']
          : selectedFallback ? ['top-level-neutralization', 'top-level-ledger', 'semantic-edit'] : ['top-level-ledger', 'semantic-edit'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: selectedFallback?.stagedTopLevelResult?.summary,
        neutralization: selectedFallback?.neutralization?.summary,
        topLevelRenameAdmission: topLevelRenameAdmission?.summary
      }
    },
    semanticArtifacts: artifacts
  };
}

function createSemanticEditFallbackArtifacts(input, topLevelResult, stagedFallback) {
  try {
    const id = String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge');
    const language = input.language ?? topLevelResult.language ?? 'typescript';
    const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.ts';
    const stagedDeclarationProjection = stagedFallback && stagedFallback.projectionMode !== 'direct';
    const scriptInput = stagedFallback?.scriptInput ?? input;
    const projectionHeadSourceText = stagedFallback?.projectionMode === 'direct'
      ? stagedFallback.directProjectionHeadSourceText
      : stagedFallback?.projectionHeadSourceText ?? input.headSourceText;
    const replayCurrentSourceText = stagedFallback?.projectionMode === 'direct'
      ? stagedFallback.directReplayCurrentSourceText
      : stagedFallback?.replayCurrentSourceText ?? input.headSourceText;
    const script = createSemanticEditScript({
      ...scriptInput,
      id: `${id}_semantic_edit`,
      language,
      sourcePath
    });
    const projection = stagedDeclarationProjection
      ? createStagedDeclarationProjection({ id, script, sourcePath, language, stagedFallback })
      : projectSemanticEditScriptToSource({
        id: `${id}_semantic_edit_projection`,
        script,
        workerSourceText: scriptInput.workerSourceText,
        headSourceText: projectionHeadSourceText,
        headSourcePath: sourcePath,
        parser: input.parser,
        metadata: stagedFallback?.metadata
      });
    const replay = stagedDeclarationProjection
      ? createStagedDeclarationReplayRecord({ id, projection, sourcePath, language, stagedFallback, replayCurrentSourceText })
      : replaySemanticEditProjection({
        id: `${id}_semantic_edit_replay`,
        projection,
        currentSourceText: replayCurrentSourceText,
        currentSourcePath: sourcePath,
        currentSourceHash: typeof replayCurrentSourceText === 'string' ? hashSemanticValue(replayCurrentSourceText) : undefined,
        expectedOutputSourceText: projection.sourceText,
        expectedOutputHash: projection.projectedHash,
        language,
        parser: input.parser,
        metadata: stagedFallback?.metadata
      });
    const alreadyAppliedReplay = stagedDeclarationProjection
      ? createStagedDeclarationAlreadyAppliedReplay({ id, projection, sourcePath, language })
      : normalizeAlreadyAppliedDeleteReplay({
        projection,
        replay,
        alreadyAppliedReplay: replaySemanticEditProjection({
          id: `${id}_semantic_edit_already_applied`,
          projection,
          currentSourceText: projection.sourceText,
          currentSourcePath: sourcePath,
          currentSourceHash: projection.projectedHash,
          language,
          parser: input.parser
        })
      });
    return semanticEditArtifacts({
      id,
      language,
      sourcePath,
      script,
      projection,
      replay,
      alreadyAppliedReplay,
      topLevelResult,
      stagedFallback
    });
  } catch (error) {
    return blockedSemanticEditArtifacts(input, topLevelResult, ['semantic-edit-fallback-error'], error);
  }
}

function semanticEditFallbackBlockedResult(input, topLevelResult, artifacts) {
  const reasonCodes = artifacts.admission.reasonCodes.length
    ? artifacts.admission.reasonCodes
    : topLevelResult.admission?.reasonCodes ?? [];
  const gates = semanticEditGates(artifacts);
  const conflict = {
    code: semanticFallbackConflictCode(topLevelResult),
    gateId: 'semantic-edit-replay',
    message: 'JS/TS semantic edit fallback did not verify a clean replay.',
    side: 'worker',
    sourcePath: input.sourcePath ?? topLevelResult.sourcePath,
    details: { reasonCodes }
  };
  return {
    ...topLevelResult,
    conflicts: [conflict],
    gates,
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
      ...topLevelResult.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, topLevelResult),
      conflicts: 1,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.summary.operations,
      semanticEditReplayStatus: artifacts.summary.replayStatus
    },
    semanticArtifacts: artifacts
  };
}

function shouldDeferTopLevelRenamePublicContract(input, admission) {
  if (input.deferTopLevelRenamePublicExportContractToProjectGraph !== true
    || admission.reasonCodes?.length !== 1
    || !admission.reasonCodes.includes('top-level-rename-public-export-contract')) {
    return false;
  }
  if (admission.summary?.exported === true) {
    return input.deferDirectExportRenamePublicContractToProjectSymbolRename === true;
  }
  return workerPreservesRenamedExportAlias(input.workerSourceText, admission.summary);
}

function deferredTopLevelRenameAdmission(admission) {
  return {
    ...admission,
    status: 'candidate',
    reasonCodes: ['top-level-rename-public-export-contract-deferred-to-project-graph'],
    summary: {
      ...admission.summary,
      deferredToProjectGraph: true,
      reasonCodes: ['top-level-rename-public-export-contract-deferred-to-project-graph']
    }
  };
}

function workerPreservesRenamedExportAlias(sourceText, summary) {
  const fromName = summary?.fromName;
  const toName = summary?.toName;
  if (typeof sourceText !== 'string' || !fromName || !toName) return false;
  const exportListPattern = new RegExp(`export\\s*\\{[^}]*\\b${escapeRegExp(toName)}\\s+as\\s+${escapeRegExp(fromName)}\\b[^}]*\\}`);
  return exportListPattern.test(sourceText);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { semanticEditFallbackResult };
