import {
  compileNativeSource,
  createSemanticImportSidecar,
  createUniversalConversionPlan,
  importNativeSource,
  queryUniversalConversionPlan,
  writeUniversalAstJson
} from '../dist/index.js';
import {
  createTsToPythonWorkbenchAdapter,
  createTsToRustWorkbenchAdapter
} from './js-frontier-rust-workbench-adapters.mjs';
import { conversionBounds } from './js-frontier-rust-workbench-bounds.mjs';
import {
  explainRoute,
  routeExplanationSummary
} from './js-frontier-rust-workbench-route.mjs';

export function convertSource(source, options = {}) {
  const sourceLanguage = normalizeSourceLanguage(options.sourceLanguage);
  const targets = ['rust', 'python'];
  const imported = importNativeSource({
    language: sourceLanguage,
    sourcePath: `workbench/input.${sourceExtension(sourceLanguage)}`,
    sourceText: source
  });
  const targetAdapters = [createTsToRustWorkbenchAdapter(), createTsToPythonWorkbenchAdapter()];
  const projections = Object.fromEntries(targets.map((target) => {
    const projection = compileNativeSource(imported, {
      target,
      targetPath: `workbench/output.${targetExtension(target)}`,
      targetAdapters,
      emitOnBlocked: true
    });
    return [target, projectionSummary(projection, { sourceLanguage, target })];
  }));
  const conversionPlan = createUniversalConversionPlan({
    generatedAt: 0,
    imports: [imported],
    targetAdapters,
    targets
  });
  const routes = targets.map((target) => explainRoute(
    queryUniversalConversionPlan(conversionPlan, { sourceLanguage, target }).bestRoute,
    { projection: projections[target], sourceLanguage, target }
  ));
  const sidecar = createSemanticImportSidecar(imported, { generatedAt: 0, targetPath: projections.rust?.targetPath });
  return {
    sourceHash: imported.nativeSource.sourceHash,
    sourceLanguage,
    summary: {
      readiness: sidecar.summary.readiness,
      symbols: imported.semanticIndex.symbols.length,
      sourceMapMappings: imported.sourceMaps[0]?.mappings.length ?? 0,
      losses: imported.losses.length,
      patchHints: sidecar.patchHints.length
    },
    frontier: {
      universalAst: universalAstSummary(imported),
      semanticIndexId: imported.semanticIndex.id,
      sidecarId: sidecar.id,
      symbols: imported.semanticIndex.symbols.map(symbolSummary),
      relations: relationSummaries(imported),
      losses: imported.losses.map(lossSummary),
      patchHints: sidecar.patchHints.map((hint) => ({
        id: hint.id,
        readiness: hint.readiness,
        operations: hint.supportedOperations,
        ownershipKey: hint.ownershipKey
      }))
    },
    bounds: conversionBounds(sourceLanguage, targets.join('/')),
    routeExplanation: routeExplanationSummary(conversionPlan, routes),
    projection: projections.rust,
    projections
  };
}

function projectionSummary(projection, { sourceLanguage, target }) {
  return {
    target,
    targetLanguage: target,
    sourceLanguage,
    targetPath: projection.sourceMap?.targetPath,
    mode: projection.outputMode,
    readiness: projection.readiness.readiness,
    ok: projection.ok,
    output: projection.output,
    sourceMapMappings: projection.sourceMap?.mappings.length ?? 0,
    targetAdapter: projection.metadata?.targetProjectionAdapterId,
    evidence: (projection.evidence ?? []).map(evidenceSummary)
  };
}

function evidenceSummary(record) {
  return {
    id: record.id,
    kind: record.kind,
    status: record.status,
    summary: record.summary,
    adapterId: record.metadata?.adapterId
  };
}

function universalAstSummary(imported) {
  const summary = { valid: true, validationError: undefined };
  let parsed = imported.universalAst;
  try {
    parsed = JSON.parse(writeUniversalAstJson(imported.universalAst));
  } catch (error) {
    summary.valid = false;
    summary.validationError = String(error.message || error);
  }
  return {
    ...summary,
    kind: parsed.kind,
    id: parsed.id,
    nativeSources: parsed.nativeSources?.length ?? 0,
    semanticSymbols: parsed.semanticIndex?.symbols?.length ?? 0,
    sourceMaps: parsed.sourceMaps?.length ?? 0,
    layers: Object.keys(parsed.layers ?? {})
  };
}

function symbolSummary(symbol) {
  return {
    id: symbol.id,
    name: symbol.name,
    kind: symbol.kind,
    language: symbol.language,
    region: symbol.metadata?.ownershipRegionKind,
    ownershipKey: symbol.metadata?.ownershipRegionKey
  };
}

function relationSummaries(imported) {
  const names = new Map(imported.semanticIndex.symbols.map((symbol) => [symbol.id, symbol.name]));
  return imported.semanticIndex.relations.map((relation) => ({
    id: relation.id,
    predicate: relation.predicate,
    label: `${names.get(relation.sourceId) ?? relation.sourceId} ${relation.predicate} ${names.get(relation.targetId) ?? relation.targetId}`
  }));
}

function lossSummary(loss) {
  return { id: loss.id, kind: loss.kind, severity: loss.severity, message: loss.message };
}

function normalizeSourceLanguage(language) {
  return 'typescript';
}

function targetExtension(target) {
  if (target === 'rust') return 'rs';
  if (target === 'python') return 'py';
  return 'txt';
}

function sourceExtension(language) {
  return 'ts';
}
