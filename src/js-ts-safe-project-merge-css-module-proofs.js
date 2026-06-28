import { parseCssSemanticSheet } from '@shapeshift-labs/frontier-lang-css';
import { cssModuleGeneratedClassNameMapHash, cssModuleGeneratedClassNameMapProof } from './js-ts-safe-project-merge-css-module-generated-map.js';
import { isCssModulePath, projectCssModuleProofFiles, projectJsTsSourcesStable } from './js-ts-safe-project-merge-css-module-project-files.js';
import { cssModuleSourceMapIdentityProof } from './js-ts-safe-project-merge-css-module-source-map.js';
import { createJsTsProjectSafeMergeGraphArtifacts } from './js-ts-safe-project-merge-graph.js';
import { hashText, safeId } from './js-ts-safe-project-merge-core.js';
import { importNativeSource } from './internal/index-impl/importNativeSource.js';

const CssModuleContractProofGap = 'css-module-contract-source-proof-unproved';

function createProjectCssModuleMergeEvidence(input, files, projectId) {
  const cssModuleFiles = files.filter((file) => isCssModulePath(file.sourcePath));
  if (!cssModuleFiles.length || input.disableProjectCssModuleProofSynthesis === true) return undefined;
  const proofFiles = projectCssModuleProofFiles(files, input);
  if (!proofFiles.length || !projectJsTsSourcesStable(files, input)) return { status: 'blocked', reasonCode: 'css-module-js-ts-output-graph-unproved', graphsByPath: new Map(), graphArtifacts: undefined };
  const cssImports = proofFiles
    .filter((file) => isCssModulePath(file.sourcePath))
    .map((file) => cssModuleProofImport(input, file))
    .filter(Boolean);
  const graphArtifacts = createJsTsProjectSafeMergeGraphArtifacts({ ...input, includeOutputProjectSymbolGraph: true, outputProjectImports: cssImports }, proofFiles, `${projectId}_css_module_project_proof`);
  const graphs = graphArtifacts?.projectSymbolGraph?.cssModuleUseSiteGraphs ?? [];
  return { status: 'ready', graphsByPath: new Map(graphs.map((graph) => [graph.cssModuleSourcePath, graph])), graphArtifacts };
}

function projectCssModuleMergeOptionsForFile(evidence, sourcePath) {
  const graph = evidence?.graphsByPath?.get(sourcePath);
  if (!graph?.jsTsUseSiteGraphHash) return {};
  return {
    jsTsUseSiteGraphHash: graph.jsTsUseSiteGraphHash,
    projectCssModuleUseSiteGraphHash: graph.graphHash,
    projectCssModuleUseSiteGraphStatus: graph.status
  };
}

function projectCssModuleProofOptionsForBlockedMerge(input) {
  const { evidence, sourcePath, mergeOptions, firstResult, base, worker, head } = input;
  if (!isCssModulePath(sourcePath) || !firstResult?.candidateMergedSourceHash) return undefined;
  if (!hasOnlyCssModuleContractProofGap(firstResult)) return missingTransformProofBlockedResult(input);
  const graph = evidence?.graphsByPath?.get(sourcePath);
  const transformConflictResult = missingTransformProofBlockedResult(input);
  if (transformConflictResult) return transformConflictResult;
  if (graph?.status !== 'ready' || !graph.jsTsUseSiteGraphHash) return undefined;
  const generatedClassNameMapHash = cssModuleGeneratedClassNameMapHash(mergeOptions);
  if (!generatedClassNameMapHash) return undefined;
  const bundlerTransformHash = firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash);
  const sourceMapIdentityProof = cssModuleSourceMapIdentityProof(mergeOptions, {
    sourcePath,
    sourceHash: firstResult.candidateMergedSourceHash,
    outputSourceHash: firstResult.candidateMergedSourceHash,
    generatedClassNameMapHash,
    bundlerTransformHash,
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    ...cssModuleSourceMapProofContext(mergeOptions)
  });
  const sourceMapConflict = sourceMapProofConflict(firstResult.id, sourcePath, sourceMapIdentityProof);
  if (sourceMapConflict) return cssModuleProofBlockedResult(firstResult, [sourceMapConflict]);
  const proofHashes = cssModuleContractProofHashes({ sourcePath, base, worker, head, output: firstResult.candidateMergedSourceText, generatedClassNameMapHash, jsTsUseSiteGraphHash: graph.jsTsUseSiteGraphHash, mergeOptions });
  if (!proofHashes.length) return undefined;
  return {
    mergeOptions: {
      cssModuleContractProofs: proofHashes.map((proof, index) => ({
        id: `project_css_module_contract_${safeId(sourcePath)}_${index}`,
        kind: 'css-source-bound-module-contract-proof',
        status: 'passed',
        sourcePath,
        baseSourceHash: hashText(base),
        workerSourceHash: hashText(worker),
        headSourceHash: hashText(head),
        outputSourceHash: firstResult.candidateMergedSourceHash,
        moduleHash: proof.moduleHash,
        generatedClassNameMapHash,
        jsTsUseSiteGraphHash: graph.jsTsUseSiteGraphHash,
        cssModuleCompositionGraphHash: proof.cssModuleCompositionGraphHash,
        icssGraphHash: proof.icssGraphHash,
        bundlerTransformHash,
        sourceMapProofHash: sourceMapIdentityProof.sourceMapProofHash,
        proofLevel: 'css-module-contract-project-source-bound'
      }))
    }
  };
}

