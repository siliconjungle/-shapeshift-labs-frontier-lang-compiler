import * as compilerApi from '../src/index.js';

const semanticEditScript = compilerApi.createSemanticEditScript({
  language: 'typescript',
  sourcePath: 'src/example.ts',
  baseSourceText: 'export function run() { return 1; }\n',
  workerSourceText: 'export function run() { return 2; }\n',
  headSourceText: 'export function run() { return 1; }\n'
});
const semanticEditScriptSourceOptions: compilerApi.CreateSemanticEditScriptOptions = {
  id: 'typed_source_paths',
  language: 'typescript',
  sourcePath: 'src/example.ts',
  baseSourcePath: 'src/base.ts',
  beforeSourcePath: 'src/before.ts',
  workerSourcePath: 'src/worker.ts',
  afterSourcePath: 'src/after.ts',
  headSourcePath: 'src/head.ts',
  currentSourcePath: 'src/current.ts',
  baseSourceText: 'export function run() { return 1; }\n',
  workerSourceText: 'export function run() { return 2; }\n',
  headSourceText: 'export function run() { return 1; }\n',
  baseSourceHash: 'base_hash',
  beforeSourceHash: 'before_hash',
  workerSourceHash: 'worker_hash',
  afterSourceHash: 'after_hash',
  headSourceHash: 'head_hash',
  currentSourceHash: 'current_hash',
  baseMetadata: { side: 'base' },
  beforeMetadata: { side: 'before' },
  workerMetadata: { side: 'worker' },
  afterMetadata: { side: 'after' },
  headMetadata: { side: 'head' },
  currentMetadata: { side: 'current' },
  workerChangeSetId: 'typed_worker_change_set',
  headChangeSetId: 'typed_head_change_set',
  lineageInferenceId: 'typed_lineage_inference',
  generatedAt: '2026-06-11T00:00:00.000Z'
};
const semanticEditScriptRuntimeOptions: compilerApi.CreateSemanticEditScriptRuntimeOptions = {
  metadata: { runId: 'typed' }
};
const semanticEditScriptWithSourceAliases = compilerApi.createSemanticEditScript(
  semanticEditScriptSourceOptions,
  semanticEditScriptRuntimeOptions
);
const typedSemanticEditScriptWithSourceAliases: compilerApi.SemanticEditScript = semanticEditScriptWithSourceAliases;
const typedSemanticEditScript: compilerApi.SemanticEditScript = semanticEditScript;
typedSemanticEditScript.admission.status satisfies compilerApi.SemanticEditScriptAdmissionStatus;
typedSemanticEditScript.summary.semanticKeys satisfies readonly string[] | undefined;
typedSemanticEditScript.summary.operationContentHashes satisfies readonly string[] | undefined;
typedSemanticEditScript.summary.covered satisfies number | undefined;
typedSemanticEditScript.operations[0]?.status satisfies compilerApi.SemanticEditScriptOperationStatus | undefined;
const coveredStatus: compilerApi.SemanticEditScriptOperationStatus = 'covered';
typedSemanticEditScript.operations[0]?.semanticKey satisfies string | undefined;
typedSemanticEditScript.operations[0]?.semanticIdentityHash satisfies string | undefined;
typedSemanticEditScript.operations[0]?.operationContentHash satisfies string | undefined;
typedSemanticEditScript.operations[0]?.spans?.worker satisfies object | undefined;
typedSemanticEditScript.operations[0]?.insertion?.mode satisfies string | undefined;

