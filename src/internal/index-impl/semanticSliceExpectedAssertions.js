import{semanticSliceExpectationRecords}from'./semanticSliceExpectationRecords.js';

export function semanticSliceExpectedAssertions(selection, unresolvedEntryRefs, options = {}) {
  return [
    { id: 'entryRefsResolved', expected: unresolvedEntryRefs.length === 0 },
    { id: 'nonEmptySelection', expected: selection.symbols.length + selection.regions.length + selection.nativeNodes.length > 0 },
    { id: 'sourceMapLinks', expected: selection.mappings.length > 0 },
    { id: 'conflictKeys', expected: true },
    ...semanticSliceExpectationRecords(options)
  ];
}
