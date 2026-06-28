import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';
import { sourceSpanRoundtripEvidence } from '../../src/js-ts-safe-project-merge-source-span-roundtrip-proof.js';

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
assert.equal(sourceSpanProof.metadata.sourceHashBoundSourceResults, 1);
assert.equal(sourceSpanProof.metadata.outputHashBoundSourceResults, 1);
assert.equal(sourceSpanProof.metadata.hashBindingFailedSourceResults, 0);
assert.equal(sourceSpanProof.metadata.missingSignal, undefined);
assert.equal(replayProof.status, 'passed');
assert.equal(replayProof.metadata.boundedAdmissionRoute.routeId, 'admit-independent-semantic-edit-current-head-commutation');
assert.equal(genericSurface.proofStatuses['source-span-roundtrip'], 'passed');
assert.equal(genericSurface.proofStatuses['semantic-edit-replay-clean'], 'passed');
assert.equal(genericSurface.missingRouteIds.includes('produce-source-span-roundtrip-evidence'), false);
assert.equal(project.admission.autoMergeClaim, false);
assert.equal(project.admission.semanticEquivalenceClaim, false);

const staleHashArtifacts = structuredClone(project.files[0].result.semanticArtifacts);
staleHashArtifacts.projection.projectedHash = project.files[0].workerHash;
staleHashArtifacts.replay.currentHash = project.files[0].baseHash;
staleHashArtifacts.replay.outputHash = project.files[0].workerHash;
staleHashArtifacts.replay.metadata.expectedCurrentHash = project.files[0].baseHash;
staleHashArtifacts.replay.metadata.observedCurrentHash = project.files[0].baseHash;
staleHashArtifacts.replay.metadata.expectedOutputHash = project.files[0].workerHash;
staleHashArtifacts.replay.metadata.replayedOutputHash = project.files[0].workerHash;
staleHashArtifacts.replay.metadata.proofRoute.expectedCurrentHash = project.files[0].baseHash;
staleHashArtifacts.replay.metadata.proofRoute.replayCurrentHash = project.files[0].baseHash;
staleHashArtifacts.replay.metadata.proofRoute.expectedOutputHash = project.files[0].workerHash;
staleHashArtifacts.replay.metadata.proofRoute.projectionOutputHash = project.files[0].workerHash;
staleHashArtifacts.replay.metadata.proofRoute.replayOutputHash = project.files[0].workerHash;
staleHashArtifacts.alreadyAppliedReplay.currentHash = project.files[0].workerHash;
staleHashArtifacts.alreadyAppliedReplay.outputHash = project.files[0].workerHash;
staleHashArtifacts.alreadyAppliedReplay.metadata.expectedCurrentHash = project.files[0].workerHash;
staleHashArtifacts.alreadyAppliedReplay.metadata.observedCurrentHash = project.files[0].workerHash;
const staleHashFile = {
  ...project.files[0],
  semanticArtifacts: staleHashArtifacts,
  result: { ...project.files[0].result, semanticArtifacts: staleHashArtifacts }
};
const staleHashProof = sourceSpanRoundtripEvidence(
  'js_ts_project_source_span_roundtrip_stale_hash_oracle',
  [staleHashFile],
  'source-span-roundtrip',
  'parser-roundtrip'
);
assert.equal(staleHashProof.status, 'failed');
assert.equal(staleHashProof.metadata.failedSourceResults, 1);
assert.equal(staleHashProof.metadata.admissionBlockingFailedSourceResults, 1);
assert.equal(staleHashProof.metadata.hashBindingFailedSourceResults, 1);
assert.equal(staleHashProof.metadata.sourceSpanRoundtripHashBindingReasonCodes.includes('source-span-roundtrip-projection-output-hash-mismatch'), true);
assert.equal(staleHashProof.metadata.sourceSpanRoundtripHashBindingReasonCodes.includes('source-span-roundtrip-replay-current-source-hash-mismatch'), true);
assert.equal(staleHashProof.metadata.sourceSpanRoundtripHashBindingReasonCodes.includes('source-span-roundtrip-replay-output-hash-mismatch'), true);
assert.equal(staleHashProof.metadata.sourceSpanRoundtripAdmissionBlockerSourcePaths.includes('src/probe.ts'), true);

const staleParserCoverageArtifacts = structuredClone(project.files[0].result.semanticArtifacts);
staleParserCoverageArtifacts.metadata = {
  ...staleParserCoverageArtifacts.metadata,
  parserEvidence: 'estree-parser-token-comment-ranges'
};
const staleParserCoverageFile = {
  ...project.files[0],
  parserTriviaEvidence: {
    status: 'exact',
    exactParserTrivia: true,
    losslessCst: true,
    sourceHash: project.files[0].outputHash,
    parserEvidence: 'estree-parser-token-comment-ranges',
    adapterId: 'fixture-stale-parser-span-coverage-adapter',
    evidenceId: 'fixture-stale-parser-span-coverage-trivia'
  },
  parserSpanCoverageProof: {
    schema: 'frontier.lang.parserSpanCoverageProof.v1',
    version: 1,
    status: 'exact',
    exactParserSpans: true,
    sourcePath: 'src/probe.ts',
    sourceHash: project.files[0].workerHash,
    sourceLength: project.files[0].outputSourceText.length,
    coveredSourceLength: project.files[0].outputSourceText.length,
    spanCount: 1,
    parserEvidence: 'estree-parser-token-comment-ranges',
    adapterId: 'fixture-stale-parser-span-coverage-adapter',
    evidenceId: 'fixture-stale-parser-span-coverage-proof',
    startsAtZero: true,
    endsAtSourceLength: true,
    nonOverlapping: true,
    contiguous: true,
    textMatchesSource: true,
    reasonCodes: ['parser-token-comment-span-coverage-exact'],
    blockReasonCodes: []
  },
  semanticArtifacts: staleParserCoverageArtifacts,
  result: { ...project.files[0].result, semanticArtifacts: staleParserCoverageArtifacts }
};
const staleParserCoverageProof = sourceSpanRoundtripEvidence(
  'js_ts_project_source_span_roundtrip_stale_parser_coverage_oracle',
  [staleParserCoverageFile],
  'source-span-roundtrip',
  'parser-roundtrip'
);
assert.equal(staleParserCoverageProof.status, 'failed');
assert.equal(staleParserCoverageProof.metadata.failedSourceResults, 1);
assert.equal(staleParserCoverageProof.metadata.admissionBlockingFailedSourceResults, 1);
assert.equal(staleParserCoverageProof.metadata.hashBindingFailedSourceResults, 0);
assert.equal(staleParserCoverageProof.metadata.parserTriviaExactnessStatus, 'blocked');
assert.equal(staleParserCoverageProof.metadata.blockedParserTriviaFiles, 1);
assert.equal(
  staleParserCoverageProof.metadata.parserTriviaExactnessBlockReasonCodes.includes('exact-parser-trivia-span-coverage-blocked'),
  true
);
assert.equal(
  staleParserCoverageProof.metadata.parserTriviaExactnessBlockReasonCodes.includes('parser-span-coverage-source-hash-mismatch'),
  true
);
assert.equal(staleParserCoverageProof.metadata.sourceSpanRoundtripAdmissionBlockerSourcePaths.includes('src/probe.ts'), true);

function proofRecord(projectResult, level) {
  const record = projectResult.proofEvidence.records.find((entry) => entry.level === level);
  assert.ok(record, `missing ${level} proof record`);
  return record;
}
