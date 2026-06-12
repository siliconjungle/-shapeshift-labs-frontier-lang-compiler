import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'export function parse(value: string): string;\nexport function parse(value: number): string;\nexport function parse(value: string | number): string {\n  return String(value);\n}\n';
const workerSource = baseSource.replace('String(value)', 'String(value).trim()');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;

const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/overload.ts',
  sourceText: baseSource
});
const parseSymbols = imported.semanticIndex.symbols.filter((symbol) => symbol.name === 'parse' && symbol.kind === 'function');
const signatureSymbols = parseSymbols.filter((symbol) => symbol.metadata.signatureOnly);
const bodySymbol = parseSymbols.find((symbol) => symbol.metadata.ownershipRegionKind === 'body');
assert.equal(signatureSymbols.length, 2);
assert.deepEqual(signatureSymbols.map((symbol) => symbol.definitionSpan.startLine), [1, 2]);
assert.deepEqual(signatureSymbols.map((symbol) => symbol.metadata.ownershipRegionKind), ['declaration', 'declaration']);
assert.equal(new Set(signatureSymbols.map((symbol) => symbol.metadata.ownershipRegionKey)).size, 2);
assert.equal(bodySymbol.definitionSpan.startLine, 3);
assert.equal(bodySymbol.definitionSpan.endLine, 5);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.filter((region) => region.regionKind === 'declaration' && region.symbolName === 'parse').length, 2);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'parse'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_typescript_overload_body',
  language: 'typescript',
  sourcePath: 'src/overload.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 150
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.some((operation) => operation.status === 'portable' && operation.anchor.symbolName === 'parse:controlFlow:exit#1'), true);

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: headSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, expectedSource);

const classBaseSource = 'export class Parser {\n  parse(value: string): string;\n  parse(value: number): string;\n  parse(value: string | number): string {\n    return String(value);\n  }\n}\n';
const classWorkerSource = classBaseSource.replace('String(value)', 'String(value).trim()');
const classHeadSource = `// coordinator moved this file\n${classBaseSource}`;
const classExpectedSource = `// coordinator moved this file\n${classWorkerSource}`;

const classImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/parser.ts',
  sourceText: classBaseSource
});
const methodSymbols = classImport.semanticIndex.symbols.filter((symbol) => symbol.name === 'Parser.parse');
const methodSignatures = methodSymbols.filter((symbol) => symbol.metadata.signatureOnly);
const methodBody = methodSymbols.find((symbol) => symbol.metadata.ownershipRegionKind === 'body');
assert.equal(methodSignatures.length, 2);
assert.deepEqual(methodSignatures.map((symbol) => symbol.definitionSpan.startLine), [2, 3]);
assert.equal(new Set(methodSignatures.map((symbol) => symbol.metadata.ownershipRegionKey)).size, 2);
assert.equal(methodBody.definitionSpan.startLine, 4);
assert.equal(methodBody.definitionSpan.endLine, 6);

const classSidecar = createSemanticImportSidecar(classImport);
assert.equal(classSidecar.ownershipRegions.filter((region) => region.regionKind === 'declaration' && region.symbolName === 'Parser.parse').length, 2);
assert.equal(classSidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Parser.parse'), true);

const classScript = createSemanticEditScript({
  id: 'semantic_edit_typescript_method_overload_body',
  language: 'typescript',
  sourcePath: 'src/parser.ts',
  baseSourceText: classBaseSource,
  workerSourceText: classWorkerSource,
  headSourceText: classHeadSource,
  generatedAt: 151
});
assert.equal(classScript.admission.status, 'auto-merge-candidate');
assert.equal(classScript.operations.some((operation) => operation.status === 'portable' && operation.anchor.symbolName === 'Parser.parse:controlFlow:exit#1'), true);

const classProjection = projectSemanticEditScriptToSource({ script: classScript, workerSourceText: classWorkerSource, headSourceText: classHeadSource });
assert.equal(classProjection.status, 'projected');
assert.equal(classProjection.sourceText, classExpectedSource);

const classReplay = replaySemanticEditProjection({ projection: classProjection, currentSourceText: classHeadSource });
assert.equal(classReplay.status, 'accepted-clean');
assert.equal(classReplay.outputSourceText, classExpectedSource);