const semanticEditProjection = compilerApi.projectSemanticEditScriptToSource({
  script: semanticEditScript,
  workerSourceText: 'export function run() { return 2; }\n',
  headSourceText: 'export function run() { return 1; }\n'
});
const typedSemanticEditProjection: compilerApi.SemanticEditProjection = semanticEditProjection;
const typedSemanticEditProjectionEdit: compilerApi.SemanticEditProjectionEdit | undefined = typedSemanticEditProjection.edits[0];
typedSemanticEditProjection.admission.autoMergeClaim satisfies false;
typedSemanticEditProjectionEdit?.status satisfies 'applied' | 'already-applied' | undefined;
typedSemanticEditProjectionEdit?.anchorKey satisfies string | undefined;
typedSemanticEditProjectionEdit?.conflictKey satisfies string | undefined;
typedSemanticEditProjectionEdit?.symbolName satisfies string | undefined;
typedSemanticEditProjectionEdit?.semanticKey satisfies string | undefined;
typedSemanticEditProjectionEdit?.semanticIdentityHash satisfies string | undefined;
typedSemanticEditProjectionEdit?.operationContentHash satisfies string | undefined;
typedSemanticEditProjectionEdit?.editContentHash satisfies string | undefined;
typedSemanticEditProjectionEdit?.editKind satisfies string | undefined;
typedSemanticEditProjectionEdit?.replacementSpanTextHash satisfies string | undefined;
typedSemanticEditProjectionEdit?.insertionAnchorKey satisfies string | undefined;

const semanticEditReplay = compilerApi.replaySemanticEditProjection({
  projection: semanticEditProjection,
  currentSourceText: 'export function run() { return 1; }\n'
});
const semanticEditReplayFromAliases = compilerApi.replaySemanticEditProjection({
  semanticEditProjection,
  headSourceText: 'export function run() { return 1; }\n',
  headSourcePath: 'src/example.ts'
});
const typedSemanticEditReplay: compilerApi.SemanticEditReplay = semanticEditReplay;
const typedSemanticEditReplayFromAliases: compilerApi.SemanticEditReplay = semanticEditReplayFromAliases;
typedSemanticEditReplay.status satisfies compilerApi.SemanticEditReplayStatus;
typedSemanticEditReplay.admission.action satisfies string;
typedSemanticEditReplay.admission.autoMergeClaim satisfies false;
typedSemanticEditReplay.admission.semanticEquivalenceClaim satisfies false;
typedSemanticEditReplay.edits[0]?.status satisfies string | undefined;
typedSemanticEditReplay.edits[0]?.editKind satisfies string | undefined;
typedSemanticEditReplay.outputSourceText satisfies string | undefined;
const typedProjectionDeleteEditKind: NonNullable<compilerApi.SemanticEditProjectionEdit['editKind']> = 'delete';
const typedReplayDeleteEditKind: NonNullable<compilerApi.SemanticEditReplayEdit['editKind']> = 'delete';

const semanticAnchorInput: compilerApi.CreateSemanticAnchorInput = {
  ownershipKey: 'source#src/example.ts#function#run',
  conflictKey: 'source#src/example.ts#function#run',
  pathSegments: ['source', 'src/example.ts', 'function', 'run'],
  name: 'run',
  symbolKind: 'function',
  hash: 'source_hash',
  span: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 40 }
};
const semanticAnchorFromAliases: compilerApi.SemanticAnchor | undefined = compilerApi.createSemanticAnchor(
  semanticAnchorInput,
  { language: 'typescript', sourcePath: 'src/example.ts', sourceHash: 'source_hash' }
);
const semanticLineageWithAnchorAliases = compilerApi.createSemanticLineageEvent({
  event: 'renamed',
  before: semanticAnchorInput,
  after: [{
    semanticKey: 'semantic-edit:function:execute',
    pathSegments: ['source', 'src/example.ts', 'function', 'execute'],
    name: 'execute',
    symbolKind: 'function',
    span: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 44 }
  }],
  actor: { actorId: 'typed-agent', role: 'agent' },
  clock: { id: 'typed-agent:1', actorId: 'typed-agent', seq: 1, deps: 'typed-agent:0', heads: 'typed-agent:1', frame: { branch: 'typed' } },
  frame: { branch: 'typed-inline' },
  evidence: { id: 'evidence_lineage_alias', pathMatch: true }
});
const typedSemanticLineageWithAnchorAliases: compilerApi.SemanticLineageEvent = semanticLineageWithAnchorAliases;

void typedSemanticEditScript;
void typedSemanticEditScriptWithSourceAliases;
void coveredStatus;
void typedSemanticEditProjection;
void typedSemanticEditProjectionEdit;
void typedSemanticEditReplay;
void typedSemanticEditReplayFromAliases;
void typedProjectionDeleteEditKind;
void typedReplayDeleteEditKind;
void semanticAnchorFromAliases;
void typedSemanticLineageWithAnchorAliases;
