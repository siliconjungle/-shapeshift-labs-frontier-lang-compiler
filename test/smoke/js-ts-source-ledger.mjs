import { assert } from './helpers.mjs';
import { createNativeSourcePreservation } from './compiler-api.mjs';

function inside(span, protectedSpan) {
  return span.start >= protectedSpan.start && span.end <= protectedSpan.end;
}

const jsSource = [
  '#!/usr/bin/env node',
  '"use strict";',
  '// kept comment',
  'import fs from "node:fs";',
  'const pattern = /sourceMappingURL=(.*)$/gm;',
  'const text = "{ not a brace }";',
  'const templ = `value ${text}`;',
  'export { fs };',
  '//# sourceMappingURL=app.js.map',
  ''
].join('\n');
const jsPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/app.js',
  sourceText: jsSource
});
assert.equal(jsPreservation.ledger.kind, 'frontier.lang.jsTsSourceLedger');
assert.equal(jsPreservation.ledger.shebangs.length, 1);
assert.equal(jsPreservation.ledger.directives.some((entry) => entry.kind === 'shebang'), true);
assert.equal(jsPreservation.ledger.directives.some((entry) => entry.kind === 'runtime-directive'), true);
assert.equal(jsPreservation.ledger.directives.some((entry) => entry.kind === 'source-map-comment'), true);
assert.equal(jsPreservation.ledger.directives.filter((entry) => entry.kind === 'module-directive').length, 2);
assert.deepEqual(jsPreservation.ledger.importExportSpans.map((entry) => entry.kind), ['import', 'export']);
assert.equal(jsPreservation.ledger.comments.some((entry) => entry.kind === 'source-map-comment'), true);
assert.equal(jsPreservation.summary.sourceMapComments, 1);
assert.equal(jsPreservation.ledger.protectedRegions.some((entry) => entry.kind === 'string' && entry.text.includes('not a brace')), true);
assert.equal(jsPreservation.ledger.protectedRegions.some((entry) => entry.kind === 'template'), true);
assert.equal(jsPreservation.ledger.protectedRegions.some((entry) => entry.kind === 'regex-like'), true);
const protectedRegions = jsPreservation.ledger.protectedRegions.map((entry) => entry.span);
assert.equal(jsPreservation.ledger.braces.some((entry) => protectedRegions.some((protectedSpan) => inside(entry.span, protectedSpan))), false);

const tsSource = [
  '/// <reference types="node" />',
  'import type { Readable } from "node:stream";',
  'export type Box<T> = { value: T };',
  '/*# sourceMappingURL=types.d.ts.map */',
  ''
].join('\r\n');
const tsPreservation = createNativeSourcePreservation({
  language: 'typescript',
  sourcePath: 'src/types.ts',
  sourceText: tsSource
});
assert.equal(tsPreservation.newline, 'crlf');
assert.equal(tsPreservation.ledger.trivia.some((entry) => entry.kind === 'newline' && entry.text === '\r\n'), true);
assert.equal(tsPreservation.ledger.directives.some((entry) => entry.kind === 'typescript-reference'), true);
assert.equal(tsPreservation.ledger.directives.some((entry) => entry.kind === 'source-map-comment'), true);
assert.deepEqual(tsPreservation.ledger.importExportSpans.map((entry) => entry.kind), ['import', 'export']);

const tsxPreservation = createNativeSourcePreservation({
  language: 'tsx',
  sourcePath: 'src/View.tsx',
  sourceText: [
    'import React from "react";',
    'export const View = ({ count }: { count: number }) => <Panel title="Hi">{count}</Panel>;',
    'const less = count < 10;',
    ''
  ].join('\n')
});
assert.equal(tsxPreservation.ledger.summary.jsxRegions, 1);
assert.equal(tsxPreservation.ledger.protectedRegions.some((entry) => entry.kind === 'jsx' && entry.text.startsWith('<Panel')), true);
assert.equal(tsxPreservation.ledger.tokens.some((entry) => entry.kind === 'operator' && entry.text === '<'), true);

const regexAndDivision = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/regex.js',
  sourceText: 'const pattern = /a\\/b/g;\nconst ratio = total / count;\n'
});
assert.equal(regexAndDivision.ledger.protectedRegions.filter((entry) => entry.kind === 'regex-like').length, 1);
assert.equal(regexAndDivision.ledger.tokens.some((entry) => entry.kind === 'operator' && entry.text === '/'), true);

const withoutLedger = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/no-ledger.js',
  sourceText: 'export const kept = true;\n',
  includeSourceLedger: false
});
assert.equal(withoutLedger.ledger, undefined);
assert.equal(withoutLedger.tokens.length > 0, true);
