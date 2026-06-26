import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createSemanticEditScript,
  mergeJsTsSafeMemberAdditions,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from '../dist/index.js';
import { runJsTsRealisticPatternFuzzCases } from './js-ts-realistic-pattern-cases.mjs';
import { assertRealRepoCorpus } from '../test/smoke/js-ts-real-repo-corpus-assertions.mjs';

const generatedCaseCount = 16;

export function runJsTsSemanticMergeFuzzCases() {
  const summary = { accepted: 0, rejected: 0, semanticEdit: 0, memberMerge: 0, manifestMutations: 0, realisticPatterns: 0, realisticMatrixRows: 0 };
  for (const fixture of generateJsTsSemanticMergeCases()) {
    if (fixture.kind === 'semantic-edit') {
      assertSemanticEditCase(fixture, summary);
    } else {
      assertMemberMergeCase(fixture, summary);
    }
  }
  assertRealRepoManifestMutationCases(summary);
  const realistic = runJsTsRealisticPatternFuzzCases();
  summary.accepted += realistic.accepted;
  summary.rejected += realistic.rejected;
  summary.realisticPatterns = realistic.realisticPatterns;
  summary.realisticMatrixRows = realistic.realisticMatrixRows;
  assert.deepEqual(summary, { accepted: 11, rejected: 9, semanticEdit: 8, memberMerge: 8, manifestMutations: 5, realisticPatterns: 4, realisticMatrixRows: 4 });
  return summary;
}

function generateJsTsSemanticMergeCases() {
  const cases = [];
  for (let seed = 0; seed < generatedCaseCount; seed += 1) {
    const language = (seed + Math.floor(seed / 4)) % 2 === 0 ? 'typescript' : 'javascript';
    const variant = seed % 4;
    if (variant === 0) cases.push(createAcceptedSemanticEditCase(seed, language));
    if (variant === 1) cases.push(createRejectedSemanticEditCase(seed, language));
    if (variant === 2) cases.push(createAcceptedMemberCase(seed, language));
    if (variant === 3) cases.push(createRejectedMemberCase(seed, language));
  }
  return cases;
}

function assertSemanticEditCase(fixture, summary) {
  const script = createSemanticEditScript({
    id: fixture.id,
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    baseSourceText: fixture.baseSourceText,
    workerSourceText: fixture.workerSourceText,
    headSourceText: fixture.headSourceText,
    generatedAt: fixture.seed
  });
  const projection = projectSemanticEditScriptToSource({
    script,
    workerSourceText: fixture.workerSourceText,
    headSourceText: fixture.headSourceText
  });
  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.headSourceText });
  assert.equal(script.operations.length > 0, true, `${fixture.id}: operations`);
  assert.equal(script.admission.status, fixture.admissionStatus, `${fixture.id}: admission`);
  assert.equal(projection.status, fixture.projectionStatus, `${fixture.id}: projection`);
  assert.equal(replay.status, fixture.replayStatus, `${fixture.id}: replay`);
  if (fixture.expectedSourceText) {
    assert.equal(projection.sourceText, fixture.expectedSourceText, `${fixture.id}: projected source`);
    assert.equal(replay.outputSourceText, fixture.expectedSourceText, `${fixture.id}: replay source`);
  } else {
    assert.equal(projection.sourceText, undefined, `${fixture.id}: blocked source`);
  }
  recordOutcome(summary, fixture, 'semanticEdit');
}

