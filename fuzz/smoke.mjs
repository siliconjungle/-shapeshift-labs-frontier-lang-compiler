import assert from 'node:assert/strict';
import {
  compileNativeSource,
  compileFrontierSource,
  createClangAstNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createProjectionTargetLossMatrix,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSemanticImportSidecar,
  diffNativeSources,
  importExternalSemanticIndex,
  importNativeProject,
  importNativeSource,
  projectNativeImportToSource,
  runNativeImporterAdapter,
  summarizeNativeImportFeatureEvidence
} from '../dist/index.js';

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];
for (let index = 0; index < 100; index += 1) {
  const source = `
module Fuzz${index} @id("mod_${index}")
type ItemInput @id("type_input_${index}") {
  value: Text
}
entity Item @id("ent_${index}") {
  value @id("field_value_${index}"): Text
}
action updateItem @id("action_${index}") {
  input ItemInput
  writes field_value_${index}
  returns Patch
}
`;
  const result = compileFrontierSource(source, { target: targets[index % targets.length] });
  assert.equal(result.ok, true);
  assert.ok(result.output.length > 0);
}

for (let index = 0; index < 40; index += 1) {
  const external = importExternalSemanticIndex({
    format: index % 2 === 0 ? 'lsp' : 'scip',
    language: index % 2 === 0 ? 'javascript' : 'rust',
    payload: index % 2 === 0
      ? {
        uri: `file:///repo/src/external-${index}.js`,
        languageId: 'javascript',
        documentSymbols: [{
          name: `external${index}`,
          kind: 12,
          range: { start: { line: index % 7, character: 0 }, end: { line: index % 7, character: 20 } }
        }],
        diagnostics: index % 9 === 0 ? [{ severity: 2, message: 'fuzz warning' }] : []
      }
      : {
        metadata: { project_root: '/repo' },
        documents: [{
          relative_path: `src/external-${index}.rs`,
          language: 'rust',
          occurrences: [{
            symbol: `scip-rust cargo fuzz 1.0.0 src/external-${index}.rs/ external${index}().`,
            range: [index % 5, 4, 12],
            symbol_roles: 1
          }]
        }]
      }
  });
  assert.equal(external.kind, 'frontier.lang.externalSemanticIndexImport');
  assert.ok(external.semanticIndex.documents.length >= 1);
  assert.ok(external.semanticIndex.symbols.length >= 1);
  assert.ok(external.summary.sourceMapMappings >= 1);
  assert.ok(['ready-with-losses', 'needs-review'].includes(external.readiness.readiness));
}

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

const falsePositiveRegionImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/region-false-positive.ts',
  sourceText: '/*\nexport const fakeRoutes = [{ path: "/fake" }];\n*/\nconst template = `\nexport const fakeContent = { docs: {} };\n`;\nexport const realRoutes = [\n  { path: "/real", component: Real }\n];\n'
});
assert.equal(falsePositiveRegionImport.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeRoutes')), false);
assert.equal(falsePositiveRegionImport.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeContent')), false);
assert.equal(falsePositiveRegionImport.semanticIndex.symbols.some((symbol) => symbol.name === 'realRoutes./real'), true);

const estreeAdapter = createEstreeNativeImporterAdapter();
const pythonAstAdapter = createPythonAstNativeImporterAdapter();
const rustSynAdapter = createRustSynNativeImporterAdapter();
const clangAstAdapter = createClangAstNativeImporterAdapter();
for (let index = 0; index < 50; index += 1) {
  const name = `fuzzImport${index}`;
  const sourcePath = `src/fuzz-${index}.js`;
  const imported = await runNativeImporterAdapter(estreeAdapter, {
    sourcePath,
    sourceText: `export function ${name}() { return ${index}; }\n`,
    adapterOptions: {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } },
        body: [{
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name },
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } }
        }]
      }
    }
  });
  assert.equal(imported.nativeAst.rootId.startsWith('native_program'), true);
  assert.equal(imported.semanticIndex.symbols.some((symbol) => symbol.name === name), true);
  assert.ok(imported.sourceMaps[0].mappings.length >= 1);
  assert.equal(imported.adapter.coverage.capabilityEvidence.declared.exactAst, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.observed.sourceRanges, true);
  assert.equal(imported.adapter.coverage.capabilityEvidence.gaps.includes('tokens'), true);
  const pythonAstImport = await runNativeImporterAdapter(pythonAstAdapter, {
    sourcePath: `src/fuzz-${index}.py`,
    sourceText: `def fuzz_py_${index}(value):\n    return value\n`,
    adapterOptions: {
      ast: {
        _type: 'Module',
        body: [{
          _type: 'FunctionDef',
          name: `fuzz_py_${index}`,
          lineno: 1,
          col_offset: 0,
          end_lineno: 2,
          end_col_offset: 16,
          args: { _type: 'arguments', args: [{ _type: 'arg', arg: 'value', lineno: 1, col_offset: 12 }], defaults: [] },
          body: [{ _type: 'Return', lineno: 2, col_offset: 4, value: { _type: 'Name', id: 'value', lineno: 2, col_offset: 11 } }],
          decorator_list: []
        }],
        type_ignores: []
      }
    }
  });
  assert.equal(pythonAstImport.adapter.parser, 'python-ast');
  assert.equal(pythonAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
  assert.equal(pythonAstImport.semanticIndex.symbols.some((symbol) => symbol.name === `fuzz_py_${index}`), true);
  const rustSynImport = await runNativeImporterAdapter(rustSynAdapter, {
    sourcePath: `src/fuzz-${index}.rs`,
    sourceText: `pub struct FuzzRust${index};\npub fn fuzz_rust_${index}() {}\n`,
    adapterOptions: {
      ast: {
        kind: 'File',
        items: [{
          kind: 'ItemStruct',
          ident: `FuzzRust${index}`,
          vis: 'pub',
          span: { startLine: 1, startColumn: 0 }
        }, {
          kind: 'ItemFn',
          vis: 'pub',
          sig: { kind: 'Signature', ident: `fuzz_rust_${index}`, inputs: [] },
          block: { kind: 'Block', stmts: [] },
          span: { startLine: 2, startColumn: 0 }
        }]
      }
    }
  });
  assert.equal(rustSynImport.adapter.parser, 'syn');
  assert.equal(rustSynImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
  assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === `fuzz_rust_${index}`), true);
  const clangAstImport = await runNativeImporterAdapter(clangAstAdapter, {
    sourcePath: `src/fuzz-${index}.c`,
    sourceText: `typedef struct FuzzC${index} { int value; } FuzzC${index};\nint fuzz_c_${index}(void) { return ${index}; }\n`,
    adapterOptions: {
      ast: {
        kind: 'TranslationUnitDecl',
        inner: [{
          kind: 'TypedefDecl',
          name: `FuzzC${index}`,
          type: { qualType: `struct FuzzC${index}` },
          range: { begin: { line: 1, col: 1 } },
          inner: [{
            kind: 'RecordDecl',
            name: `FuzzC${index}`,
            tagUsed: 'struct',
            completeDefinition: true,
            inner: [{ kind: 'FieldDecl', name: 'value', type: { qualType: 'int' } }]
          }]
        }, {
          kind: 'FunctionDecl',
          name: `fuzz_c_${index}`,
          type: { qualType: 'int (void)' },
          isThisDeclarationADefinition: true,
          range: { begin: { line: 2, col: 1 } },
          inner: [{ kind: 'CompoundStmt' }]
        }]
      }
    }
  });
  assert.equal(clangAstImport.adapter.parser, 'clang');
  assert.equal(clangAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
  assert.equal(clangAstImport.semanticIndex.symbols.some((symbol) => symbol.name === `fuzz_c_${index}`), true);

  const lightweight = importNativeSource({
    language: index % 2 === 0 ? 'javascript' : 'python',
    sourcePath: index % 2 === 0 ? `src/light-${index}.js` : `light-${index}.py`,
    sourceText: index % 2 === 0
      ? `export function light${index}() { return true; }\n`
      : `def light_${index}():\n    return True\n`
  });
  assert.ok(lightweight.semanticIndex.symbols.length >= 1);
  assert.ok(lightweight.mergeCandidates.length >= 1);
  assert.equal(lightweight.metadata.sourcePreservation.sourceHash, lightweight.nativeSource.sourceHash);
  assert.equal(lightweight.metadata.sourcePreservation.summary.exactSourceAvailable, true);
  const lightweightChange = diffNativeSources({
    language: index % 2 === 0 ? 'javascript' : 'python',
    sourcePath: index % 2 === 0 ? `src/light-${index}.js` : `light-${index}.py`,
    beforeSourceText: index % 2 === 0
      ? `export function light${index}() { return true; }\n`
      : `def light_${index}():\n    return True\n`,
    afterSourceText: index % 2 === 0
      ? `export function light${index}() { return false; }\n`
      : `def light_${index}():\n    return False\n`
  });
  assert.ok(lightweightChange.changedRegions.length >= 1);
  assert.equal(lightweightChange.metadata.changedRegionProjectionSummary.withProjection, lightweightChange.changedRegions.length);
  assert.equal(lightweightChange.metadata.changedRegionProjectionSummary.autoMergeClaims, 0);
  assert.equal(lightweightChange.changedRegions.every((region) => region.metadata.changedRegionProjection.reviewRequired === true), true);
  const sidecar = createSemanticImportSidecar(lightweight);
  assert.equal(sidecar.summary.emptySemanticIndex, false);
  assert.ok(sidecar.ownershipRegions.length >= 1);
  assert.ok(sidecar.patchHints.length >= 1);
  const featureEvidence = summarizeNativeImportFeatureEvidence(lightweight.losses, {
    evidence: lightweight.evidence
  });
  assert.equal(featureEvidence.total, 0);
  const projection = projectNativeImportToSource(lightweight, {
    ...(index % 4 === 0 ? { sourceText: lightweight.nativeSource.ast.metadata.sourceBytes ? (index % 2 === 0 ? `export function light${index}() { return true; }\n` : `def light_${index}():\n    return True\n`) : undefined } : {})
  });
  assert.equal(projection.kind, 'frontier.lang.nativeSourceProjection');
  assert.equal(projection.mode, 'preserved-source');
  assert.ok(projection.sourceText.length > 0);
  const nativeCompile = compileNativeSource(lightweight, {
    target: index % 2 === 0 ? 'javascript' : 'python'
  });
  assert.equal(nativeCompile.kind, 'frontier.lang.nativeSourceCompileResult');
  assert.equal(nativeCompile.outputMode, 'preserved-source');
  assert.equal(nativeCompile.targetCoverage.supported, true);
  assert.ok(nativeCompile.projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 1);
  assert.ok(nativeCompile.output.length > 0);
  assert.equal(nativeCompile.sourceMaps.length, 1);
  assert.ok(nativeCompile.sourceMap.mappings.length >= 1);
  assert.ok(nativeCompile.sourceMap.targetHash);
  const blockedNativeCompile = compileNativeSource(lightweight, {
    target: index % 2 === 0 ? 'rust' : 'javascript'
  });
  assert.equal(blockedNativeCompile.readiness.readiness, 'blocked');
  assert.equal(blockedNativeCompile.ok, false);
  assert.equal(blockedNativeCompile.sourceMaps.length, 1);
  assert.ok(blockedNativeCompile.sourceMap.mappings.length >= 1);
  if (index % 5 === 0) {
    const targetAdapter = {
      id: `fuzz-target-adapter-${index}`,
      sourceLanguage: lightweight.language,
      target: index % 2 === 0 ? 'rust' : 'javascript',
      coverage: {
        readiness: 'needs-review',
        handledLossKinds: ['dynamicRuntime', 'dynamicDispatch', 'typeInference', 'overloadResolution']
      },
      project() {
        return { output: `// fuzz target adapter ${index}\n`, readiness: 'needs-review' };
      }
    };
    const adapterNativeCompile = compileNativeSource(lightweight, {
      target: targetAdapter.target,
      targetAdapters: [targetAdapter]
    });
    assert.equal(adapterNativeCompile.outputMode, 'target-adapter');
    assert.equal(adapterNativeCompile.targetCoverage.lossClass, 'targetAdapterProjection');
    assert.ok(adapterNativeCompile.output.includes(`fuzz target adapter ${index}`));
    assert.equal(adapterNativeCompile.sourceMaps.length, 1);
    assert.ok(adapterNativeCompile.sourceMap.mappings.length >= 1);
  }
}

