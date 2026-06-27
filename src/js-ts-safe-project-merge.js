import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsSource } from './js-ts-safe-merge-composed.js';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { createJsTsProjectMergeDeclarationGate } from './js-ts-safe-project-merge-declarations.js';
import { createJsTsProjectMergeDeclarationEmitParityProof } from './js-ts-safe-project-merge-declaration-emit-parity.js';
import { createJsTsProjectMergeDiagnosticsGate } from './js-ts-safe-project-merge-diagnostics.js';
import { createJsTsProjectSafeMergeGraphArtifacts, createJsTsProjectSafeMergeGraphDelta } from './js-ts-safe-project-merge-graph.js';
import { addProjectGraphDeltaConflictSummary } from './js-ts-safe-project-merge-graph-delta-conflicts.js';
import { outputProjectGraphConflicts, projectGraphDeltaConflicts } from './js-ts-safe-project-merge-graph-conflicts.js';
import { createProjectAdmissionRoutes, projectAdmissionRouteSummary } from './js-ts-safe-project-merge-admission-routes.js';
import { maybeBlockAmbientProjectFile } from './js-ts-safe-project-merge-ambient.js';
import { maybeMergeImportSpecifierRemovalFile } from './js-ts-safe-project-merge-import-removal.js';
import { createJsTsProjectMergeQualityGate } from './js-ts-safe-project-merge-quality-gates.js';
import { createJsTsProjectMergeProofEvidence } from './js-ts-safe-project-merge-proof-levels.js';
import { projectProofEvidenceConflicts } from './js-ts-safe-project-merge-proof-conflicts.js';
import { blockedFile, hashText, policyForFile, safeId, sourceLedgersForFile, syntheticFile, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { normalizeProjectFiles } from './js-ts-safe-project-merge-files.js';
import { applyProjectMoveRenameClassifications, classifyProjectMoveRenames } from './js-ts-safe-project-merge-move-rename.js';
import { applyProjectSymbolRenameClassifications, classifyProjectSymbolRenames } from './js-ts-safe-project-merge-symbol-rename.js';
import { applyProjectSplitMergeClassifications, classifyProjectSplitMerges } from './js-ts-safe-project-merge-split-merge.js';
import { projectConfidence, projectEvidence, projectSummary, projectSummaryWithConfidenceEvidence } from './js-ts-safe-project-merge-summary.js';
import { maybeMergeHtmlCssProjectFile, projectFileLanguage } from './js-ts-safe-project-merge-html-css.js';
import { createProjectCssModuleMergeEvidence, mergeOutputProjectImports, projectCssModuleOutputProjectImports } from './js-ts-safe-project-merge-css-module-proofs.js';

function safeMergeJsTsProject(input = {}) {
  const id = String(input.id ?? 'js_ts_project_safe_merge');
  const files = normalizeProjectFiles(input);
  const projectMoveRenames = classifyProjectMoveRenames(files, input, id);
  const projectSymbolRenames = classifyProjectSymbolRenames(files, input);
  const projectSplitMerges = classifyProjectSplitMerges(files);
  const projectCssModuleMergeEvidence = createProjectCssModuleMergeEvidence(input, files, id);
  const mergedFileResults = files.map((file) => mergeProjectFile(file, input, id, projectSymbolRenames, projectCssModuleMergeEvidence));
  const fileResults = applyProjectSplitMergeClassifications(
    applyProjectSymbolRenameClassifications(
      applyProjectMoveRenameClassifications(mergedFileResults, projectMoveRenames, files, input),
      files,
      input,
      projectSymbolRenames
    ),
    projectSplitMerges,
    files,
    input
  );
  const symbolRenameSummary = {
    ...projectSymbolRenames.summary,
    ...(projectSymbolRenames.admissionSummary ?? {})
  };
  const moveRenameSummary = {
    ...projectMoveRenames.summary,
    ...(projectMoveRenames.admissionSummary ?? {})
  };
  const splitMergeSummary = {
    ...projectSplitMerges.summary,
    ...(projectSplitMerges.admissionSummary ?? {})
  };
  const blockedFiles = fileResults.filter((file) => file.status === 'blocked');
  const inputFilesByPath = new Map(files.map((file) => [file.sourcePath, file]));
  const outputFiles = fileResults
    .filter((file) => typeof file.outputSourceText === 'string')
    .map((file) => compactRecord({
      sourcePath: file.sourcePath,
      language: file.language,
      sourceText: file.outputSourceText,
      sourceHash: file.outputHash,
      parserTriviaEvidence: outputParserTriviaEvidence(inputFilesByPath.get(file.sourcePath), file),
      operation: file.operation
    }));
  const graphInput = mergeOutputProjectImports(input, projectCssModuleOutputProjectImports(projectCssModuleMergeEvidence, fileResults, input));
  const outputDeclarationGate = blockedFiles.length === 0
    ? createJsTsProjectMergeDeclarationGate(input, outputFiles, id)
    : undefined;
  const declarationEmitParityProof = blockedFiles.length === 0
    ? createJsTsProjectMergeDeclarationEmitParityProof(input, files, outputFiles, id)
    : undefined;
  const projectGraphDelta = blockedFiles.length === 0 && input.includeProjectGraphDelta
    ? createJsTsProjectSafeMergeGraphDelta(graphInput, files, outputFiles, id)
    : undefined;
  const graphArtifacts = projectGraphDelta?.stages?.output ?? (blockedFiles.length === 0 && input.includeOutputProjectSymbolGraph
    ? createJsTsProjectSafeMergeGraphArtifacts(graphInput, outputFiles, id)
    : undefined);
  const outputDiagnosticsGate = blockedFiles.length === 0
    ? createJsTsProjectMergeDiagnosticsGate(input, outputFiles, id, { fileResults })
    : undefined;
  const outputQualityGate = blockedFiles.length === 0 ? createJsTsProjectMergeQualityGate(input, id) : undefined;
  const proofEvidence = createJsTsProjectMergeProofEvidence({
    id,
    files,
    fileResults,
    outputDiagnosticsGate,
    outputDeclarationGate,
    outputQualityGate, externalSemanticEquivalenceProof: input.externalSemanticEquivalenceProof ?? input.semanticEquivalenceProof, semanticEquivalenceProof: input.semanticEquivalenceProof, language: input.language
  });
  const outputGraphConflicts = outputProjectGraphConflicts(projectGraphDelta ? graphArtifacts?.projectSymbolGraph : graphArtifacts);
  const deltaGraphConflicts = projectGraphDeltaConflicts(projectGraphDelta, { declarationEmitParityProof, outputDiagnosticsGate, outputDeclarationGate, runtimeOrderEvidence: input.runtimeOrderEvidence, projectRuntimeOrderEvidence: input.projectRuntimeOrderEvidence, evidence: input.evidence, commonJsRuntimeInteropProof: input.commonJsRuntimeInteropProof, commonJsRuntimeInteropProofs: input.commonJsRuntimeInteropProofs, globalAugmentationCompatibilityProof: input.globalAugmentationCompatibilityProof, globalAugmentationCompatibilityProofs: input.globalAugmentationCompatibilityProofs, jsxRenderReturnBranchProof: input.jsxRenderReturnBranchProof, jsxRenderReturnBranchProofs: input.jsxRenderReturnBranchProofs });
  const projectGraphDeltaWithConflicts = addProjectGraphDeltaConflictSummary(projectGraphDelta, deltaGraphConflicts);
  const diagnosticsConflicts = outputDiagnosticsGate?.conflicts ?? [];
  const declarationConflicts = outputDeclarationGate?.conflicts ?? [];
  const qualityConflicts = outputQualityGate?.conflicts ?? [];
  const proofConflicts = projectProofEvidenceConflicts(proofEvidence);
  const graphConflicts = [...outputGraphConflicts, ...deltaGraphConflicts];
  const outputConflicts = [...graphConflicts, ...diagnosticsConflicts, ...declarationConflicts, ...qualityConflicts, ...proofConflicts];
  const status = blockedFiles.length || outputConflicts.length ? 'blocked' : 'merged';
  const reasonCodes = uniqueStrings([
    ...blockedFiles.flatMap((file) => file.admission.reasonCodes),
    ...outputConflicts.map((conflict) => conflict.code)
  ]);
  const conflictKeys = uniqueStrings([
    ...fileResults.flatMap((file) => file.conflictKeys),
    ...outputConflicts.map((conflict) => conflict.details?.conflictKey)
  ]);
  const baseSummary = projectSummary(fileResults, graphConflicts, Boolean(projectGraphDelta), outputDiagnosticsGate, outputDeclarationGate, outputQualityGate, moveRenameSummary, proofEvidence, symbolRenameSummary, splitMergeSummary, graphArtifacts?.projectSymbolGraph);
  const evidenceContext = {
    fileResults,
    outputDiagnosticsGate,
    outputDeclarationGate,
    outputQualityGate,
    proofEvidence,
    hasProjectGraphEvidence: Boolean(projectGraphDeltaWithConflicts || graphArtifacts?.projectSymbolGraph)
  };
  const evidence = projectEvidence(id, status, baseSummary, evidenceContext);
  const confidence = projectConfidence(id, status, baseSummary, evidence, reasonCodes, conflictKeys, evidenceContext);
  const admissionRoutes = createProjectAdmissionRoutes({ status, fileResults, conflicts: [...fileResults.flatMap((file) => file.conflicts), ...outputConflicts], missingEvidence: confidence.missingEvidence });
  const admissionRouteSummary = projectAdmissionRouteSummary(admissionRoutes);
  const summary = projectSummaryWithConfidenceEvidence(baseSummary, evidence, confidence);
  const core = {
    kind: 'frontier.lang.jsTsProjectSafeMerge',
    version: 1,
    schema: 'frontier.lang.jsTsProjectSafeMerge.v1',
    id,
    status,
    files: fileResults,
    outputFiles,
    outputProjectImport: graphArtifacts?.projectImport,
    outputProjectSymbolGraph: graphArtifacts?.projectSymbolGraph,
    projectGraphDelta: projectGraphDeltaWithConflicts,
    outputDiagnosticsGate,
    outputDeclarationGate,
    declarationEmitParityProof,
    outputQualityGate,
    conflicts: [...fileResults.flatMap((file) => file.conflicts), ...outputConflicts],
    admission: {
      status: status === 'merged' ? 'auto-merge-candidate' : 'blocked',
      action: status === 'merged' ? 'apply-project' : 'human-review',
      reviewRequired: status !== 'merged',
      autoApplyCandidate: status === 'merged',
      autoMergeClaim: false,
      semanticEquivalenceClaim: proofEvidence.summary.semanticEquivalenceClaim === true,
      semanticEquivalenceLevel: proofEvidence.semanticEquivalenceLevel,
      proofEvidenceStatus: proofEvidence.status,
      proofEvidenceLevels: proofEvidence.summary.evidenceLevels,
      proofEvidenceIds: proofEvidence.records.map((record) => record.id),
      routes: admissionRoutes,
      routeSummary: admissionRouteSummary,
      reasonCodes,
      conflictKeys
    },
    proofEvidence,
    confidence,
    evidence,
    summary,
    metadata: compactRecord({
      workerChangeSetId: input.workerChangeSetId,
      headChangeSetId: input.headChangeSetId,
      projectRoot: input.projectRoot,
      filesInput: Array.isArray(input.files) ? 'records' : 'maps',
      outputProjectSymbolGraph: Boolean(graphArtifacts?.projectSymbolGraph),
      projectGraphDelta: Boolean(projectGraphDeltaWithConflicts),
      projectGraphConflicts: graphConflicts.length || undefined,
      outputProjectGraphConflicts: outputGraphConflicts.length || undefined, projectGraphCssModuleUseSiteConflicts: graphConflicts.filter((conflict) => conflict.gateId === 'project-css-module-use-site-graph').length || undefined,
      projectGraphDeltaConflicts: deltaGraphConflicts.length || undefined,
      projectGraphSourceSpanConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-source-span-delta-conflict').length || undefined,
      projectGraphCompilerTypeConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-public-compiler-type-delta-conflict').length || undefined,
      projectGraphRuntimeRegionConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-public-runtime-region-delta-conflict').length || undefined,
      projectGraphScopeUseDefConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-public-scope-use-def-delta-conflict' || conflict.code === 'project-public-scope-reference-delta-conflict').length || undefined,
      projectGraphJsxPropConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-jsx-public-prop-delta-conflict').length || undefined,
      projectGraphJsxRenderRiskConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-jsx-public-render-risk-delta-conflict').length || undefined,
      projectGraphModuleDeclarationShapeConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-module-declaration-shape-delta-conflict').length || undefined,
      projectGraphExportAssignmentShapeConflicts: deltaGraphConflicts.filter((conflict) => conflict.code === 'project-export-assignment-shape-delta-conflict').length || undefined,
      projectGraphLimitConflicts: graphConflicts.filter((conflict) => conflict.gateId === 'project-graph-limit').length || undefined,
      outputDiagnostics: outputDiagnosticsGate?.summary?.diagnostics || undefined,
      outputDiagnosticConflicts: diagnosticsConflicts.length || undefined,
      outputDiagnosticSource: outputDiagnosticsGate?.metadata?.diagnosticSource,
      outputCompilerOptions: outputDiagnosticsGate?.metadata?.compilerOptions,
      outputCompilerOptionSources: outputDiagnosticsGate?.metadata?.compilerOptionSources,
      outputProjectReferences: outputDiagnosticsGate?.metadata?.projectReferences,
      outputProjectReferenceCount: outputDiagnosticsGate?.metadata?.projectReferenceCount,
      outputDeclarations: outputDeclarationGate?.summary?.declarationFiles || undefined,
      outputDeclarationConflicts: declarationConflicts.length || undefined,
      declarationEmitParityProofStatus: declarationEmitParityProof?.status,
      declarationEmitParityProofReasonCodes: declarationEmitParityProof?.reasonCodes,
      outputQualityGateConflicts: qualityConflicts.length || undefined,
      proofEvidence: proofEvidence.summary,
      semanticEquivalenceLevel: proofEvidence.semanticEquivalenceLevel,
      confidenceScore: confidence.score,
      confidenceLevel: confidence.level,
      projectAdmissionRoutes: admissionRoutes.length || undefined,
      evidenceRecords: evidence.length || undefined,
      failedEvidenceRecords: evidence.filter((record) => record.status === 'failed').length || undefined,
      projectMoveRenameClassifications: moveRenameSummary.classifications || moveRenameSummary.symbolMoveAdmissions ? moveRenameSummary : undefined,
      projectSymbolRenameClassifications: symbolRenameSummary.classifications || symbolRenameSummary.admissions ? symbolRenameSummary : undefined,
      projectSplitMergeClassifications: splitMergeSummary.classifications || splitMergeSummary.splitMergeAdmissions ? splitMergeSummary : undefined,
      autoMergeClaim: false,
      semanticEquivalenceClaim: proofEvidence.summary.semanticEquivalenceClaim === true
    })
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function outputParserTriviaEvidence(file, resultFile) {
  if (!file) return undefined;
  if (file.outputParserTriviaEvidence) return file.outputParserTriviaEvidence;
  const workerText = file.workerDeleted ? undefined : file.workerSourceText ?? file.baseSourceText;
  return resultFile.outputHash && resultFile.outputHash === hashText(workerText)
    ? file.workerParserTriviaEvidence ?? file.parserTriviaEvidence
    : undefined;
}

function mergeProjectFile(file, input, projectId, projectSymbolRenames, projectCssModuleMergeEvidence) {
  const base = file.baseSourceText;
  const worker = file.workerDeleted ? undefined : file.workerSourceText ?? base;
  const head = file.headDeleted ? undefined : file.headSourceText ?? base;
  const context = { sourcePath: file.sourcePath, language: projectFileLanguage(file, input) };
  if (!file.sourcePath) return blockedFile(file, context, 'missing-source-path');
  const ambientBlock = maybeBlockAmbientProjectFile(file, context, input);
  if (ambientBlock) return ambientBlock;
  if (base === undefined && worker === undefined && head !== undefined) {
    return syntheticFile(file, context, head, 'head-only');
  }
  if (base === undefined && worker !== undefined && head === undefined) {
    return input.allowFileAdditions === false
      ? blockedFile(file, context, 'worker-file-addition-disabled')
      : syntheticFile(file, context, worker, 'worker-added');
  }
  if (base === undefined && worker !== undefined && head !== undefined) {
    return worker === head
      ? syntheticFile(file, context, worker, 'both-added-identical')
      : blockedFile(file, context, 'file-add-conflict');
  }
  if (base !== undefined && worker === undefined) {
    return input.allowFileDeletes
      ? syntheticFile(file, context, undefined, 'worker-deleted')
      : blockedFile(file, context, 'worker-file-delete-blocked');
  }
  if (base !== undefined && head === undefined) {
    return worker === base
      ? syntheticFile(file, context, undefined, 'head-deleted-worker-unchanged')
      : blockedFile(file, context, 'head-file-delete-conflict');
  }
  const nonJsTsMerge = maybeMergeHtmlCssProjectFile({ file, input, projectId, context, base, worker, head, sourceInput: sourceMergeInputForProjectFile(input), projectCssModuleMergeEvidence });
  if (nonJsTsMerge) return nonJsTsMerge;
  const result = safeMergeJsTsSource({
    ...sourceMergeInputForProjectFile(input),
    ...context,
    deferReExportIdentityConflictsToProjectGraph: input.includeProjectGraphDelta === true || input.includeOutputProjectSymbolGraph === true,
    deferTopLevelRenamePublicExportContractToProjectGraph: input.includeProjectGraphDelta === true || input.includeOutputProjectSymbolGraph === true,
    deferDirectExportRenamePublicContractToProjectSymbolRename: allowsProjectSymbolRenameForFile(input, projectSymbolRenames, file.sourcePath),
    id: `${projectId}_${safeId(file.sourcePath)}`,
    baseSourceText: base,
    workerSourceText: worker,
    headSourceText: head,
    sourceLedgers: sourceLedgersForFile(input, file.sourcePath),
    policy: file.policy ?? file.mergePolicy ?? policyForFile(input, file.sourcePath)
  });
  if (result.status !== 'merged') {
    if (base === worker && base === head) {
      return syntheticFile(file, context, base, 'unchanged-identical');
    }
    return maybeMergeImportSpecifierRemovalFile(file, context, result, input)
      ?? mergeBlockedFile(file, context, result);
  }
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'merged',
    operation: result.summary.memberAdditions ? 'merged-source-and-members' : 'merged-source',
    outputSourceText: result.mergedSourceText,
    outputHash: hashText(result.mergedSourceText),
    baseHash: hashText(base),
    workerHash: hashText(worker),
    headHash: hashText(head),
    result,
    semanticArtifacts: result.semanticArtifacts,
    conflicts: [],
    admission: result.admission,
    summary: result.summary,
    conflictKeys: [`source#${file.sourcePath}`]
  });
}

function allowsProjectSymbolRenameForFile(input, projectSymbolRenames, sourcePath) {
  return (input.allowProjectSymbolRenames === true || input.allowCrossFileSymbolRenames === true)
    && projectSymbolRenames?.byPath?.has(sourcePath);
}

function sourceMergeInputForProjectFile(input) {
  const { outputDiagnostics, outputSyntaxDiagnostics, mergedOutputSyntaxDiagnostics, syntaxDiagnostics, requireOutputSyntaxDiagnostics, requireOutputSyntaxGate, requireMergedOutputSyntaxDiagnostics, requireSyntaxGate, ...sourceInput } = input;
  return sourceInput;
}

function mergeBlockedFile(file, context, result) {
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: 'blocked-merge',
    result,
    conflicts: result.conflicts ?? [],
    admission: result.admission,
    summary: result.summary,
    conflictKeys: [`source#${file.sourcePath}`]
  });
}

export { safeMergeJsTsProject };
