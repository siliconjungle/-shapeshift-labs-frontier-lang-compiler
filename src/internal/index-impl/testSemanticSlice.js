import{idFragment,maxSemanticMergeReadiness}from'../../native-import-utils.js';
import{semanticSliceAssertion}from'./semanticSliceAssertion.js';import{semanticSliceExpectationAssertions}from'./semanticSliceExpectationAssertions.js';import{semanticSliceSourceHashAssertions}from'./semanticSliceSourceHashAssertions.js';
export function testSemanticSlice(slice, options = {}) {
  const assertions = [];
  assertions.push(semanticSliceAssertion('kind', slice?.kind === 'frontier.lang.semanticSlice', 'Input is a Frontier semantic slice.'));
  assertions.push(semanticSliceAssertion('entryRefsResolved', (slice?.unresolvedEntryRefs?.length ?? 0) === 0, 'All requested semantic entry refs resolved.', {
    unresolvedEntryRefs: slice?.unresolvedEntryRefs ?? []
  }));
  assertions.push(semanticSliceAssertion('nonEmptySelection', (slice?.symbols?.length ?? 0) + (slice?.ownershipRegions?.length ?? 0) + (slice?.nativeNodes?.length ?? 0) > 0, 'Slice selected at least one symbol, ownership region, or native node.'));
  assertions.push(semanticSliceAssertion('sourceMapLinks', options.requireSourceMapLinks === false || (slice?.sourceMapLinks?.length ?? 0) > 0, 'Slice has source-map links or the requirement was disabled.'));
  assertions.push(semanticSliceAssertion('conflictKeys', (slice?.mergeAdmission?.conflictKeys?.length ?? 0) > 0, 'Slice exposes merge-admission conflict keys.'));
  const sourceHashAssertions = semanticSliceSourceHashAssertions(slice, options.currentSources);
  assertions.push(...sourceHashAssertions);
  const expectationAssertions = semanticSliceExpectationAssertions(slice, options);
  assertions.push(...expectationAssertions);
  const failed = assertions.filter((assertion) => assertion.status === 'failed');
  const warnings = assertions.filter((assertion) => assertion.status === 'warning');
  const readiness = failed.length
    ? 'blocked'
    : maxSemanticMergeReadiness(slice?.mergeAdmission?.readiness ?? slice?.summary?.readiness ?? 'ready', warnings.length ? 'needs-review' : 'ready');
  return {
    kind: 'frontier.lang.semanticSliceTestResult',
    version: 1,
    id: options.id ?? `semantic_slice_test_${idFragment(slice?.id ?? 'slice')}`,
    generatedAt: options.generatedAt ?? Date.now(),
    sliceId: slice?.id,
    status: failed.length ? 'failed' : warnings.length ? 'needs-review' : 'passed',
    readiness,
    assertions,
    summary: {
      assertions: assertions.length,
      passed: assertions.filter((assertion) => assertion.status === 'passed').length,
      warnings: warnings.length,
      failed: failed.length,
      sourceHashChecks: sourceHashAssertions.length,
      expectedAssertions: expectationAssertions.length,
      symbols: slice?.summary?.symbols ?? slice?.symbols?.length ?? 0,
      ownershipRegions: slice?.summary?.ownershipRegions ?? slice?.ownershipRegions?.length ?? 0,
      sourceMapLinks: slice?.summary?.sourceMapLinks ?? slice?.sourceMapLinks?.length ?? 0
    },
    metadata: {
      sliceReadiness: slice?.mergeAdmission?.readiness ?? slice?.summary?.readiness,
      ...options.metadata
    }
  };
}
