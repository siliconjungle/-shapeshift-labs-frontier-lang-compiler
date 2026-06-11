import * as compilerApi from '../src/index.js';

const semanticEditScript = compilerApi.createSemanticEditScript({
  language: 'typescript',
  sourcePath: 'src/example.ts',
  baseSourceText: 'export function run() { return 1; }\n',
  workerSourceText: 'export function run() { return 2; }\n',
  headSourceText: 'export function run() { return 1; }\n'
});
const typedSemanticEditScript: compilerApi.SemanticEditScript = semanticEditScript;
typedSemanticEditScript.admission.status satisfies compilerApi.SemanticEditScriptAdmissionStatus;
typedSemanticEditScript.summary.semanticKeys satisfies readonly string[] | undefined;
typedSemanticEditScript.summary.operationContentHashes satisfies readonly string[] | undefined;
typedSemanticEditScript.operations[0]?.status satisfies compilerApi.SemanticEditScriptOperationStatus | undefined;
typedSemanticEditScript.operations[0]?.semanticKey satisfies string | undefined;
typedSemanticEditScript.operations[0]?.semanticIdentityHash satisfies string | undefined;
typedSemanticEditScript.operations[0]?.operationContentHash satisfies string | undefined;
typedSemanticEditScript.operations[0]?.spans?.worker satisfies object | undefined;

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

void typedSemanticEditScript;
void typedSemanticEditProjection;
void typedSemanticEditProjectionEdit;
