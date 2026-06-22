import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { assert } from './helpers.mjs';

const {
  createNativeSourcePreservation,
  createJsTsSemanticConflictSidecars,
  createSemanticEditScript,
  createSemanticImportSidecar,
  diffNativeSources,
  importNativeSource,
  mergeJsTsSafeMemberAdditions,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection,
  safeMergeJsTsImportsAndDeclarations
} = await loadCompilerApi();

const corpusUrl = new URL('../fixtures/js-ts-semantic-merge/corpus.json', import.meta.url);
const corpusText = readFileSync(corpusUrl, 'utf8');
const corpus = JSON.parse(corpusText);

assert.equal(corpus.schema, 'frontier.lang.jsTsSemanticMergeFixtureCorpus.v1');
assert.deepEqual(corpus.metadata.dependencies, [], 'fixture corpus must stay dependency-free');
assert.equal(Buffer.byteLength(corpusText, 'utf8') < 40_000, true, 'fixture corpus should stay small');
assert.equal(Array.isArray(corpus.fixtures), true, 'fixture corpus should include fixtures');
assert.equal(corpus.fixtures.length >= 8, true, 'fixture corpus should cover required JS/TS merge surfaces');

const fixtureIds = new Set();
const covered = new Set();
const outcomes = new Set();

for (const fixture of corpus.fixtures) {
  validateFixtureMetadata(fixture);
  fixtureIds.add(fixture.id);
  outcomes.add(fixture.expected.outcome);
  for (const coverage of fixture.coverage) covered.add(coverage);

  if (fixture.kind === 'merge') {
    assertMergeFixture(fixture);
  } else if (fixture.kind === 'safe-merge') {
    assertSafeMergeFixture(fixture);
  } else if (fixture.kind === 'source-ledger') {
    assertSourceLedgerFixture(fixture);
  } else if (fixture.kind === 'conflict-sidecar') {
    assertConflictSidecarFixture(fixture);
  } else {
    assert.fail(`${fixture.id}: unknown fixture kind ${fixture.kind}`);
  }
}

assert.equal(fixtureIds.size, corpus.fixtures.length, 'fixture ids must be unique');
for (const coverage of corpus.coverageRequirements) {
  assert.equal(covered.has(coverage), true, `missing required fixture coverage ${coverage}`);
}
assert.equal(outcomes.has('accepted'), true, 'expected at least one accepted fixture');
assert.equal(outcomes.has('rejected'), true, 'expected at least one rejected fixture');

async function loadCompilerApi() {
  const distUrl = new URL('../../dist/index.js', import.meta.url);
  if (existsSync(fileURLToPath(distUrl))) {
    return import(distUrl.href);
  }
  return import(new URL('../../src/index.js', import.meta.url).href);
}

