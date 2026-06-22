import { assert } from './helpers.mjs';

function assertSafeMergeFixture(fixture, context) {
  const baseSourceText = context.sourceFromLines(fixture, 'baseLines');
  const workerSourceText = context.sourceFromLines(fixture, 'workerLines');
  const headSourceText = context.sourceFromLines(fixture, 'headLines');

  context.assertSmallSource(fixture, baseSourceText, 'baseLines');
  context.assertSmallSource(fixture, workerSourceText, 'workerLines');
  context.assertSmallSource(fixture, headSourceText, 'headLines');
  context.assertSourcePreservation(fixture, baseSourceText, { minSemanticSymbols: fixture.expected.minSemanticSymbols ?? 1 });

  if (fixture.safeMerge?.mode === 'imports-declarations') {
    assertImportDeclarationSafeMergeFixture(fixture, context, { baseSourceText, workerSourceText, headSourceText });
    return;
  }
  if (fixture.safeMerge?.mode === 'members') {
    assertMemberSafeMergeFixture(fixture, context, { baseSourceText, workerSourceText, headSourceText });
    return;
  }
  if (fixture.safeMerge?.mode === 'source') {
    assertComposedSafeMergeFixture(fixture, context, { baseSourceText, workerSourceText, headSourceText });
    return;
  }

  assert.fail(`${fixture.id}: unknown safeMerge mode ${fixture.safeMerge?.mode}`);
}

function assertImportDeclarationSafeMergeFixture(fixture, context, sources) {
  const result = context.compilerApi.safeMergeJsTsImportsAndDeclarations({
    id: `safe_merge_fixture_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    expectedSourceHash: fixture.safeMerge.expectedSourceHash,
    currentSourceHash: fixture.safeMerge.currentSourceHash,
    requireSourceLedgerSpans: fixture.safeMerge.requireSourceLedgerSpans,
    sourceLedgers: fixture.safeMerge.sourceLedgers,
    ...sources
  });
  assert.equal(result.status, fixture.expected.safeMergeStatus, `${fixture.id}: safe merge status`);
  assert.equal(result.admission.status, fixture.expected.admissionStatus, `${fixture.id}: safe merge admission`);
  assertSafeMergeGatesAndReasons(result, fixture, context, 'safe merge');
  if (fixture.expected.outcome === 'accepted') {
    assert.equal(typeof fixture.expectedLines, 'object', `${fixture.id}: expected safe-merge source`);
    assert.equal(result.mergedSourceText, context.sourceFromLines(fixture, 'expectedLines'), `${fixture.id}: safe merged source`);
  }
}

function assertMemberSafeMergeFixture(fixture, context, sources) {
  const result = context.compilerApi.mergeJsTsSafeMemberAdditions({
    ...sources,
    policy: fixture.safeMerge.policy
  });
  assert.equal(result.status, fixture.expected.safeMergeStatus, `${fixture.id}: member merge status`);
  context.assertExpectedValues(result.reasonCodes, fixture.expected.reasonCodes ?? [], `${fixture.id}: member merge reason codes`);
  if (fixture.expected.outcome === 'accepted') {
    assert.equal(typeof fixture.expectedLines, 'object', `${fixture.id}: expected member-merge source`);
    assert.equal(result.sourceText, context.sourceFromLines(fixture, 'expectedLines'), `${fixture.id}: member merged source`);
  } else {
    assert.equal(result.sourceText, undefined, `${fixture.id}: rejected member merge source`);
  }
}

function assertComposedSafeMergeFixture(fixture, context, sources) {
  const result = context.compilerApi.safeMergeJsTsSource({
    id: `safe_merge_fixture_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    expectedSourceHash: fixture.safeMerge.expectedSourceHash,
    currentSourceHash: fixture.safeMerge.currentSourceHash,
    requireSourceLedgerSpans: fixture.safeMerge.requireSourceLedgerSpans,
    sourceLedgers: fixture.safeMerge.sourceLedgers,
    policy: fixture.safeMerge.policy,
    ...sources
  });
  assert.equal(result.status, fixture.expected.safeMergeStatus, `${fixture.id}: composed safe merge status`);
  assert.equal(result.admission.status, fixture.expected.admissionStatus, `${fixture.id}: composed safe merge admission`);
  assertSafeMergeGatesAndReasons(result, fixture, context, 'composed');
  if (fixture.expected.outcome === 'accepted') {
    assert.equal(typeof fixture.expectedLines, 'object', `${fixture.id}: expected composed source`);
    assert.equal(result.mergedSourceText, context.sourceFromLines(fixture, 'expectedLines'), `${fixture.id}: composed merged source`);
    assert.equal(result.summary.memberRegions, fixture.expected.memberRegions, `${fixture.id}: composed member regions`);
    assert.equal(result.summary.memberAdditions, fixture.expected.memberAdditions, `${fixture.id}: composed member additions`);
  } else {
    assert.equal(result.mergedSourceText, undefined, `${fixture.id}: blocked composed merge should not emit source`);
    assert.equal(result.outputSourceText, undefined, `${fixture.id}: blocked composed merge should not emit output source`);
  }
}

function assertSafeMergeGatesAndReasons(result, fixture, context, label) {
  context.assertExpectedValues(result.admission.reasonCodes, fixture.expected.reasonCodes ?? [], `${fixture.id}: ${label} reason codes`);
  context.assertExpectedValues(result.gates.map((gate) => gate.id), fixture.expected.gateIds ?? [], `${fixture.id}: ${label} gate ids`);
  for (const gateId of fixture.expected.blockedGateIds ?? []) {
    assert.equal(
      result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'),
      true,
      `${fixture.id}: expected blocked gate ${gateId}; actual gates ${JSON.stringify(result.gates)}`
    );
  }
}

export {
  assertSafeMergeFixture
};