function projectCssModuleOutputProjectImports(evidence, fileResults, input) {
  if (!evidence) return [];
  return fileResults
    .filter((file) => file.status === 'merged' && isCssModulePath(file.sourcePath) && typeof file.outputSourceText === 'string')
    .map((file) => cssModuleOutputProjectImport(evidence, file, input))
    .filter(Boolean);
}

function mergeOutputProjectImports(input, imports) {
  if (!imports.length) return input;
  return {
    ...input,
    outputProjectImports: [...normalizeProjectImports(input.outputProjectImports ?? input.projectGraphImports?.output), ...imports]
  };
}

function missingTransformProofBlockedResult({ firstResult, sourcePath, mergeOptions }) {
  if (!firstResult || !hasOnlyCssModuleContractProofGap(firstResult)) return undefined;
  const conflicts = [];
  const generatedClassNameMapProof = cssModuleGeneratedClassNameMapProof(mergeOptions);
  if (generatedClassNameMapProof.status === 'hash-mismatch') {
    conflicts.push(cssModuleProofConflict(firstResult.id, sourcePath, 'css-module-generated-class-map-hash-mismatch', {
      proofBoundary: 'css-module-generated-class-name-map',
      declaredGeneratedClassNameMapHash: generatedClassNameMapProof.declaredGeneratedClassNameMapHash,
      computedGeneratedClassNameMapHash: generatedClassNameMapProof.computedGeneratedClassNameMapHash
    }));
  }
  if (!firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash)) {
    conflicts.push(cssModuleProofConflict(firstResult.id, sourcePath, 'css-module-bundler-transform-identity-unproved'));
  }
  const sourceMapIdentityProof = cssModuleSourceMapIdentityProof(mergeOptions, {
    sourcePath,
    generatedClassNameMapHash: generatedClassNameMapProof.generatedClassNameMapHash,
    bundlerTransformHash: firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash),
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    ...cssModuleSourceMapProofContext(mergeOptions)
  });
  const sourceMapConflict = sourceMapProofConflict(firstResult.id, sourcePath, sourceMapIdentityProof);
  if (sourceMapConflict) conflicts.push(sourceMapConflict);
  return cssModuleProofBlockedResult(firstResult, conflicts);
}

function sourceMapProofConflict(id, sourcePath, proof) {
  if (proof.status === 'failed') return cssModuleProofConflict(id, sourcePath, 'css-module-source-map-proof-hash-mismatch', {
    sourceMapIdentityProofStatus: proof.status,
    sourceMapIdentityProofReasonCodes: proof.reasonCodes,
    computedSourceMapProofHash: proof.computedSourceMapProofHash
  });
  return proof.sourceMapProofHash ? undefined : cssModuleProofConflict(id, sourcePath, 'css-module-source-map-proof-unproved');
}