function validateFixtureMetadata(fixture) {
  assert.match(fixture.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(typeof fixture.title, 'string', `${fixture.id}: title`);
  assert.equal(['merge', 'safe-merge', 'source-ledger', 'conflict-sidecar'].includes(fixture.kind), true, `${fixture.id}: kind`);
  assert.equal(['javascript', 'typescript', 'tsx'].includes(fixture.language), true, `${fixture.id}: language`);
  assert.equal(typeof fixture.sourcePath, 'string', `${fixture.id}: sourcePath`);
  assert.equal(Array.isArray(fixture.coverage) && fixture.coverage.length > 0, true, `${fixture.id}: coverage`);
  assert.equal(['accepted', 'rejected'].includes(fixture.expected?.outcome), true, `${fixture.id}: expected outcome`);
  assert.equal(fixture.dependencies, undefined, `${fixture.id}: fixture-level dependencies are not allowed`);

  for (const coverage of fixture.coverage) {
    assert.equal(corpus.coverageRequirements.includes(coverage), true, `${fixture.id}: unknown coverage ${coverage}`);
  }
  if (fixture.expected.outcome === 'rejected') {
    assert.equal(fixture.coverage.includes('negative-unsafe-case'), true, `${fixture.id}: rejected fixtures must be marked unsafe`);
  }
}

function assertMergeFixture(fixture) {
  const baseSourceText = sourceFromLines(fixture, 'baseLines');
  const workerSourceText = sourceFromLines(fixture, 'workerLines');
  const headSourceText = sourceFromLines(fixture, 'headLines');
  const expectedSourceText = fixture.expectedLines ? sourceFromLines(fixture, 'expectedLines') : undefined;

  assertSmallSource(fixture, baseSourceText, 'baseLines');
  assertSmallSource(fixture, workerSourceText, 'workerLines');
  assertSmallSource(fixture, headSourceText, 'headLines');
  assertSourcePreservation(fixture, baseSourceText, { minSemanticSymbols: 1 });

  const changeSet = diffNativeSources({
    id: `fixture_diff_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    beforeSourceText: baseSourceText,
    afterSourceText: workerSourceText
  });
  assert.equal(changeSet.changedRegions.length > 0, true, `${fixture.id}: expected changed regions`);
  assert.equal(changeSet.mergeCandidate.changedSemanticRegions.length > 0, true, `${fixture.id}: expected merge candidate regions`);
  assert.equal(changeSet.mergeCandidate.conflictKeys.length > 0, true, `${fixture.id}: expected conflict keys`);

  const script = createSemanticEditScript({
    id: `semantic_merge_fixture_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    baseSourceText,
    workerSourceText,
    headSourceText,
    generatedAt: 1
  });
  assert.equal(script.admission.status, fixture.expected.admissionStatus, `${fixture.id}: admission status`);
  assertExpectedOperationFields(script, fixture);
  assertExpectedReasonCodes(script, fixture);

  const projection = projectSemanticEditScriptToSource({
    script,
    workerSourceText,
    headSourceText
  });
  assert.equal(projection.status, fixture.expected.projectionStatus, `${fixture.id}: projection status`);

  const replay = replaySemanticEditProjection({
    projection,
    currentSourceText: headSourceText
  });
  assert.equal(replay.status, fixture.expected.replayStatus, `${fixture.id}: replay status`);

  if (fixture.expected.outcome === 'accepted') {
    assert.equal(script.admission.status, 'auto-merge-candidate', `${fixture.id}: accepted fixture admission`);
    assert.equal(typeof expectedSourceText, 'string', `${fixture.id}: expected source`);
    assert.equal(projection.sourceText, expectedSourceText, `${fixture.id}: projected source`);
    assert.equal(replay.outputSourceText, expectedSourceText, `${fixture.id}: replay output`);
  } else {
    assert.equal(script.admission.status === 'conflict' || script.admission.status === 'blocked', true, `${fixture.id}: rejected admission`);
    assert.equal(projection.sourceText, undefined, `${fixture.id}: blocked projection should not emit source`);
  }
}

function assertSafeMergeFixture(fixture) {
  const baseSourceText = sourceFromLines(fixture, 'baseLines');
  const workerSourceText = sourceFromLines(fixture, 'workerLines');
  const headSourceText = sourceFromLines(fixture, 'headLines');

  assertSmallSource(fixture, baseSourceText, 'baseLines');
  assertSmallSource(fixture, workerSourceText, 'workerLines');
  assertSmallSource(fixture, headSourceText, 'headLines');
  assertSourcePreservation(fixture, baseSourceText, { minSemanticSymbols: fixture.expected.minSemanticSymbols ?? 1 });

  if (fixture.safeMerge?.mode === 'imports-declarations') {
    const result = safeMergeJsTsImportsAndDeclarations({
      id: `safe_merge_fixture_${fixture.id}`,
      language: fixture.language,
      sourcePath: fixture.sourcePath,
      expectedSourceHash: fixture.safeMerge.expectedSourceHash,
      currentSourceHash: fixture.safeMerge.currentSourceHash,
      requireSourceLedgerSpans: fixture.safeMerge.requireSourceLedgerSpans,
      sourceLedgers: fixture.safeMerge.sourceLedgers,
      baseSourceText,
      workerSourceText,
      headSourceText
    });
    assert.equal(result.status, fixture.expected.safeMergeStatus, `${fixture.id}: safe merge status`);
    assert.equal(result.admission.status, fixture.expected.admissionStatus, `${fixture.id}: safe merge admission`);
    assertExpectedValues(result.admission.reasonCodes, fixture.expected.reasonCodes ?? [], `${fixture.id}: safe merge reason codes`);
    assertExpectedValues(result.gates.map((gate) => gate.id), fixture.expected.gateIds ?? [], `${fixture.id}: safe merge gate ids`);
    for (const gateId of fixture.expected.blockedGateIds ?? []) {
      assert.equal(
        result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'),
        true,
        `${fixture.id}: expected blocked gate ${gateId}; actual gates ${JSON.stringify(result.gates)}`
      );
    }
    if (fixture.expected.outcome === 'accepted') {
      assert.equal(typeof fixture.expectedLines, 'object', `${fixture.id}: expected safe-merge source`);
      assert.equal(result.mergedSourceText, sourceFromLines(fixture, 'expectedLines'), `${fixture.id}: safe merged source`);
    }
    return;
  }

  if (fixture.safeMerge?.mode === 'members') {
    const result = mergeJsTsSafeMemberAdditions({
      baseSourceText,
      workerSourceText,
      headSourceText,
      policy: fixture.safeMerge.policy
    });
    assert.equal(result.status, fixture.expected.safeMergeStatus, `${fixture.id}: member merge status`);
    assertExpectedValues(result.reasonCodes, fixture.expected.reasonCodes ?? [], `${fixture.id}: member merge reason codes`);
    if (fixture.expected.outcome === 'accepted') {
      assert.equal(typeof fixture.expectedLines, 'object', `${fixture.id}: expected member-merge source`);
      assert.equal(result.sourceText, sourceFromLines(fixture, 'expectedLines'), `${fixture.id}: member merged source`);
    } else {
      assert.equal(result.sourceText, undefined, `${fixture.id}: rejected member merge source`);
    }
    return;
  }

  assert.fail(`${fixture.id}: unknown safeMerge mode ${fixture.safeMerge?.mode}`);
}

function assertSourceLedgerFixture(fixture) {
  const sourceText = sourceFromLines(fixture, 'sourceLines');
  assertSmallSource(fixture, sourceText, 'sourceLines');
  assertSourcePreservation(fixture, sourceText, fixture.expected);

  if (fixture.coverage.includes('generated-source-map-boundary')) {
    assert.match(sourceText, /@generated/, `${fixture.id}: generated marker`);
    assert.match(sourceText, /sourceMappingURL=/, `${fixture.id}: source map boundary`);
    assertExpectedValues(fixture.expected.reasonCodes, ['generated-source-boundary', 'source-map-boundary'], `${fixture.id}: generated rejection metadata`);
  }
}

function assertConflictSidecarFixture(fixture) {
  assert.equal(typeof fixture.sidecarInput, 'object', `${fixture.id}: sidecarInput`);
  const bundle = createJsTsSemanticConflictSidecars({
    id: `conflict_sidecar_fixture_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    ...fixture.sidecarInput
  });
  assert.equal(bundle.kind, 'frontier.lang.jsTsSemanticMergeConflictSidecars', `${fixture.id}: sidecar kind`);
  assert.equal(bundle.admission.status, fixture.expected.admissionStatus, `${fixture.id}: sidecar admission`);

  if (fixture.expected.outcome === 'rejected') {
    assert.equal(bundle.admission.autoMergeSafe, false, `${fixture.id}: auto merge blocked`);
    assert.equal(bundle.admission.reviewRequired, true, `${fixture.id}: review required`);
  }

  assertExpectedValues(
    bundle.conflicts.map((conflict) => conflict.class),
    fixture.expected.sidecarClasses ?? [],
    `${fixture.id}: sidecar classes`
  );
  assertExpectedValues(bundle.admission.reasonCodes, fixture.expected.reasonCodes ?? [], `${fixture.id}: sidecar reason codes`);
}

function assertSourcePreservation(fixture, sourceText, expected) {
  const preservation = createNativeSourcePreservation({
    id: `source_preservation_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    sourceText
  });
  assertByteIdentical(preservation.sourceText, sourceText, `${fixture.id}: direct source preservation`);
  assert.equal(preservation.sourceBytes, Buffer.byteLength(sourceText, 'utf8'), `${fixture.id}: source byte length`);
  assert.equal(preservation.newline, 'lf', `${fixture.id}: newline style`);
  if (typeof expected.minComments === 'number') {
    assert.equal(preservation.summary.comments >= expected.minComments, true, `${fixture.id}: comment trivia`);
  }
  for (const kind of expected.directiveKinds ?? []) {
    assert.equal(preservation.summary.directiveKinds.includes(kind), true, `${fixture.id}: directive ${kind}`);
  }

  const importResult = importNativeSource({
    id: `import_${fixture.id}`,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    sourceText
  });
  assert.equal(importResult.semanticIndex.symbols.length >= expected.minSemanticSymbols, true, `${fixture.id}: semantic symbols`);
  assertByteIdentical(importResult.metadata.sourcePreservation.sourceText, sourceText, `${fixture.id}: import source preservation`);

  const sidecar = createSemanticImportSidecar(importResult);
  assert.equal(sidecar.kind, 'frontier.lang.semanticImportSidecar', `${fixture.id}: sidecar kind`);
  assert.equal(sidecar.summary.symbols >= expected.minSemanticSymbols, true, `${fixture.id}: sidecar symbols`);
}

function assertExpectedOperationFields(script, fixture) {
  const operationKinds = script.operations.map((operation) => operation.kind);
  const operationAnchors = script.operations.map((operation) => operation.anchor?.symbolName).filter(Boolean);
  const operationStatuses = script.operations.map((operation) => operation.status);
  assertExpectedValues(operationKinds, fixture.expected.operationKinds ?? [], `${fixture.id}: operation kinds`);
  assertExpectedValues(operationAnchors, fixture.expected.operationAnchors ?? [], `${fixture.id}: operation anchors`);
  assertExpectedValues(operationStatuses, fixture.expected.operationStatuses ?? [], `${fixture.id}: operation statuses`);
}

function assertExpectedReasonCodes(script, fixture) {
  const reasonCodes = new Set(script.admission.reasonCodes ?? []);
  for (const operation of script.operations) {
    for (const reasonCode of operation.reasonCodes ?? []) reasonCodes.add(reasonCode);
  }
  assertExpectedValues([...reasonCodes], fixture.expected.reasonCodes ?? [], `${fixture.id}: reason codes`);
}

function assertExpectedValues(actualValues, expectedValues, label) {
  for (const expectedValue of expectedValues) {
    assert.equal(
      actualValues.includes(expectedValue),
      true,
      `${label}: missing ${expectedValue}; actual ${JSON.stringify(actualValues)}`
    );
  }
}

function sourceFromLines(fixture, field) {
  const lines = fixture[field];
  assert.equal(Array.isArray(lines), true, `${fixture.id}: ${field} must be an array`);
  assert.equal(lines.every((line) => typeof line === 'string'), true, `${fixture.id}: ${field} must contain strings`);
  return lines.join('\n');
}

function assertSmallSource(fixture, sourceText, field) {
  assert.equal(Buffer.byteLength(sourceText, 'utf8') <= 1_500, true, `${fixture.id}: ${field} should stay small`);
}

function assertByteIdentical(actual, expected, label) {
  assert.equal(typeof actual, 'string', `${label}: expected string source`);
  assert.deepEqual(Buffer.from(actual, 'utf8'), Buffer.from(expected, 'utf8'), `${label}: bytes changed`);
}
