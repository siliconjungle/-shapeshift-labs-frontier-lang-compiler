import{adapterCoverageCapabilityRow}from'./adapterCoverageCapabilityRow.js';import{nativeAstNodes}from'./nativeAstNodes.js';
export function nativeImporterAdapterCapabilityEvidence(declared, observed, effective) {
  const capabilityRows = [
    adapterCoverageCapabilityRow('exactAst', declared.exactAst, observed.exactAst, effective.exactAst, observed.nativeAstNodes),
    adapterCoverageCapabilityRow('tokens', declared.tokens, observed.tokens, effective.tokens, observed.tokenCount),
    adapterCoverageCapabilityRow('trivia', declared.trivia, observed.trivia, effective.trivia, observed.triviaCount),
    adapterCoverageCapabilityRow('parserDiagnostics', declared.diagnostics, observed.parserDiagnostics > 0, effective.diagnostics, observed.parserDiagnostics),
    adapterCoverageCapabilityRow('sourceRanges', declared.sourceRanges, observed.sourceRanges, effective.sourceRanges, observed.sourceRangeNodes + observed.sourceRangeMappings),
    adapterCoverageCapabilityRow('generatedRanges', declared.generatedRanges, observed.generatedRanges, effective.generatedRanges, observed.generatedRangeMappings),
    adapterCoverageCapabilityRow('semanticDeclarations', declared.semanticCoverage.declarations, observed.semanticCoverage.declarations, effective.semanticCoverage.declarations, observed.semanticSymbols),
    adapterCoverageCapabilityRow('semanticSymbols', declared.semanticCoverage.symbols, observed.semanticCoverage.symbols, effective.semanticCoverage.symbols, observed.semanticSymbols),
    adapterCoverageCapabilityRow('references', declared.semanticCoverage.references, observed.semanticCoverage.references, effective.semanticCoverage.references, observed.semanticReferences),
    adapterCoverageCapabilityRow('types', declared.semanticCoverage.types, observed.semanticCoverage.types, effective.semanticCoverage.types, observed.semanticTypes),
    adapterCoverageCapabilityRow('controlFlow', declared.semanticCoverage.controlFlow, observed.semanticCoverage.controlFlow, effective.semanticCoverage.controlFlow, observed.semanticControlFlow)
  ];
  const reviewCapabilities = new Set(['exactAst', 'tokens', 'trivia', 'parserDiagnostics', 'sourceRanges', 'generatedRanges', 'references', 'types', 'controlFlow']);
  return Object.freeze({
    declared,
    observed,
    effective,
    capabilities: Object.freeze(capabilityRows),
    gaps: Object.freeze(capabilityRows.filter((row) => reviewCapabilities.has(row.capability) && !row.effective).map((row) => row.capability)),
    declaredOnly: Object.freeze(capabilityRows.filter((row) => row.declared && !row.observed).map((row) => row.capability)),
    observedOnly: Object.freeze(capabilityRows.filter((row) => !row.declared && row.observed).map((row) => row.capability)),
    parserDiagnostics: Object.freeze({
      declared: declared.diagnostics,
      observed: observed.parserDiagnostics > 0,
      count: observed.parserDiagnostics,
      errors: observed.diagnosticErrors,
      warnings: observed.diagnosticWarnings,
      infos: observed.diagnosticInfos
    }),
    sourceRanges: Object.freeze({
      declared: declared.sourceRanges,
      observed: observed.sourceRanges,
      nativeAstNodes: observed.nativeAstNodes,
      sourceRangeNodes: observed.sourceRangeNodes,
      sourceMapMappings: observed.sourceMapMappings,
      sourceRangeMappings: observed.sourceRangeMappings,
      generatedRangeMappings: observed.generatedRangeMappings
    }),
    tokensTrivia: Object.freeze({
      tokens: Object.freeze({ declared: declared.tokens, observed: observed.tokens, count: observed.tokenCount }),
      trivia: Object.freeze({ declared: declared.trivia, observed: observed.trivia, count: observed.triviaCount })
    }),
    semantic: Object.freeze({
      level: Object.freeze({
        declared: declared.semanticCoverage.level,
        observed: observed.semanticCoverage.level,
        effective: effective.semanticCoverage.level
      }),
      declarations: adapterCoverageCapabilityRow('semanticDeclarations', declared.semanticCoverage.declarations, observed.semanticCoverage.declarations, effective.semanticCoverage.declarations, observed.semanticSymbols),
      symbols: adapterCoverageCapabilityRow('semanticSymbols', declared.semanticCoverage.symbols, observed.semanticCoverage.symbols, effective.semanticCoverage.symbols, observed.semanticSymbols),
      references: adapterCoverageCapabilityRow('references', declared.semanticCoverage.references, observed.semanticCoverage.references, effective.semanticCoverage.references, observed.semanticReferences),
      types: adapterCoverageCapabilityRow('types', declared.semanticCoverage.types, observed.semanticCoverage.types, effective.semanticCoverage.types, observed.semanticTypes),
      controlFlow: adapterCoverageCapabilityRow('controlFlow', declared.semanticCoverage.controlFlow, observed.semanticCoverage.controlFlow, effective.semanticCoverage.controlFlow, observed.semanticControlFlow)
    })
  });
}
