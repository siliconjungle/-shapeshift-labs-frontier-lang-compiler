import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function withProjectCssModuleDependencyGraphs(cssSourcesByPath) {
  const enriched = new Map(cssSourcesByPath);
  for (const [sourcePath, cssSource] of cssSourcesByPath.entries()) {
    const cssModuleEvidence = cssSource?.cssModuleEvidence;
    if (!cssModuleEvidence || cssSource.cssModuleEvidenceSource !== 'inferred-source') continue;
    const computedCompositionGraphHash = cssModuleEvidence.cssModuleCompositionGraphHash
      ? undefined
      : projectCssModuleCompositionGraphHash(sourcePath, enriched);
    const computedIcssGraphHash = cssModuleEvidence.icssGraphHash
      ? undefined
      : projectCssModuleIcssGraphHash(sourcePath, enriched);
    if (!computedCompositionGraphHash && !computedIcssGraphHash) continue;
    enriched.set(sourcePath, {
      ...cssSource,
      cssModuleEvidence: {
        ...cssModuleEvidence,
        cssModuleCompositionGraphHash: computedCompositionGraphHash ?? cssModuleEvidence.cssModuleCompositionGraphHash,
        cssModuleCompositionGraphSource: computedCompositionGraphHash ? 'project-source' : cssModuleEvidence.cssModuleCompositionGraphSource,
        icssGraphHash: computedIcssGraphHash ?? cssModuleEvidence.icssGraphHash,
        icssGraphSource: computedIcssGraphHash ? 'project-source' : cssModuleEvidence.icssGraphSource,
        proofGaps: cssModuleProofGapsWithout(cssModuleEvidence.proofGaps, [
          ...(computedCompositionGraphHash ? ['css-module-composition-resolution-unproved'] : []),
          ...(computedIcssGraphHash ? ['css-module-icss-graph-unproved'] : [])
        ])
      }
    });
  }
  return enriched;
}

function projectCssModuleCompositionGraphHash(sourcePath, cssSourcesByPath) {
  const source = projectCssModuleSource(sourcePath, cssSourcesByPath);
  const compositions = cssModuleCompositions(source?.cssModuleEvidence);
  if (!compositions.length) return undefined;
  const graph = {
    sources: new Map(),
    edges: []
  };
  if (!visitCssModuleCompositionSource(sourcePath, cssSourcesByPath, graph, [])) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.css.modules.projectCompositionGraph.v1',
    rootSourcePath: sourcePath,
    sources: sortedValues(graph.sources),
    edges: graph.edges.sort(stableRecordCompare)
  });
}

function visitCssModuleCompositionSource(sourcePath, cssSourcesByPath, graph, stack) {
  if (graph.sources.has(sourcePath)) return true;
  if (stack.includes(sourcePath)) return false;
  const cssSource = projectCssModuleSource(sourcePath, cssSourcesByPath);
  const evidence = cssSource?.cssModuleEvidence;
  if (!evidence) return false;
  const exportNames = cssModuleExportNames(evidence);
  graph.sources.set(sourcePath, {
    sourcePath,
    sourceHash: evidence.sourceHash ?? cssSource.sourceHash,
    moduleHash: evidence.moduleHash,
    exportNames
  });
  for (const composition of cssModuleCompositions(evidence)) {
    const sourceKind = composition.sourceKind ?? (composition.source ? 'file' : 'local');
    if (sourceKind === 'file') {
      const targetSourcePath = resolveRelativeCssSourcePath(sourcePath, composition.source);
      const target = projectCssModuleSource(targetSourcePath, cssSourcesByPath);
      if (!target) return false;
      const targetExportNames = cssModuleExportNames(target.cssModuleEvidence);
      if (composition.names?.some((name) => !targetExportNames.includes(name))) return false;
      graph.edges.push(compositionGraphEdge(composition, {
        sourcePath,
        sourceKind,
        targetSourcePath,
        targetSourceHash: target.cssModuleEvidence?.sourceHash ?? target.sourceHash,
        targetModuleHash: target.cssModuleEvidence?.moduleHash
      }));
      if (!visitCssModuleCompositionSource(targetSourcePath, cssSourcesByPath, graph, [...stack, sourcePath])) return false;
      continue;
    }
    if (sourceKind !== 'local' && sourceKind !== 'global') return false;
    graph.edges.push(compositionGraphEdge(composition, { sourcePath, sourceKind }));
  }
  return true;
}

function projectCssModuleIcssGraphHash(sourcePath, cssSourcesByPath) {
  const source = projectCssModuleSource(sourcePath, cssSourcesByPath);
  const evidence = source?.cssModuleEvidence;
  if (!cssModuleIcssImports(evidence).length && !cssModuleIcssExports(evidence).length) return undefined;
  const graph = {
    sources: new Map(),
    imports: [],
    exports: []
  };
  if (!visitCssModuleIcssSource(sourcePath, cssSourcesByPath, graph, [])) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.css.modules.projectIcssGraph.v1',
    rootSourcePath: sourcePath,
    sources: sortedValues(graph.sources),
    imports: graph.imports.sort(stableRecordCompare),
    exports: graph.exports.sort(stableRecordCompare)
  });
}

