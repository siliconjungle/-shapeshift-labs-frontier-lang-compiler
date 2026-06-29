import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export { assert };

export function publicValueExportsFromDeclaration(url, seen = new Set()) {
  if (seen.has(url.href)) return [];
  seen.add(url.href);
  const text = readFileSync(url, 'utf8');
  const names = [];
  for (const match of text.matchAll(/^export declare (?:const|function) ([A-Za-z_$][\w$]*)/gm)) {
    names.push(match[1]);
  }
  for (const match of text.matchAll(/^export\s+{([\s\S]*?)}\s+from ['"][^'"]+['"];?$/gm)) {
    for (const specifier of match[1].split(',')) {
      const name = specifier.trim();
      if (!name) continue;
      names.push(name.includes(' as ') ? name.split(/\s+as\s+/).at(-1).trim() : name);
    }
  }
  for (const match of text.matchAll(/^export \* from ['"]([^'"]+)['"];?$/gm)) {
    const declarationSpecifier = match[1].replace(/\.js$/, '.d.ts');
    names.push(...publicValueExportsFromDeclaration(new URL(declarationSpecifier, url), seen));
  }
  return [...new Set(names)].sort();
}

export function assertScannedSymbol(importResult, symbolName, idPart = symbolName.toLowerCase()) {
  assert.equal(importResult.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
  assert.equal(importResult.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes(idPart)), true);
  assert.equal(importResult.losses.some((loss) => loss.kind === 'declarationOnlyCoverage'), true);
}

function semanticSymbolsFromImport(importResult) {
  return importResult?.semanticIndex?.symbols ?? importResult?.universalAst?.semanticIndex?.symbols ?? [];
}

function sourceMapsFromImport(importResult) {
  if (Array.isArray(importResult?.sourceMaps)) return importResult.sourceMaps;
  if (Array.isArray(importResult?.universalAst?.sourceMaps)) return importResult.universalAst.sourceMaps;
  return [];
}

export function assertSemanticImportFixture(importResult, options) {
  const {
    sidecar,
    expectedSymbols = [],
    expectedRegionKinds = [],
    expectedReadiness,
    expectedWarningCodes = [],
    expectEligible = expectedWarningCodes.length === 0,
    minSymbols = Math.max(1, expectedSymbols.length),
    minOwnershipRegions = Math.max(1, expectedRegionKinds.length),
    minSourceMapMappings = 1,
    minPatchHints = Math.max(1, expectedRegionKinds.length),
    label = importResult?.id ?? importResult?.sourcePath ?? 'semantic import fixture'
  } = options ?? {};
  assert.ok(importResult, `${label}: expected an import result`);
  assert.ok(sidecar, `${label}: expected a semantic import sidecar`);

  const symbols = semanticSymbolsFromImport(importResult);
  assert.equal(symbols.length >= minSymbols, true, `${label}: expected at least ${minSymbols} semantic symbols`);
  for (const name of expectedSymbols) {
    assert.equal(symbols.some((symbol) => symbol.name === name), true, `${label}: expected semantic symbol ${name}`);
  }

  const sourceMaps = sourceMapsFromImport(importResult);
  const mappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  if (minSourceMapMappings > 0) {
    assert.equal(sourceMaps.length >= 1, true, `${label}: expected at least one source map`);
    assert.equal(mappings.length >= minSourceMapMappings, true, `${label}: expected source map mappings`);
    assert.equal(
      mappings.some((mapping) => mapping.id && mapping.semanticSymbolId && (mapping.sourceSpan || mapping.generatedSpan || mapping.nativeAstNodeId)),
      true,
      `${label}: expected source-addressable semantic source map mappings`
    );
    assert.equal(
      mappings.some((mapping) => mapping.ownershipRegionId || mapping.ownershipRegionKey || mapping.ownershipRegionKind),
      true,
      `${label}: expected source maps to retain ownership region metadata`
    );
  }

  assert.equal(sidecar.kind, 'frontier.lang.semanticImportSidecar');
  assert.equal(sidecar.summary.symbols >= minSymbols, true, `${label}: expected sidecar symbols`);
  assert.equal(sidecar.summary.sourceMapMappings >= minSourceMapMappings, true, `${label}: expected sidecar source maps`);
  assert.equal(sidecar.ownershipRegions.length >= minOwnershipRegions, true, `${label}: expected ownership regions`);
  assert.equal(
    sidecar.ownershipRegions.every((region) => region.id && region.key && region.regionKind),
    true,
    `${label}: expected keyed ownership regions`
  );
  for (const kind of expectedRegionKinds) {
    assert.equal(sidecar.regionTaxonomy.presentKinds.includes(kind), true, `${label}: expected ${kind} ownership region`);
  }
  assert.equal(sidecar.patchHints.length >= minPatchHints, true, `${label}: expected semantic patch hints`);
  assert.equal(
    sidecar.patchHints.every((hint) => hint.ownershipRegionId && hint.supportedOperations?.length && hint.projection?.requiresSourceMap === true),
    true,
    `${label}: expected source-map-backed patch hints`
  );
  assert.equal(sidecar.quality.imported, true, `${label}: expected sidecar quality to mark import selected`);
  assert.equal(sidecar.quality.eligible, expectEligible, `${label}: unexpected sidecar eligibility`);
  assert.equal(sidecar.quality.symbolCount, sidecar.summary.symbols);
  assert.equal(sidecar.quality.ownershipRegionCount, sidecar.ownershipRegions.length);
  assert.equal(sidecar.quality.patchHintCount, sidecar.patchHints.length);
  assert.equal(sidecar.admission.counts.patchHints, sidecar.patchHints.length);
  if (expectedReadiness) {
    const importReadiness = importResult.readiness?.readiness
      ?? importResult.metadata?.nativeImportLossSummary?.semanticMergeReadiness
      ?? importResult.mergeCandidates?.[0]?.readiness;
    if (importReadiness) assert.equal(importReadiness, expectedReadiness, `${label}: unexpected import readiness`);
    assert.equal(sidecar.summary.readiness, expectedReadiness, `${label}: unexpected sidecar readiness`);
  }
  assert.deepEqual(
    (sidecar.quality.warnings ?? []).map((warning) => warning.code).sort(),
    [...expectedWarningCodes].sort(),
    `${label}: unexpected semantic import warning codes`
  );
}