function cssModuleProofBlockedResult(firstResult, conflicts) {
  if (!conflicts.length) return undefined;
  const mergedConflicts = [...(firstResult.conflicts ?? []), ...conflicts];
  return {
    result: {
      ...firstResult,
      conflicts: mergedConflicts,
      admission: {
        ...(firstResult.admission ?? {}),
        reasonCodes: uniqueStrings([
          ...(firstResult.admission?.reasonCodes ?? []),
          ...conflicts.map((conflict) => conflict.details.reasonCode)
        ])
      }
    }
  };
}

function cssModuleContractProofHashes(input) {
  const options = {
    sourcePath: input.sourcePath,
    generatedClassNameMapHash: input.generatedClassNameMapHash,
    jsTsUseSiteGraphHash: input.jsTsUseSiteGraphHash,
    cssModuleCompositionGraphHash: firstString(input.mergeOptions.cssModuleCompositionGraphHash),
    icssGraphHash: firstString(input.mergeOptions.icssGraphHash)
  };
  const sheets = [
    parseCssModuleSheet(input.base, options),
    parseCssModuleSheet(input.worker, options),
    parseCssModuleSheet(input.head, options),
    parseCssModuleSheet(input.output, options)
  ].filter(Boolean);
  const hashes = new Map();
  for (const sheet of sheets) {
    const cssModules = sheet.cssModules;
    if (!cssModules?.moduleHash) continue;
    hashes.set(cssModules.moduleHash, {
      moduleHash: cssModules.moduleHash,
      cssModuleCompositionGraphHash: cssModules.cssModuleCompositionGraphHash,
      icssGraphHash: cssModules.icssGraphHash
    });
  }
  return [...hashes.values()];
}

function parseCssModuleSheet(sourceText, options) {
  if (typeof sourceText !== 'string') return undefined;
  try {
    return parseCssSemanticSheet(sourceText, options);
  } catch {
    return undefined;
  }
}

function hasOnlyCssModuleContractProofGap(result) {
  const conflicts = result?.conflicts ?? [];
  return conflicts.length > 0 && conflicts.every((conflict) => conflict.details?.reasonCode === CssModuleContractProofGap);
}

function cssModuleProofImport(input, file) {
  const mergeOptions = cssMergeOptionsForProjectFile(input, file.sourcePath);
  const generatedClassNameMapProof = cssModuleGeneratedClassNameMapProof(mergeOptions);
  const bundlerTransformHash = firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash);
  const sourceMapIdentityProof = cssModuleSourceMapIdentityProof(mergeOptions, {
    sourcePath: file.sourcePath,
    generatedClassNameMapHash: generatedClassNameMapProof.generatedClassNameMapHash,
    bundlerTransformHash,
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    ...cssModuleSourceMapProofContext(mergeOptions)
  });
  return importNativeSource({
    language: 'css',
    sourcePath: file.sourcePath,
    sourceText: file.sourceText,
    sourceHash: file.sourceHash,
    metadata: {
      generatedClassNameMap: generatedClassNameMapProof.generatedClassNameMap,
      generatedClassNameMapHash: generatedClassNameMapProof.generatedClassNameMapHash,
      cssModuleCompositionGraphHash: mergeOptions.cssModuleCompositionGraphHash,
      icssGraphHash: mergeOptions.icssGraphHash,
      bundlerTransformHash,
      sourceMapProofHash: sourceMapIdentityProof.sourceMapProofHash,
      sourceMapIdentityProofStatus: sourceMapIdentityProof.status,
      sourceMapIdentityProofReasonCodes: sourceMapIdentityProof.reasonCodes
    }
  });
}

