import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  importNativeSource
} from './compiler-api.mjs';

const sourceText = 'export interface TypeParser {\n  parse(value: string): string;\n  format: (value: string) => string;\n  request: {\n    headers: {\n      accept: string;\n      transform?: (value: string) => string;\n    };\n    send(payload: string): Promise<void>;\n    build?: () => {\n      result: string;\n    };\n  };\n  callback: (\n    event: {\n      kind: string;\n    }\n  ) => void;\n}\nexport type Runner = {\n  run(value: string): string;\n  options: {\n    retry: number;\n    handle?: (value: string) => string;\n  };\n};\n';
const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/type-only.ts',
  sourceText
});
const names = new Set(imported.semanticIndex.symbols.map((symbol) => symbol.name));
for (const expectedName of [
  'TypeParser.request',
  'TypeParser.request.headers',
  'TypeParser.request.headers.accept',
  'TypeParser.request.headers.transform',
  'TypeParser.request.send',
  'TypeParser.request.build',
  'TypeParser.request.build.result',
  'Runner.options',
  'Runner.options.retry',
  'Runner.options.handle'
]) {
  assert.equal(names.has(expectedName), true);
}
for (const unexpectedName of [
  'TypeParser.headers',
  'TypeParser.accept',
  'TypeParser.transform',
  'TypeParser.send',
  'TypeParser.event',
  'TypeParser.kind',
  'Runner.retry',
  'Runner.handle'
]) {
  assert.equal(names.has(unexpectedName), false);
}
const nestedFunctions = imported.semanticIndex.symbols
  .filter((symbol) => ['TypeParser.request.headers.transform', 'TypeParser.request.send', 'TypeParser.request.build', 'Runner.options.handle'].includes(symbol.name));
assert.deepEqual(nestedFunctions.map((symbol) => symbol.metadata.signatureOnly), [true, true, true, true]);
assert.deepEqual(nestedFunctions.map((symbol) => symbol.metadata.owner), [
  'TypeParser.request.headers',
  'TypeParser.request',
  'TypeParser.request',
  'Runner.options'
]);
const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.symbolName === 'TypeParser.request.headers.transform'
  && region.regionKind === 'property'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.symbolName === 'TypeParser.request.send'
  && region.regionKind === 'property'), true);
assert.equal(sidecar.symbols.some((symbol) => symbol.kind === 'call'), false);