export function symbolByName(importResult, name) {
  return importResult.semanticIndex.symbols.find((symbol) => symbol.name === name);
}

export function mappedSymbol(importResult, symbolId) {
  return importResult.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === symbolId);
}

export function nativeNodeForSymbol(importResult, name) {
  const symbol = symbolByName(importResult, name);
  assert.ok(symbol, `expected scanned symbol ${name}`);
  return importResult.nativeAst.nodes[symbol.nativeAstNodeId];
}

const readinessRank = {
  ready: 0,
  'ready-with-losses': 1,
  'needs-review': 2,
  blocked: 3
};

export function assertExactAdapterOutranksScanner(adapterImport, scannerImport, symbolName) {
  const adapterSummary = adapterImport.metadata.nativeImportLossSummary;
  const scannerSummary = scannerImport.metadata.nativeImportLossSummary;
  assert.equal(adapterImport.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
  assert.equal(scannerImport.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
  assert.equal(adapterSummary.exactAst, true);
  assert.equal(adapterSummary.semanticMergeReadiness, 'ready');
  assert.equal(adapterImport.mergeCandidates[0].readiness, 'ready');
  assert.equal(adapterImport.losses.length, 0);
  assert.equal(adapterSummary.categories.includes('exactAstImport'), true);
  assert.equal(scannerSummary.exactAst, false);
  assert.equal(scannerSummary.semanticMergeReadiness, 'needs-review');
  assert.equal(scannerImport.mergeCandidates[0].readiness, 'needs-review');
  assert.equal(scannerImport.losses.some((loss) => loss.kind === 'declarationOnlyCoverage'), true);
  assert.equal(scannerImport.losses.some((loss) => loss.kind === 'sourcePreservation'), true);
  assert.equal(scannerSummary.categories.includes('declarationsOnly'), true);
  assert.equal(scannerSummary.categories.includes('sourcePreservation'), true);
  assert.equal(
    readinessRank[adapterSummary.semanticMergeReadiness] < readinessRank[scannerSummary.semanticMergeReadiness],
    true
  );
}
