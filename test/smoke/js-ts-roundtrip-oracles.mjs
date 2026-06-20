import { Buffer } from 'node:buffer';

import { assert } from './helpers.mjs';
import {
  createNativeSourcePreservation,
  createSemanticImportSidecar,
  importNativeSource,
  projectNativeImportToSource
} from './compiler-api.mjs';

const fixtures = [
  {
    id: 'javascript-module-directives-comments',
    language: 'javascript',
    sourcePath: 'src/oracles/module.js',
    sourceText: [
      "'use strict';",
      '"use client";',
      '// kept leading comment',
      '/* kept block comment with export default text */',
      "import defaultThing, { named as renamed } from './dep.js';",
      'export { renamed as exportedName };',
      'export default function run(value) {',
      '  return defaultThing?.(value) ?? renamed;',
      '}',
      '//# sourceMappingURL=module.js.map',
      ''
    ].join('\n'),
    newline: 'lf',
    minComments: 3,
    directiveKinds: ['runtime-directive', 'module-directive'],
    minSemanticSymbols: 4
  },
  {
    id: 'javascript-shebang',
    language: 'javascript',
    sourcePath: 'bin/oracle.mjs',
    sourceText: [
      '#!/usr/bin/env node',
      "'use strict';",
      '// command-line wrapper',
      'export async function main(argv = process.argv.slice(2)) {',
      "  return argv.join(' ');",
      '}',
      'void main();',
      ''
    ].join('\n'),
    newline: 'lf',
    minComments: 1,
    directiveKinds: ['shebang', 'runtime-directive', 'module-directive'],
    minSemanticSymbols: 1
  },
  {
    id: 'typescript-jsdoc',
    language: 'typescript',
    sourcePath: 'src/oracles/model.ts',
    sourceText: [
      '/**',
      ' * Formats a todo title.',
      ' * @param title Raw title with unicode: cafe\u0301 \u0394',
      ' */',
      'export interface Todo<T extends string = string> {',
      '  readonly title: T;',
      '}',
      'export function formatTodo<T extends string>(todo: Todo<T>): T {',
      '  return todo.title;',
      '}',
      ''
    ].join('\n'),
    newline: 'lf',
    minComments: 1,
    directiveKinds: ['module-directive'],
    minSemanticSymbols: 4
  },
  {
    id: 'typescript-tsx-ish',
    language: 'typescript',
    sourcePath: 'src/oracles/view.tsx',
    sourceText: [
      "import React from 'react';",
      'export type ViewProps = { title: string; ready?: boolean };',
      'export function TodoView(props: ViewProps) {',
      '  return <section data-ready={props.ready ?? false}>{props.title}</section>;',
      '}',
      ''
    ].join('\n'),
    newline: 'lf',
    minComments: 0,
    directiveKinds: ['module-directive'],
    minSemanticSymbols: 3
  },
  {
    id: 'typescript-crlf',
    language: 'typescript',
    sourcePath: 'src/oracles/crlf.ts',
    sourceText: "// CRLF fixture\r\nexport const answer: number = 42;\r\nexport const text = 'line endings stay CRLF';\r\n",
    newline: 'crlf',
    minComments: 1,
    directiveKinds: ['module-directive'],
    minSemanticSymbols: 2
  },
  {
    id: 'javascript-unicode',
    language: 'javascript',
    sourcePath: 'src/oracles/unicode.js',
    sourceText: [
      "const label = 'caf\u00e9 \u0394 \u6771\u4eac \ud83d\udc4b';",
      'export const message = `hello ${label}`;',
      ''
    ].join('\n'),
    newline: 'lf',
    minComments: 0,
    directiveKinds: ['module-directive'],
    minSemanticSymbols: 2
  },
  {
    id: 'javascript-source-map-comments',
    language: 'javascript',
    sourcePath: 'src/oracles/source-map-comment.js',
    sourceText: [
      'export const mapped = true;',
      '//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==',
      '//# sourceURL=webpack://frontier/oracles/source-map-comment.js',
      '/*# sourceMappingURL=source-map-comment.js.map */',
      ''
    ].join('\n'),
    newline: 'lf',
    minComments: 3,
    directiveKinds: ['module-directive'],
    minSemanticSymbols: 1
  }
];

