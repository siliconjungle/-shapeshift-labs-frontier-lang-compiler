import { countBy, uniqueStrings } from './native-import-utils.js';
import { summarizeImportSourcePreservation } from './semantic-import-source-preservation.js';

export const SemanticGraphLayerKinds = Object.freeze([
  'parser-source-span-trivia',
  'scope-use-def',
  'module-export-import',
  'type-public-api',
  'control-flow-effect',
  'generic-semantic-edit-admission'
]);

export function createSemanticGraphLayerSummary(input = {}) {
  const imports = input.imports ?? [];
  const symbols = input.symbols ?? [];
  const ownershipRegions = input.ownershipRegions ?? [];
  const dependencies = input.dependencies ?? {};
  const sourceMaps = input.sourceMaps ?? [];
  const sourceMapMappings = input.sourceMapMappings ?? [];
  const sourcePreservationDetails = input.sourcePreservationDetails
    ?? (imports.length ? summarizeImportSourcePreservation(input.importResult, imports) : emptySourcePreservationDetails());
  const sourcePreservation = input.sourcePreservation ?? {};
  const layers = {
    parserSourceSpanTrivia: parserSourceSpanTriviaLayer({ sourcePreservation, sourcePreservationDetails, sourceMapMappings, sourceMaps, universalAstLayers: input.universalAstLayers }),
    scopeUseDef: scopeUseDefLayer({ symbols, dependencies, paradigmSemantics: input.paradigmSemantics }),
    moduleExportImport: moduleExportImportLayer({ symbols, dependencies }),
    typePublicApi: typePublicApiLayer({ symbols, ownershipRegions, proofSpec: input.proofSpec }),
    controlFlowEffect: controlFlowEffectLayer({ ownershipRegions, dependencies, paradigmSemantics: input.paradigmSemantics, semanticImpact: input.semanticImpact }),
    genericSemanticEditAdmission: genericSemanticEditAdmissionLayer({ patchHints: input.patchHints, quality: input.quality, admission: input.admission, mergeCandidates: input.mergeCandidates, readiness: input.readiness })
  };
  const layerList = Object.values(layers);
  const byStatus = countBy(layerList.map((layer) => layer.status));
  return {
    kind: 'frontier.lang.semanticGraphLayers',
    version: 1,
    schema: 'frontier.lang.semanticGraphLayers.v1',
    status: summaryStatus(layerList),
    layerKinds: SemanticGraphLayerKinds,
    layers,
    summary: {
      total: layerList.length,
      strong: byStatus.strong ?? 0,
      partial: byStatus.partial ?? 0,
      missing: byStatus.missing ?? 0,
      blocked: byStatus.blocked ?? 0,
      usable: layerList.filter((layer) => layer.status === 'strong' || layer.status === 'partial').length,
      reasonCodes: uniqueStrings(layerList.flatMap((layer) => layer.reasonCodes ?? [])),
      evidenceIds: uniqueStrings(layerList.flatMap((layer) => layer.evidenceIds ?? []))
    },
    metadata: {
      note: 'Graph layers summarize available semantic evidence for admission. They are not semantic-equivalence proof.'
    }
  };
}

function parserSourceSpanTriviaLayer(input) {
  const exact = input.sourcePreservation?.exact ?? 0;
  const declaration = input.sourcePreservation?.declaration ?? 0;
  const estimated = input.sourcePreservation?.estimated ?? 0;
  const blocked = input.sourcePreservation?.blocked ?? 0;
  const sourceMapMappings = input.sourceMapMappings?.length ?? input.sourcePreservation?.sourceMapMappingIds?.length ?? 0;
  const trivia = input.sourcePreservationDetails?.trivia ?? 0;
  const comments = input.sourcePreservationDetails?.comments ?? 0;
  const directives = input.sourcePreservationDetails?.directives ?? 0;
  return graphLayer({
    id: 'parser-source-span-trivia',
    title: 'Parser, source span, and trivia evidence',
    status: blocked ? 'blocked' : exact && sourceMapMappings ? 'strong' : exact || declaration || estimated || sourceMapMappings || trivia ? 'partial' : 'missing',
    summary: { exact, declaration, estimated, blocked, sourceMaps: input.sourceMaps?.length ?? 0, sourceMapMappings, trivia, comments, directives, universalAstLayers: input.universalAstLayers?.total ?? 0 },
    reasonCodes: [
      ...(!exact ? ['missing-exact-source-preservation'] : []),
      ...(!sourceMapMappings ? ['missing-source-map-mappings'] : []),
      ...(!trivia ? ['missing-token-trivia-evidence'] : []),
      ...(blocked ? ['blocked-source-preservation'] : [])
    ],
    evidenceIds: input.sourcePreservation?.ids
  });
}

