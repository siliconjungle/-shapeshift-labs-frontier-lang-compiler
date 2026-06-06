import assert from 'node:assert/strict';
import {
  createSemanticImportSidecar,
  createSemanticSlice,
  createSemanticSliceAdmissionRecord,
  importNativeSource,
  testSemanticSlice
} from '../dist/index.js';

export function runRegionAndSliceCases() {
  runRegionTaxonomyCases();
  runSemanticSliceCases();
  runFalsePositiveRegionCase();
}

function runRegionTaxonomyCases() {
  for (let index = 0; index < 30; index += 1) {
    const imported = importNativeSource({
      language: 'typescript',
      sourcePath: `src/regions-${index}.ts`,
      sourceText: `
      export const appRoutes${index} = [
        { path: "/${index}", component: Screen${index} },
        { path: "/${index}/settings", component: Settings${index} }
      ];
      export const contentBlocks${index} = {
        docs: { title: "Docs ${index}" },
        legal: { title: "Legal ${index}" }
      };
      export const runtimeConfig${index} = {
        limits: { count: ${index} },
        resolve(id) { return id; }
      };
      export const helpers${index} = {
        plain: ${index}
      };
    `
    });
    const sidecar = createSemanticImportSidecar(imported);
    assert.ok(imported.semanticIndex.symbols.some((symbol) => symbol.metadata?.ownershipRegionKind === 'route'));
    assert.ok(imported.semanticIndex.symbols.some((symbol) => symbol.metadata?.ownershipRegionKind === 'content'));
    assert.ok(imported.semanticIndex.symbols.some((symbol) => symbol.metadata?.ownershipRegionKind === 'config'));
    assert.ok(imported.semanticIndex.symbols.some((symbol) => symbol.metadata?.ownershipRegionKind === 'property'));
    assert.ok(sidecar.regionTaxonomy.presentKinds.includes('route'));
    assert.ok(sidecar.regionTaxonomy.presentKinds.includes('content'));
    assert.ok(sidecar.regionTaxonomy.presentKinds.includes('config'));
    assert.ok(sidecar.regionTaxonomy.presentKinds.includes('property'));
  }
}

function runSemanticSliceCases() {
  for (let index = 0; index < 30; index += 1) {
    const sourceText = `export function sliceCase${index}(value) { return value + ${index}; }\nexport function helper${index}(value) { return value; }\n`;
    const imported = importNativeSource({
      language: index % 2 === 0 ? 'typescript' : 'javascript',
      sourcePath: `src/slice-${index}.${index % 2 === 0 ? 'ts' : 'js'}`,
      sourceText
    });
    const slice = createSemanticSlice(imported, {
      entryRefs: [`symbol:sliceCase${index}`],
      includeDependencies: index % 3 !== 0,
      focusedCommands: [`npm test -- slice-${index}`]
    });
    assert.equal(slice.unresolvedEntryRefs.length, 0);
    assert.ok(slice.symbols.some((symbol) => symbol.name === `sliceCase${index}`));
    assert.ok(slice.sourceMapLinks.length >= 1);
    const gate = testSemanticSlice(slice, { currentSources: { [imported.sourcePath]: sourceText } });
    assert.equal(gate.status, 'passed');
    const admission = createSemanticSliceAdmissionRecord(slice, { testResult: gate });
    assert.equal(admission.kind, 'frontier.lang.semanticSliceAdmission');
    assert.equal(admission.autoMergeClaim, false);
    assert.equal(admission.mergeScore.higherIsBetter, true);
    assert.equal(admission.mergeScore.components.sourceFreshness.score, 100);
    const staleAdmission = createSemanticSliceAdmissionRecord(slice, {
      currentSources: { [imported.sourcePath]: `${sourceText}\n// fuzz stale source\n` }
    });
    assert.equal(staleAdmission.action, 'reject');
    assert.equal(staleAdmission.mergeScore.components.sourceFreshness.score, 0);
  }
}

function runFalsePositiveRegionCase() {
  const imported = importNativeSource({
    language: 'typescript',
    sourcePath: 'src/region-false-positive.ts',
    sourceText: '/*\nexport const fakeRoutes = [{ path: "/fake" }];\n*/\nconst template = `\nexport const fakeContent = { docs: {} };\n`;\nexport const realRoutes = [\n  { path: "/real", component: Real }\n];\n'
  });
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeRoutes')), false);
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeContent')), false);
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name === 'realRoutes./real'), true);
}
