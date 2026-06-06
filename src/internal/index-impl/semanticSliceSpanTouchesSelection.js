import{semanticSliceSpansOverlap}from'./semanticSliceSpansOverlap.js';
export function semanticSliceSpanTouchesSelection(span, mappings, regions) {
  if (!span) return false;
  return mappings.some((mapping) => mapping.sourceSpan === span || semanticSliceSpansOverlap(mapping.sourceSpan, span))
    || regions.some((region) => semanticSliceSpansOverlap(region.sourceSpan, span));
}
