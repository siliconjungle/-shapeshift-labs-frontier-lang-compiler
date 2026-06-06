import{semanticSliceSymbolSpan}from'./semanticSliceSymbolSpan.js';import{uniqueSemanticSliceSpans}from'./uniqueSemanticSliceSpans.js';
export function semanticSliceSourceSpans(selection) {
  return uniqueSemanticSliceSpans([
    ...selection.symbols.map(semanticSliceSymbolSpan),
    ...selection.regions.map((region) => region.sourceSpan),
    ...selection.nativeNodes.map((node) => node.span ?? node.sourceSpan),
    ...selection.mappings.map((mapping) => mapping.sourceSpan)
  ].filter(Boolean));
}