for (const fixture of fixtures) {
  assertNoOpRoundtrip(fixture);
}

function assertNoOpRoundtrip(fixture) {
  const directPreservation = createNativeSourcePreservation(fixture);
  assertByteIdentical(directPreservation.sourceText, fixture.sourceText, `${fixture.id}: direct source preservation`);
  assert.equal(directPreservation.sourceBytes, Buffer.byteLength(fixture.sourceText, 'utf8'), `${fixture.id}: preserved byte length`);
  assert.equal(directPreservation.newline, fixture.newline, `${fixture.id}: newline style`);
  assert.equal(directPreservation.summary.comments >= fixture.minComments, true, `${fixture.id}: comment trivia`);
  for (const kind of fixture.directiveKinds) {
    assert.equal(directPreservation.summary.directiveKinds.includes(kind), true, `${fixture.id}: directive ${kind}`);
  }

  const importResult = importNativeSource({
    language: fixture.language,
    sourcePath: fixture.sourcePath,
    sourceText: fixture.sourceText
  });
  assert.equal(importResult.semanticIndex.symbols.length >= fixture.minSemanticSymbols, true, `${fixture.id}: semantic index symbols`);
  assertByteIdentical(importResult.metadata.sourcePreservation.sourceText, fixture.sourceText, `${fixture.id}: import metadata source preservation`);
  assertByteIdentical(importResult.nativeSource.metadata.sourcePreservation.sourceText, fixture.sourceText, `${fixture.id}: native source preservation`);
  assertByteIdentical(importResult.universalAst.metadata.sourcePreservation.sourceText, fixture.sourceText, `${fixture.id}: universal AST source preservation`);
  assert.equal(importResult.metadata.sourcePreservation.sourceBytes, Buffer.byteLength(fixture.sourceText, 'utf8'), `${fixture.id}: import byte length`);
  assert.equal(importResult.nativeAst.metadata.sourcePreservationSummary.exactSourceAvailable, true, `${fixture.id}: exact native AST source available`);
  assert.equal(importResult.metadata.kernelSourcePreservationSummary.exact >= 1, true, `${fixture.id}: exact kernel preservation record`);

  const sidecar = createSemanticImportSidecar(importResult);
  assert.equal(sidecar.kind, 'frontier.lang.semanticImportSidecar', `${fixture.id}: semantic sidecar`);
  assert.equal(sidecar.summary.symbols >= fixture.minSemanticSymbols, true, `${fixture.id}: sidecar symbols`);
  assertByteIdentical(importResult.metadata.sourcePreservation.sourceText, fixture.sourceText, `${fixture.id}: indexing leaves source preservation untouched`);

  const projection = projectNativeImportToSource(importResult);
  assert.equal(projection.mode, 'preserved-source', `${fixture.id}: projection mode`);
  assert.equal(projection.metadata.sourceHashVerified, true, `${fixture.id}: projection source hash verified`);
  assert.equal(projection.outputHash, projection.sourceHash, `${fixture.id}: projection hash`);
  assertByteIdentical(projection.sourceText, fixture.sourceText, `${fixture.id}: projected source`);

  const audit = projection.metadata.roundtripEvidence.audit;
  assert.equal(audit.paths.preservedSource.selected, true, `${fixture.id}: preserved source audit path`);
  assert.equal(audit.sourcePreservation.exactSourceAvailable, true, `${fixture.id}: audit exact source`);
  assert.equal(audit.hashChecks.sourceHashVerified, true, `${fixture.id}: audit source hash`);
  assert.equal(audit.hashChecks.outputMatchesSourceHash, true, `${fixture.id}: audit output hash`);
}

function assertByteIdentical(actual, expected, label) {
  assert.equal(typeof actual, 'string', `${label}: expected string source`);
  const actualBytes = Buffer.from(actual, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  assert.equal(actualBytes.length, expectedBytes.length, `${label}: byte length changed`);
  assert.deepEqual(actualBytes, expectedBytes, `${label}: bytes changed`);
}