const project = await importNativeProject({
  sources: [{
    language: 'javascript',
    sourcePath: 'src/project-fuzz.js',
    sourceText: 'export function projectFuzz() {}\n'
  }, {
    language: 'python',
    sourcePath: 'project_fuzz.py',
    sourceText: 'def project_fuzz():\n    return True\n'
  }]
});
assert.equal(project.kind, 'frontier.lang.projectImportResult');
assert.equal(project.imports.length, 2);
assert.ok(project.semanticIndex.symbols.length >= 2);
const matrix = createNativeImportCoverageMatrix({ imports: project.imports });
assert.equal(matrix.summary.imports, 2);
assert.ok(matrix.languages.find((entry) => entry.language === 'javascript').imports.symbols >= 1);
assert.ok(matrix.languages.find((entry) => entry.language === 'python').imports.symbols >= 1);
const parserFormatMatrix = createNativeParserAstFormatMatrix({
  imports: project.imports,
  adapters: [estreeAdapter, pythonAstAdapter, rustSynAdapter, clangAstAdapter]
});
assert.ok(parserFormatMatrix.summary.formats >= 2);
assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'python-ast').adapters.total >= 1);
assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'rust-syn').adapters.total >= 1);
assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'clang-ast-json').adapters.total >= 1);
const projectionMatrix = createProjectionTargetLossMatrix({ imports: project.imports });
assert.equal(projectionMatrix.summary.languages, matrix.summary.languages);
assert.ok(projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 2);
assert.ok(projectionMatrix.summary.byLossClass.missingAdapter > 0);
const projectSidecar = createSemanticImportSidecar(project);
assert.equal(projectSidecar.summary.imports, 2);
assert.equal(projectSidecar.summary.emptySemanticIndex, false);