function cssModuleOutputProjectImport(evidence, file, input) {
  const mergeOptions = cssMergeOptionsForProjectFile(input, file.sourcePath);
  const graph = evidence.graphsByPath?.get(file.sourcePath);
  const proof = file.result?.cssModuleContractProofs?.[0] ?? file.result?.admission?.cssModuleContractProofs?.[0];
  const generatedClassNameMapProof = cssModuleGeneratedClassNameMapProof(mergeOptions);
  const bundlerTransformHash = firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash);
  const sourceMapIdentityProof = cssModuleSourceMapIdentityProof(mergeOptions, {
    sourcePath: file.sourcePath,
    sourceHash: file.outputHash,
    outputSourceHash: file.outputHash,
    generatedClassNameMapHash: proof?.generatedClassNameMapHash ?? generatedClassNameMapProof.generatedClassNameMapHash,
    bundlerTransformHash,
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    ...cssModuleSourceMapProofContext(mergeOptions)
  });
  return importNativeSource({
    language: 'css',
    sourcePath: file.sourcePath,
    sourceText: file.outputSourceText,
    sourceHash: file.outputHash,
    metadata: {
      generatedClassNameMap: generatedClassNameMapProof.generatedClassNameMap,
      generatedClassNameMapHash: generatedClassNameMapProof.status === 'hash-mismatch'
        ? undefined
        : proof?.generatedClassNameMapHash ?? generatedClassNameMapProof.generatedClassNameMapHash,
      jsTsUseSiteGraphHash: proof?.jsTsUseSiteGraphHash ?? graph?.jsTsUseSiteGraphHash,
      cssModuleCompositionGraphHash: proof?.cssModuleCompositionGraphHash ?? mergeOptions.cssModuleCompositionGraphHash,
      icssGraphHash: proof?.icssGraphHash ?? mergeOptions.icssGraphHash,
      bundlerTransformHash,
      sourceMapProofHash: sourceMapIdentityProof.sourceMapProofHash,
      sourceMapIdentityProofStatus: sourceMapIdentityProof.status,
      sourceMapIdentityProofReasonCodes: sourceMapIdentityProof.reasonCodes
    }
  });
}

function normalizeProjectImports(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value instanceof Map) return [...value.values()].filter(Boolean);
  if (typeof value === 'object') return Object.values(value).filter(Boolean);
  return [];
}

function cssMergeOptionsForProjectFile(input, sourcePath) {
  const byPath = input.cssMergeOptionsByPath ?? input.styleMergeOptionsByPath;
  return {
    ...(input.cssMergeOptions ?? input.styleMergeOptions),
    ...(byPath?.[sourcePath] ?? {})
  };
}

function cssModuleSourceMapProofContext(mergeOptions) {
  return {
    loaderRequestHash: firstString(mergeOptions.loaderRequestHash, mergeOptions.cssModuleLoaderRequestHash),
    loaderQueryHash: firstString(mergeOptions.loaderQueryHash, mergeOptions.cssModuleLoaderQueryHash),
    sourceMapArtifactHash: firstString(mergeOptions.sourceMapArtifactHash, mergeOptions.cssModuleSourceMapArtifactHash, mergeOptions.cssModuleSourceMapHash),
    sourcesContentHash: firstString(mergeOptions.sourcesContentHash, mergeOptions.sourceMapSourcesContentHash, mergeOptions.cssModuleSourceMapSourcesContentHash)
  };
}

function cssModuleProofConflict(id, sourcePath, reasonCode, details = {}) {
  const { proofBoundary = cssModuleProofBoundaryForReason(reasonCode), ...extraDetails } = details;
  return {
    code: 'css-module-project-proof-blocked',
    gateId: 'css-semantic-merge',
    sourcePath,
    details: {
      reasonCode,
      conflictKey: `css#${id}#${reasonCode}#${sourcePath ?? 'source'}`,
      ...(proofBoundary ? { proofBoundary } : {}),
      ...extraDetails,
      proofGap: {
        code: reasonCode,
        status: 'not-claimed',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    }
  };
}

function cssModuleProofBoundaryForReason(reasonCode) {
  if (reasonCode === 'css-module-generated-class-map-hash-mismatch' || reasonCode === 'css-module-generated-class-map-unproved') return 'css-module-generated-class-name-map';
  if (reasonCode === 'css-module-bundler-transform-identity-unproved') return 'css-module-bundler-transform-identity';
  if (reasonCode === 'css-module-source-map-proof-unproved' || reasonCode === 'css-module-source-map-proof-hash-mismatch') return 'css-module-source-map-identity';
  return undefined;
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { createProjectCssModuleMergeEvidence, mergeOutputProjectImports, projectCssModuleMergeOptionsForFile, projectCssModuleOutputProjectImports, projectCssModuleProofOptionsForBlockedMerge };