function scopeUseDefLayer(input) {
  const bindings = input.paradigmSemantics?.bindings ?? 0;
  const bindingScopes = input.paradigmSemantics?.bindingScopes ?? 0;
  const uses = input.dependencies?.uses ?? 0;
  const references = input.dependencies?.references ?? 0;
  const calls = input.dependencies?.calls ?? 0;
  return graphLayer({
    id: 'scope-use-def',
    title: 'Scope and use-def graph evidence',
    status: bindings && (uses || references || calls) ? 'strong' : bindings || bindingScopes || uses || references || calls ? 'partial' : 'missing',
    summary: { bindingScopes, bindings, uses, references, calls, sourceSymbols: input.dependencies?.sourceSymbolIds?.length ?? 0, targetSymbols: input.dependencies?.targetSymbolIds?.length ?? 0, symbols: input.symbols?.length ?? 0 },
    reasonCodes: [
      ...(!bindings ? ['missing-binding-graph'] : []),
      ...(!(uses || references || calls) ? ['missing-use-def-relations'] : [])
    ],
    evidenceIds: input.paradigmSemantics?.ids
  });
}

function moduleExportImportLayer(input) {
  const moduleSymbols = input.symbols.filter((symbol) => moduleSymbol(symbol));
  const importSymbols = moduleSymbols.filter((symbol) => importSymbol(symbol));
  const exportSymbols = moduleSymbols.filter((symbol) => exportSymbol(symbol));
  const importEdges = input.dependencies?.imports ?? 0;
  const requireEdges = input.dependencies?.requires ?? 0;
  return graphLayer({
    id: 'module-export-import',
    title: 'Module, export, and import graph evidence',
    status: (importEdges || requireEdges || importSymbols.length) && exportSymbols.length ? 'strong' : importEdges || requireEdges || moduleSymbols.length ? 'partial' : 'missing',
    summary: { importEdges, requireEdges, moduleSymbols: moduleSymbols.length, importSymbols: importSymbols.length, exportSymbols: exportSymbols.length, predicates: input.dependencies?.predicates ?? [] },
    reasonCodes: [
      ...(!(importEdges || requireEdges || importSymbols.length) ? ['missing-import-graph'] : []),
      ...(!exportSymbols.length ? ['missing-export-graph'] : [])
    ],
    evidenceIds: input.dependencies?.ids
  });
}

function typePublicApiLayer(input) {
  const typeSymbols = input.symbols.filter((symbol) => typeSymbol(symbol));
  const publicSymbols = input.symbols.filter((symbol) => exportSymbol(symbol) || publicRegion(input.ownershipRegions, symbol));
  const contracts = input.proofSpec?.contracts ?? 0;
  const invariants = input.proofSpec?.invariants ?? 0;
  return graphLayer({
    id: 'type-public-api',
    title: 'Type and public API graph evidence',
    status: typeSymbols.length && (publicSymbols.length || contracts || invariants) ? 'strong' : typeSymbols.length || publicSymbols.length || contracts || invariants ? 'partial' : 'missing',
    summary: { typeSymbols: typeSymbols.length, publicSymbols: publicSymbols.length, contracts, invariants, proofObligations: input.proofSpec?.obligations ?? 0, proofOpen: input.proofSpec?.open ?? 0 },
    reasonCodes: [
      ...(!typeSymbols.length ? ['missing-type-graph'] : []),
      ...(!(publicSymbols.length || contracts || invariants) ? ['missing-public-api-contract-graph'] : [])
    ],
    evidenceIds: input.proofSpec?.ids
  });
}

