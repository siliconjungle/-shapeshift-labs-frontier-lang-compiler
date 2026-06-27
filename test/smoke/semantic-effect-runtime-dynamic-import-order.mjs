import { assert } from './helpers.mjs';
import { createSemanticImportSidecar, importNativeSource } from './compiler-api.mjs';

const dynamicImportSource = [
  'export function loadLocale(locale) {',
  '  return import(`./locales/${locale}.json`);',
  '}',
  ''
].join('\n');

const dynamicImportSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/dynamic-import-order.ts',
  sourceText: dynamicImportSource
}), { generatedAt: 209 });
const dynamicImportRegion = dynamicImportSidecar.ownershipRegions
  .find((region) => region.regionKind === 'effect'
    && region.metadata?.factKinds?.includes('async')
    && region.metadata.runtimeOrderEvidence.sameLineDynamicImport?.length);

assert.ok(dynamicImportRegion);
assert.equal(dynamicImportRegion.symbolName, 'loadLocale:effect:template-interpolation+async#1');

const dynamicImportOrder = dynamicImportRegion.metadata.runtimeOrderEvidence.sameLineDynamicImport[0];
assert.equal(dynamicImportOrder.kind, 'dynamic-import');
assert.equal(dynamicImportOrder.specifierKind, 'template');
assert.equal(dynamicImportOrder.specifierText, '`./locales/${locale}.json`');
assert.equal(dynamicImportOrder.dynamicImportStaticSpecifierEvidence, false);
assert.equal(dynamicImportOrder.dynamicImportRuntimeResolutionClaim, false);
assert.equal(dynamicImportOrder.dynamicImportResolutionProofRequired, true);
assert.equal(dynamicImportOrder.runtimeEquivalenceClaim, false);

const sameLineDynamicImportSource = [
  'export function loadMany(locale, target) {',
  '  import(`./locales/${locale}.json`); import(target);',
  '}',
  ''
].join('\n');

const sameLineDynamicImportSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/dynamic-import-same-line-order.ts',
  sourceText: sameLineDynamicImportSource
}), { generatedAt: 210 });
const sameLineDynamicImportRegions = sameLineDynamicImportSidecar.ownershipRegions
  .filter((region) => region.regionKind === 'effect'
    && region.metadata?.runtimeOrderEvidence?.sameLineDynamicImport?.length);

assert.equal(sameLineDynamicImportRegions.length, 2);

const templateDynamicImportRegion = sameLineDynamicImportRegions
  .find((region) => region.symbolName === 'loadMany:effect:template-interpolation+async#1');
const identifierDynamicImportRegion = sameLineDynamicImportRegions
  .find((region) => region.symbolName === 'loadMany:effect:async#1');

assert.ok(templateDynamicImportRegion);
assert.ok(identifierDynamicImportRegion);
assert.equal(sourceTextForSpan(sameLineDynamicImportSource, templateDynamicImportRegion.sourceSpan), '`./locales/${locale}.json`');
assert.equal(sourceTextForSpan(sameLineDynamicImportSource, identifierDynamicImportRegion.sourceSpan), 'import(target)');

const identifierDynamicImportOrder = identifierDynamicImportRegion.metadata.runtimeOrderEvidence.sameLineDynamicImport[0];
assert.equal(identifierDynamicImportOrder.kind, 'dynamic-import');
assert.equal(identifierDynamicImportOrder.text, 'import(target)');
assert.equal(identifierDynamicImportOrder.specifierText, 'target');
assert.equal(identifierDynamicImportOrder.specifierKind, 'identifier');
assert.equal(identifierDynamicImportOrder.dynamicImportStaticSpecifierEvidence, false);
assert.equal(identifierDynamicImportOrder.dynamicImportRuntimeResolutionClaim, false);
assert.equal(identifierDynamicImportOrder.dynamicImportResolutionProofRequired, true);
assert.equal(identifierDynamicImportOrder.runtimeEquivalenceClaim, false);

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
