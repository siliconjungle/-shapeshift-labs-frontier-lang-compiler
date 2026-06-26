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
