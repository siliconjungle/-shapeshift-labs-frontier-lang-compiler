import { readFileSync } from 'node:fs';
import { assert } from './helpers.mjs';
import { safeMergeJsTsImportsAndDeclarations } from '../../src/js-ts-safe-merge.js';
import { mergeJsTsSafeMemberAdditions } from '../../src/js-ts-safe-member-merge.js';
import { safeMergeJsTsSource } from '../../src/js-ts-semantic-merge.js';

const corpus = JSON.parse(readFileSync(new URL('../fixtures/js-ts-semantic-merge/corpus.json', import.meta.url), 'utf8'));
const fixturesById = new Map(corpus.fixtures.map((fixture) => [fixture.id, fixture]));

function assertCorpusFixture(id, outcome, reasonCodes = []) {
  const fixture = fixturesById.get(id);
  assert.ok(fixture, `missing fixture ${id}`);
  assert.equal(fixture.expected.outcome, outcome, `${id}: outcome`);
  if (outcome === 'rejected') {
    assert.equal(fixture.coverage.includes('negative-unsafe-case'), true, `${id}: unsafe coverage`);
  }
  for (const reasonCode of reasonCodes) {
    assert.equal(
      (fixture.expected.reasonCodes ?? []).includes(reasonCode),
      true,
      `${id}: missing ${reasonCode}; expected ${JSON.stringify(fixture.expected.reasonCodes ?? [])}`
    );
  }
}

function assertSafeMergeCorpusFixture(id) {
  const fixture = fixturesById.get(id);
  assert.ok(fixture, `missing fixture ${id}`);
  assert.equal(fixture.kind, 'safe-merge', `${id}: safe-merge fixture kind`);
  const baseSourceText = sourceFromLines(fixture, 'baseLines');
  const workerSourceText = sourceFromLines(fixture, 'workerLines');
  const headSourceText = sourceFromLines(fixture, 'headLines');

  if (fixture.safeMerge.mode === 'imports-declarations') {
    const result = safeMergeJsTsImportsAndDeclarations({
      id: `oracle_fixture_${id}`,
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
    assert.equal(result.status, fixture.expected.safeMergeStatus, `${id}: safe merge status`);
    assert.equal(result.admission.status, fixture.expected.admissionStatus, `${id}: safe merge admission`);
    for (const reasonCode of fixture.expected.reasonCodes ?? []) {
      assert.equal(result.admission.reasonCodes.includes(reasonCode), true, `${id}: missing reason ${reasonCode}; actual ${JSON.stringify(result.admission.reasonCodes)}`);
    }
    for (const gateId of fixture.expected.blockedGateIds ?? []) {
      assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${id}: missing blocked gate ${gateId}; actual ${JSON.stringify(result.gates)}`);
    }
    return;
  }

  if (fixture.safeMerge.mode === 'members') {
    const result = mergeJsTsSafeMemberAdditions({ baseSourceText, workerSourceText, headSourceText, policy: fixture.safeMerge.policy });
    assert.equal(result.status, fixture.expected.safeMergeStatus, `${id}: member merge status`);
    for (const reasonCode of fixture.expected.reasonCodes ?? []) {
      assert.equal(result.reasonCodes.includes(reasonCode), true, `${id}: missing member reason ${reasonCode}; actual ${JSON.stringify(result.reasonCodes)}`);
    }
    return;
  }

  if (fixture.safeMerge.mode === 'source') {
    const result = safeMergeJsTsSource({
      id: `oracle_fixture_${id}`,
      language: fixture.language,
      sourcePath: fixture.sourcePath,
      policy: fixture.safeMerge.policy,
      baseSourceText,
      workerSourceText,
      headSourceText
    });
    assert.equal(result.status, fixture.expected.safeMergeStatus, `${id}: composed merge status`);
    assert.equal(result.admission.status, fixture.expected.admissionStatus, `${id}: composed merge admission`);
    for (const reasonCode of fixture.expected.reasonCodes ?? []) {
      assert.equal(result.admission.reasonCodes.includes(reasonCode), true, `${id}: missing composed reason ${reasonCode}; actual ${JSON.stringify(result.admission.reasonCodes)}`);
    }
    for (const gateId of fixture.expected.blockedGateIds ?? []) {
      assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${id}: missing composed blocked gate ${gateId}; actual ${JSON.stringify(result.gates)}`);
    }
    if (fixture.expected.outcome === 'rejected') assert.equal(result.mergedSourceText, undefined, `${id}: blocked composed source`);
    return;
  }

  assert.fail(`${id}: unknown safe merge mode ${fixture.safeMerge.mode}`);
}

function assertSafeMergeBlocked(result, code, gateId) {
  assert.equal(result.status, 'blocked', `${code}: status`);
  assert.equal(result.admission.reviewRequired, true, `${code}: review required`);
  assert.equal(result.admission.reasonCodes.includes(code), true, `${code}: reasons ${JSON.stringify(result.admission.reasonCodes)}`);
  assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, `${code}: conflicts ${JSON.stringify(result.conflicts)}`);
  assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${gateId}: gates ${JSON.stringify(result.gates)}`);
}

function sourceFromLines(fixture, field) {
  const lines = fixture[field];
  assert.equal(Array.isArray(lines), true, `${fixture.id}: ${field} must be an array`);
  return lines.join('\n');
}

export { assertCorpusFixture, assertSafeMergeBlocked, assertSafeMergeCorpusFixture, corpus, fixturesById };
