import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = "export const config = {\n  mode: 'a',\n};\n";
const flagWorkerSource = "export const config = {\n  mode: 'a',\n  flag: true,\n};\n";
const countWorkerSource = "export const config = {\n  mode: 'a',\n  count: 1,\n};\n";
const fixtures = [
  {
    id: 'flag_then_count',
    first: {
      worker: flagWorkerSource,
      symbolName: 'config.flag'
    },
    second: {
      worker: countWorkerSource,
      symbolName: 'config.count'
    },
    expected: "export const config = {\n  mode: 'a',\n  count: 1,\n  flag: true,\n};\n"
  },
  {
    id: 'count_then_flag',
    first: {
      worker: countWorkerSource,
      symbolName: 'config.count'
    },
    second: {
      worker: flagWorkerSource,
      symbolName: 'config.flag'
    },
    expected: "export const config = {\n  mode: 'a',\n  flag: true,\n  count: 1,\n};\n"
  }
];

for (const fixture of fixtures) {
  const firstScript = createScript(`${fixture.id}_first`, fixture.first.worker, baseSource);
  assert.equal(firstScript.admission.status, 'auto-merge-candidate', fixture.id);
  assertPortableOperation(firstScript, fixture.first.symbolName, fixture.id);
  const firstProjection = projectSemanticEditScriptToSource({
    script: firstScript,
    workerSourceText: fixture.first.worker,
    headSourceText: baseSource
  });
  assert.equal(firstProjection.status, 'projected', fixture.id);
  assert.equal(firstProjection.edits.length, 1, fixture.id);
  assert.equal(firstProjection.edits[0].symbolName, fixture.first.symbolName, fixture.id);

  const secondScript = createScript(`${fixture.id}_second`, fixture.second.worker, firstProjection.sourceText);
  assert.equal(secondScript.admission.status, 'auto-merge-candidate', fixture.id);
  assertPortableOperation(secondScript, fixture.second.symbolName, fixture.id);
  assertCoveredContainer(secondScript, fixture.id);

  const secondProjection = projectSemanticEditScriptToSource({
    script: secondScript,
    workerSourceText: fixture.second.worker,
    headSourceText: firstProjection.sourceText
  });
  assert.equal(secondProjection.status, 'projected', fixture.id);
  assert.equal(secondProjection.sourceText, fixture.expected, fixture.id);
  assert.equal(secondProjection.edits.length, 1, fixture.id);
  assert.equal(secondProjection.edits[0].editKind, 'insert', fixture.id);
  assert.equal(secondProjection.edits[0].symbolName, fixture.second.symbolName, fixture.id);
  assert.equal(secondProjection.edits.some((edit) => edit.editKind === 'replace'), false, fixture.id);
  assert.equal(secondProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), false, fixture.id);

  const secondReplay = replaySemanticEditProjection({
    projection: secondProjection,
    currentSourceText: firstProjection.sourceText
  });
  assert.equal(secondReplay.status, 'accepted-clean', fixture.id);
  assert.equal(secondReplay.outputSourceText, fixture.expected, fixture.id);
}

function createScript(id, workerSourceText, headSourceText) {
  return createSemanticEditScript({
    id: `semantic_edit_object_member_two_worker_${id}`,
    language: 'typescript',
    sourcePath: 'src/config.ts',
    baseSourceText: baseSource,
    workerSourceText,
    headSourceText,
    generatedAt: 106
  });
}

function assertPortableOperation(script, symbolName, message) {
  assert.equal(
    script.operations.some((operation) => operation.anchor.symbolName === symbolName && operation.status === 'portable'),
    true,
    message
  );
}

function assertCoveredContainer(script, message) {
  assert.equal(
    script.operations.some((operation) => operation.anchor.symbolName === 'config'
      && operation.status === 'covered'
      && operation.reasonCodes.includes('container-covered-by-child-edits')),
    true,
    message
  );
}