function visitCssModuleIcssSource(sourcePath, cssSourcesByPath, graph, stack) {
  if (graph.sources.has(sourcePath)) return true;
  if (stack.includes(sourcePath)) return false;
  const cssSource = projectCssModuleSource(sourcePath, cssSourcesByPath);
  const evidence = cssSource?.cssModuleEvidence;
  if (!evidence) return false;
  graph.sources.set(sourcePath, {
    sourcePath,
    sourceHash: evidence.sourceHash ?? cssSource.sourceHash,
    moduleHash: evidence.moduleHash,
    icssExportNames: cssModuleIcssExportNames(evidence)
  });
  for (const exported of cssModuleIcssExports(evidence)) {
    graph.exports.push({
      sourcePath,
      name: exported.name,
      value: exported.value,
      exportHash: exported.exportHash
    });
  }
  for (const imported of cssModuleIcssImports(evidence)) {
    const targetSourcePath = resolveRelativeCssSourcePath(sourcePath, imported.source);
    const target = projectCssModuleSource(targetSourcePath, cssSourcesByPath);
    if (!target) return false;
    const targetExportNames = cssModuleIcssExportNames(target.cssModuleEvidence);
    if (!targetExportNames.includes(imported.importedName)) return false;
    graph.imports.push({
      sourcePath,
      targetSourcePath,
      targetSourceHash: target.cssModuleEvidence?.sourceHash ?? target.sourceHash,
      targetModuleHash: target.cssModuleEvidence?.moduleHash,
      importedName: imported.importedName,
      localName: imported.localName,
      importHash: imported.importHash
    });
    if (!visitCssModuleIcssSource(targetSourcePath, cssSourcesByPath, graph, [...stack, sourcePath])) return false;
  }
  return true;
}

function projectCssModuleSource(sourcePath, cssSourcesByPath) {
  if (!sourcePath) return undefined;
  const cssSource = cssSourcesByPath.get(sourcePath);
  if (!cssSource?.cssModuleEvidence || cssSource.cssModuleEvidenceSource !== 'inferred-source') return undefined;
  return cssSource;
}

function compositionGraphEdge(composition, extra) {
  return {
    sourcePath: extra.sourcePath,
    localName: composition.localName,
    names: [...(composition.names ?? [])],
    source: composition.source,
    sourceKind: extra.sourceKind,
    targetSourcePath: extra.targetSourcePath,
    targetSourceHash: extra.targetSourceHash,
    targetModuleHash: extra.targetModuleHash,
    compositionHash: composition.compositionHash
  };
}

function resolveRelativeCssSourcePath(sourcePath, specifier) {
  if (!sourcePath || !specifier || !String(specifier).startsWith('.')) return undefined;
  const cleanSpecifier = String(specifier).split(/[?#]/)[0];
  const parts = String(sourcePath).split('/');
  parts.pop();
  for (const part of cleanSpecifier.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) return undefined;
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join('/');
}

function cssModuleCompositions(evidence) {
  return arrayValue(evidence?.compositions);
}

function cssModuleIcssImports(evidence) {
  return [
    ...arrayValue(evidence?.icssImports),
    ...arrayValue(evidence?.icss?.imports)
  ];
}

function cssModuleIcssExports(evidence) {
  return [
    ...arrayValue(evidence?.icssExports),
    ...arrayValue(evidence?.icss?.exports)
  ];
}

function cssModuleExportNames(evidence) {
  return uniqueSortedStrings([
    ...arrayValue(evidence?.exportNames),
    ...arrayValue(evidence?.localClassNames),
    ...arrayValue(evidence?.classNames),
    ...cssModuleExportRecordNames(evidence?.exports),
    ...objectKeys(evidence?.exports),
    ...objectKeys(evidence?.generatedClassNameMap),
    ...objectKeys(evidence?.classMap)
  ]);
}

function cssModuleIcssExportNames(evidence) {
  return uniqueSortedStrings([
    ...arrayValue(evidence?.icssExportNames),
    ...cssModuleExportRecordNames(evidence?.icssExports),
    ...objectKeys(evidence?.icssExports),
    ...cssModuleExportRecordNames(evidence?.icss?.exports),
    ...objectKeys(evidence?.icss?.exports)
  ]);
}

function cssModuleExportRecordNames(value) {
  return Array.isArray(value)
    ? value.map((entry) => entry?.name ?? entry?.localName ?? entry?.exportedName).filter(Boolean)
    : [];
}

function cssModuleProofGapsWithout(proofGaps, codes) {
  const remove = new Set(codes);
  return arrayValue(proofGaps).filter((gap) => !remove.has(gap?.code));
}

function sortedValues(map) {
  return [...map.values()].sort(stableRecordCompare);
}

function stableRecordCompare(left, right) {
  return JSON.stringify(left).localeCompare(JSON.stringify(right));
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function objectKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : [];
}

function uniqueSortedStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort();
}

export { withProjectCssModuleDependencyGraphs };
