import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { parseCssSemanticSheet } from '@shapeshift-labs/frontier-lang-css';
import { createJsTsProjectSafeMergeGraphArtifacts } from './js-ts-safe-project-merge-graph.js';
import { hashText, safeId } from './js-ts-safe-project-merge-core.js';
import { importNativeSource } from './internal/index-impl/importNativeSource.js';

const CssModulePathPattern = /\.module\.css(?:[?#].*)?$/i;
const CssModuleContractProofGap = 'css-module-contract-source-proof-unproved';

function createProjectCssModuleMergeEvidence(input, files, projectId) {
  const cssModuleFiles = files.filter((file) => isCssModulePath(file.sourcePath));
  if (!cssModuleFiles.length || input.disableProjectCssModuleProofSynthesis === true) return undefined;
  const proofFiles = projectCssModuleProofFiles(files, input);
  if (!proofFiles.length || !projectJsTsSourcesStable(files, input)) return {
    status: 'blocked',
    reasonCode: 'css-module-js-ts-output-graph-unproved',
    graphsByPath: new Map(),
    graphArtifacts: undefined
  };
  const cssImports = proofFiles
    .filter((file) => isCssModulePath(file.sourcePath))
    .map((file) => cssModuleProofImport(input, file))
    .filter(Boolean);
  const graphArtifacts = createJsTsProjectSafeMergeGraphArtifacts({
    ...input,
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: cssImports
  }, proofFiles, `${projectId}_css_module_project_proof`);
  const graphs = graphArtifacts?.projectSymbolGraph?.cssModuleUseSiteGraphs ?? [];
  return {
    status: 'ready',
    graphsByPath: new Map(graphs.map((graph) => [graph.cssModuleSourcePath, graph])),
    graphArtifacts
  };
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
  const proofHashes = cssModuleContractProofHashes({
    sourcePath,
    base,
    worker,
    head,
    output: firstResult.candidateMergedSourceText,
    generatedClassNameMapHash,
    jsTsUseSiteGraphHash: graph.jsTsUseSiteGraphHash,
    mergeOptions
  });
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
        bundlerTransformHash: firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash),
        sourceMapProofHash: firstString(mergeOptions.sourceMapProofHash, mergeOptions.cssModuleSourceMapProofHash),
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
  if (!firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash)) {
    conflicts.push(cssModuleProofConflict(firstResult.id, sourcePath, 'css-module-bundler-transform-identity-unproved'));
  }
  if (!firstString(mergeOptions.sourceMapProofHash, mergeOptions.cssModuleSourceMapProofHash)) {
    conflicts.push(cssModuleProofConflict(firstResult.id, sourcePath, 'css-module-source-map-proof-unproved'));
  }
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

function cssModuleGeneratedClassNameMapHash(mergeOptions) {
  return firstString(mergeOptions.generatedClassNameMapHash, mergeOptions.cssModuleGeneratedClassNameMapHash)
    ?? (mergeOptions.generatedClassNameMap ? hashSemanticValue({
      kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
      generatedClassNameMap: mergeOptions.generatedClassNameMap
    }) : undefined);
}

function hasOnlyCssModuleContractProofGap(result) {
  const conflicts = result?.conflicts ?? [];
  return conflicts.length > 0 && conflicts.every((conflict) => conflict.details?.reasonCode === CssModuleContractProofGap);
}

function cssModuleProofImport(input, file) {
  const mergeOptions = cssMergeOptionsForProjectFile(input, file.sourcePath);
  return importNativeSource({
    language: 'css',
    sourcePath: file.sourcePath,
    sourceText: file.sourceText,
    sourceHash: file.sourceHash,
    metadata: {
      generatedClassNameMap: mergeOptions.generatedClassNameMap,
      generatedClassNameMapHash: cssModuleGeneratedClassNameMapHash(mergeOptions),
      cssModuleCompositionGraphHash: mergeOptions.cssModuleCompositionGraphHash,
      icssGraphHash: mergeOptions.icssGraphHash,
      bundlerTransformHash: firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash),
      sourceMapProofHash: firstString(mergeOptions.sourceMapProofHash, mergeOptions.cssModuleSourceMapProofHash)
    }
  });
}