function controlFlowEffectLayer(input) {
  const runtimeRegions = input.ownershipRegions.filter((region) => runtimeRegion(region));
  const effectRegions = runtimeRegions.filter((region) => region.regionKind === 'effect').length + (input.paradigmSemantics?.effectRegions ?? 0);
  const controlRegions = runtimeRegions.filter((region) => region.regionKind === 'controlFlow').length + (input.paradigmSemantics?.controlRegions ?? 0);
  const mutationRegions = runtimeRegions.filter((region) => region.regionKind === 'mutation').length;
  const callRegions = runtimeRegions.filter((region) => region.regionKind === 'call').length + (input.dependencies?.calls ?? 0);
  const highRisk = input.semanticImpact?.summary?.byRisk?.high ?? 0;
  return graphLayer({
    id: 'control-flow-effect',
    title: 'Control-flow and effect graph evidence',
    status: runtimeRegions.length || effectRegions || controlRegions || mutationRegions || callRegions ? 'partial' : 'missing',
    summary: { runtimeRegions: runtimeRegions.length, effectRegions, controlRegions, mutationRegions, callRegions, highRiskImpacts: highRisk },
    reasonCodes: [
      ...(!controlRegions ? ['missing-control-flow-graph'] : []),
      ...(!effectRegions ? ['missing-effect-graph'] : [])
    ],
    evidenceIds: input.semanticImpact?.evidenceIds
  });
}

function genericSemanticEditAdmissionLayer(input) {
  const patchHints = input.patchHints?.length ?? 0;
  const mergeCandidates = input.mergeCandidates?.length ?? 0;
  const admissionStatus = input.admission?.status ?? input.quality?.record?.classification;
  const blocked = String(input.admission?.action ?? '').startsWith('reject') || input.readiness === 'blocked';
  return graphLayer({
    id: 'generic-semantic-edit-admission',
    title: 'Generic semantic edit admission evidence',
    status: blocked ? 'blocked' : admissionStatus && patchHints ? 'strong' : admissionStatus || patchHints || mergeCandidates ? 'partial' : 'missing',
    summary: { patchHints, mergeCandidates, admissionStatus, admissionAction: input.admission?.action, readiness: input.readiness, qualityClassification: input.quality?.record?.classification },
    reasonCodes: uniqueStrings([
      ...(!patchHints ? ['missing-semantic-patch-hints'] : []),
      ...(!admissionStatus ? ['missing-admission-record'] : []),
      ...(input.quality?.expectedMissingReasonCodes ?? [])
    ]),
    evidenceIds: input.admission?.evidenceIds
  });
}

function graphLayer(input) {
  return {
    kind: 'frontier.lang.semanticGraphLayer',
    version: 1,
    id: input.id,
    title: input.title,
    status: input.status,
    summary: input.summary ?? {},
    reasonCodes: uniqueStrings(input.reasonCodes ?? []),
    evidenceIds: uniqueStrings(input.evidenceIds ?? [])
  };
}

function summaryStatus(layers) {
  if (layers.some((layer) => layer.status === 'blocked')) return 'blocked';
  if (layers.some((layer) => layer.status === 'strong' || layer.status === 'partial')) return 'partial';
  return 'missing';
}

function emptySourcePreservationDetails() {
  return { total: 0, trivia: 0, comments: 0, directives: 0 };
}

function symbolText(symbol) {
  return `${symbol?.id ?? ''} ${symbol?.name ?? ''} ${symbol?.kind ?? ''} ${symbol?.ownershipRegionKind ?? ''}`.toLowerCase();
}

function moduleSymbol(symbol) {
  return /\b(import|export|module|namespace|commonjs|require)\b/.test(symbolText(symbol));
}

function importSymbol(symbol) {
  return /\b(import|require)\b/.test(symbolText(symbol));
}

function exportSymbol(symbol) {
  return /\b(export|public)\b/.test(symbolText(symbol));
}

function typeSymbol(symbol) {
  return /\b(type|interface|class|enum|namespace|module|alias|generic|constraint)\b/.test(symbolText(symbol));
}

function runtimeRegion(region) {
  return ['call', 'controlFlow', 'effect', 'mutation'].includes(region?.regionKind);
}

function publicRegion(regions, symbol) {
  return regions.some((region) => region.symbolId === symbol.id && /\b(export|public)\b/.test(`${region.key ?? ''} ${region.mergePolicy ?? ''}`.toLowerCase()));
}
