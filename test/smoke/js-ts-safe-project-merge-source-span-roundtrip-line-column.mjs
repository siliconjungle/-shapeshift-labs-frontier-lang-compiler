import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const base = [
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  'export function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');
const worker = base.replace('return v + 1;', 'return v + 2;');
const head = base.replace('return 0;', 'return 10;');

const project = safeMergeJsTsProject({
  id: 'js_ts_project_source_span_roundtrip_line_column',
  language: 'typescript',
  baseFiles: { 'src/probe.ts': base },
  workerFiles: { 'src/probe.ts': worker },
  headFiles: { 'src/probe.ts': head }
});

const sourceSpanProof = proofRecord(project, 'source-span-roundtrip');
const replayProof = proofRecord(project, 'semantic-edit-replay-clean');
const operation = project.files[0].result.semanticArtifacts.script.operations[0];
const genericSurface = project.confidence.admissionMatrixAudit.surfaces
  .find((surface) => surface.surface === 'generic-semantic-edit-admission');

assert.equal(project.status, 'merged');
assert.equal(operation.anchor.sourceSpan.startLine, 2);
assert.equal(operation.anchor.sourceSpan.start, undefined);
assert.equal(sourceSpanProof.status, 'passed');
assert.equal(sourceSpanProof.metadata.sourceSpanOperations, 1);
assert.equal(sourceSpanProof.metadata.spanLinkedProjectionEdits, 1);
assert.equal(sourceSpanProof.metadata.missingSignal, undefined);
assert.equal(replayProof.status, 'passed');
assert.equal(replayProof.metadata.boundedAdmissionRoute.routeId, 'admit-independent-semantic-edit-current-head-commutation');
assert.equal(genericSurface.proofStatuses['source-span-roundtrip'], 'passed');
assert.equal(genericSurface.proofStatuses['semantic-edit-replay-clean'], 'passed');
assert.equal(genericSurface.missingRouteIds.includes('produce-source-span-roundtrip-evidence'), false);
assert.equal(project.admission.autoMergeClaim, false);
assert.equal(project.admission.semanticEquivalenceClaim, false);

function proofRecord(projectResult, level) {
  const record = projectResult.proofEvidence.records.find((entry) => entry.level === level);
  assert.ok(record, `missing ${level} proof record`);
  return record;
}