function assertMemberMergeCase(fixture, summary) {
  const result = mergeJsTsSafeMemberAdditions({
    baseSourceText: fixture.baseSourceText,
    workerSourceText: fixture.workerSourceText,
    headSourceText: fixture.headSourceText,
    policy: fixture.policy
  });
  assert.equal(result.status, fixture.status, `${fixture.id}: member status`);
  if (fixture.expectedSourceIncludes) {
    for (const token of fixture.expectedSourceIncludes) assert.match(result.sourceText, token, `${fixture.id}: ${token}`);
    const repeated = mergeJsTsSafeMemberAdditions(fixture);
    assert.equal(repeated.sourceText, result.sourceText, `${fixture.id}: deterministic output`);
  } else {
    assert.equal(result.sourceText, undefined, `${fixture.id}: blocked member source`);
    assert.equal(result.reasonCodes.some((reason) => reason.includes(fixture.reasonIncludes)), true, `${fixture.id}: reason`);
    assert.equal(result.admission.status, 'blocked', `${fixture.id}: blocked admission`);
  }
  recordOutcome(summary, fixture, 'memberMerge');
}

function recordOutcome(summary, fixture, bucket) {
  summary[bucket] += 1;
  summary[fixture.outcome] += 1;
}

function assertRealRepoManifestMutationCases(summary) {
  const corpus = JSON.parse(readFileSync(new URL('../test/fixtures/js-ts-semantic-merge/corpus.json', import.meta.url), 'utf8'));
  const fixtureIds = new Set((corpus.fixtures ?? []).map((fixture) => fixture.id));
  const fixturesById = new Map((corpus.fixtures ?? []).map((fixture) => [fixture.id, fixture]));

  assertRealRepoCorpus(corpus.realRepoCorpus, fixtureIds, assert, fixturesById);

  const mutations = [
    ['oracle-status-mismatch', (manifest) => {
      manifest.entries[0].oracleCases[0].expectedAdmissionStatus = 'blocked';
    }],
    ['oracle-surface-mismatch', (manifest) => {
      manifest.entries[0].oracleCases[0].surface = 'exports';
    }],
    ['missing-entry-oracles', (manifest) => {
      manifest.entries[1].oracleCases = [];
    }],
    ['vendored-entry-lines', (manifest) => {
      manifest.entries[2].sourceLines = ['export const externalSource = true;'];
    }],
    ['missing-gap-status', (manifest) => {
      delete manifest.broadSuiteGaps[0].status;
    }]
  ];

  for (const [id, mutate] of mutations) {
    const mutated = cloneJson(corpus.realRepoCorpus);
    mutate(mutated);
    assert.throws(
      () => assertRealRepoCorpus(mutated, fixtureIds, assert, fixturesById),
      { name: 'AssertionError' },
      `real-repo manifest mutation ${id} should fail`
    );
    summary.manifestMutations += 1;
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createAcceptedSemanticEditCase(seed, language) {
  const ext = language === 'typescript' ? 'ts' : 'js';
  const stableName = `stable${seed}`;
  const workerName = `worker${seed}`;
  const headName = `head${seed}`;
  const baseSourceText = source([`export const ${stableName} = ${seed};`, '']);
  const workerSourceText = source([
    `export const ${stableName} = ${seed};`,
    `export const ${workerName} = ${stableName} + 1;`,
    ''
  ]);
  const headSourceText = source([
    `export const ${headName} = ${stableName} - 1;`,
    `export const ${stableName} = ${seed};`,
    ''
  ]);
  return {
    id: `fuzz_semantic_addition_${seed}`,
    kind: 'semantic-edit',
    outcome: 'accepted',
    seed,
    language,
    sourcePath: `src/fuzz/semantic-addition-${seed}.${ext}`,
    baseSourceText,
    workerSourceText,
    headSourceText,
    expectedSourceText: source([
      `export const ${headName} = ${stableName} - 1;`,
      `export const ${stableName} = ${seed};`,
      `export const ${workerName} = ${stableName} + 1;`,
      ''
    ]),
    admissionStatus: 'auto-merge-candidate',
    projectionStatus: 'projected',
    replayStatus: 'accepted-clean'
  };
}

function createRejectedSemanticEditCase(seed, language) {
  const ext = language === 'typescript' ? 'ts' : 'js';
  const name = `run${seed}`;
  const typed = language === 'typescript' ? ': number' : '';
  const arg = language === 'typescript' ? 'value: number' : 'value';
  return {
    id: `fuzz_semantic_conflict_${seed}`,
    kind: 'semantic-edit',
    outcome: 'rejected',
    seed,
    language,
    sourcePath: `src/fuzz/semantic-conflict-${seed}.${ext}`,
    baseSourceText: source([`export function ${name}(${arg})${typed} {`, `  return value + ${seed};`, '}', '']),
    workerSourceText: source([`export function ${name}(${arg})${typed} {`, `  return value + ${seed + 1};`, '}', '']),
    headSourceText: source([`export function ${name}(${arg})${typed} {`, `  return value * ${seed + 2};`, '}', '']),
    admissionStatus: 'conflict',
    projectionStatus: 'blocked',
    replayStatus: 'blocked'
  };
}

function createAcceptedMemberCase(seed, language) {
  if (language === 'typescript') {
    const name = `Model${seed}`;
    return memberCase(seed, language, 'accepted', {
      baseSourceText: source([`export interface ${name} {`, '  id: string;', '}', '']),
      workerSourceText: source([`export interface ${name} {`, '  id: string;', '  title?: string;', '}', '']),
      headSourceText: source([`export interface ${name} {`, '  id: string;', '  updatedAt?: Date;', '}', '']),
      policy: { unorderedRegions: [{ kind: 'interface', name, order: 'non-semantic' }] },
      expectedSourceIncludes: [/title\?: string;/, /updatedAt\?: Date;/]
    });
  }
  const name = `config${seed}`;
  return memberCase(seed, language, 'accepted', {
    baseSourceText: objectSource(name, ["mode: 'base'"]),
    workerSourceText: objectSource(name, ["mode: 'base'", `worker: ${seed}`]),
    headSourceText: objectSource(name, ["mode: 'base'", `head: ${seed}`]),
    policy: { unorderedRegions: [{ kind: 'object', name, regionKind: 'config', order: 'non-semantic' }] },
    expectedSourceIncludes: [/worker:/, /head:/]
  });
}

function createRejectedMemberCase(seed, language) {
  if (language === 'typescript') {
    const name = `Model${seed}`;
    return memberCase(seed, language, 'rejected', {
      baseSourceText: source([`export interface ${name} {`, '  id: string;', '}', '']),
      workerSourceText: source([`export interface ${name} {`, '  id: string;', '  flag?: boolean;', '}', '']),
      headSourceText: source([`export interface ${name} {`, '  id: string;', '  flag?: number;', '}', '']),
      policy: { unorderedRegions: [{ kind: 'interface', name, order: 'non-semantic' }] },
      reasonIncludes: 'duplicate-added-key:flag'
    });
  }
  const name = `config${seed}`;
  return memberCase(seed, language, 'rejected', {
    baseSourceText: objectSource(name, ["mode: 'base'"]),
    workerSourceText: objectSource(name, ["mode: 'base'", 'flag: true']),
    headSourceText: objectSource(name, ["mode: 'base'", 'flag: false']),
    policy: { unorderedRegions: [{ kind: 'object', name, regionKind: 'config', order: 'non-semantic' }] },
    reasonIncludes: 'duplicate-added-key:flag'
  });
}

function memberCase(seed, language, outcome, details) {
  return {
    id: `fuzz_member_${outcome}_${seed}`,
    kind: 'member-merge',
    outcome,
    seed,
    language,
    sourcePath: `src/fuzz/member-${outcome}-${seed}.${language === 'typescript' ? 'ts' : 'js'}`,
    status: outcome === 'accepted' ? 'merged' : 'rejected',
    ...details
  };
}

function objectSource(name, members) {
  return source([`export const ${name} = {`, ...members.map((member) => `  ${member},`), '};', '']);
}

function source(lines) {
  return lines.join('\n');
}
