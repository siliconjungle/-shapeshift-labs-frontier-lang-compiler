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
typedSemanticEditScript.operations[0]?.status satisfies compilerApi.SemanticEditScriptOperationStatus | undefined;
typedSemanticEditScript.operations[0]?.spans?.worker satisfies object | undefined;

const semanticEditProjection = compilerApi.projectSemanticEditScriptToSource({
  script: semanticEditScript,
  workerSourceText: 'export function run() { return 2; }\n',
  headSourceText: 'export function run() { return 1; }\n'
});
const typedSemanticEditProjection: compilerApi.SemanticEditProjection = semanticEditProjection;
typedSemanticEditProjection.admission.autoMergeClaim satisfies false;

void typedSemanticEditScript;
void typedSemanticEditProjection;