function cssModuleOutputProjectImport(evidence, file, input) {
  const mergeOptions = cssMergeOptionsForProjectFile(input, file.sourcePath);
  const graph = evidence.graphsByPath?.get(file.sourcePath);
  const proof = file.result?.cssModuleContractProofs?.[0] ?? file.result?.admission?.cssModuleContractProofs?.[0];
  return importNativeSource({
    language: 'css',
    sourcePath: file.sourcePath,
    sourceText: file.outputSourceText,
    sourceHash: file.outputHash,
    metadata: {
      generatedClassNameMap: mergeOptions.generatedClassNameMap,
      generatedClassNameMapHash: proof?.generatedClassNameMapHash ?? cssModuleGeneratedClassNameMapHash(mergeOptions),
      jsTsUseSiteGraphHash: proof?.jsTsUseSiteGraphHash ?? graph?.jsTsUseSiteGraphHash,
      cssModuleCompositionGraphHash: proof?.cssModuleCompositionGraphHash ?? mergeOptions.cssModuleCompositionGraphHash,
      icssGraphHash: proof?.icssGraphHash ?? mergeOptions.icssGraphHash,
      bundlerTransformHash: firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash),
      sourceMapProofHash: firstString(mergeOptions.sourceMapProofHash, mergeOptions.cssModuleSourceMapProofHash)
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

function projectCssModuleProofFiles(files, input) {
  return files.flatMap((file) => {
    const sourceText = isCssModulePath(file.sourcePath)
      ? cssModuleProofSourceText(file)
      : stableJsTsSourceText(file, input);
    if (typeof sourceText !== 'string') return [];
    return [{
      sourcePath: file.sourcePath,
      language: file.language ?? languageForPath(file.sourcePath, input),
      sourceText,
      sourceHash: hashText(sourceText)
    }];
  });
}

function projectJsTsSourcesStable(files, input) {
  return files
    .filter((file) => isJsTsLanguage(file.language ?? languageForPath(file.sourcePath, input)))
    .every((file) => typeof stableJsTsSourceText(file, input) === 'string');
}

function cssModuleProofSourceText(file) {
  return firstString(file.workerSourceText, file.headSourceText, file.baseSourceText);
}

function stableJsTsSourceText(file, input) {
  if (!isJsTsLanguage(file.language ?? languageForPath(file.sourcePath, input))) return undefined;
  const base = file.baseSourceText;
  const worker = file.workerDeleted ? undefined : file.workerSourceText ?? base;
  const head = file.headDeleted ? undefined : file.headSourceText ?? base;
  if (typeof worker === 'string' && worker === head) return worker;
  if (typeof base === 'string' && base === worker && base === head) return base;
  return undefined;
}

function cssMergeOptionsForProjectFile(input, sourcePath) {
  const byPath = input.cssMergeOptionsByPath ?? input.styleMergeOptionsByPath;
  return {
    ...(input.cssMergeOptions ?? input.styleMergeOptions),
    ...(byPath?.[sourcePath] ?? {})
  };
}

function cssModuleProofConflict(id, sourcePath, reasonCode) {
  return {
    code: 'css-module-project-proof-blocked',
    gateId: 'css-semantic-merge',
    sourcePath,
    details: {
      reasonCode,
      conflictKey: `css#${id}#${reasonCode}#${sourcePath ?? 'source'}`,
      proofGap: {
        code: reasonCode,
        status: 'not-claimed',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    }
  };
}

function isCssModulePath(path) {
  return CssModulePathPattern.test(String(path ?? ''));
}

function languageForPath(sourcePath, input) {
  const path = String(sourcePath ?? '').toLowerCase();
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.ts') || path.endsWith('.mts') || path.endsWith('.cts')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return input.language;
}

function isJsTsLanguage(language) {
  return ['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts'].includes(String(language ?? '').toLowerCase());
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { createProjectCssModuleMergeEvidence, mergeOutputProjectImports, projectCssModuleMergeOptionsForFile, projectCssModuleOutputProjectImports, projectCssModuleProofOptionsForBlockedMerge };
